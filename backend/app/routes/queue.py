"""
Queue CRUD endpoints — supports both authenticated users and guests.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Tuple
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth import get_current_user_or_guest
from app.database import get_database
from app.models import (
    QueueItemCreate,
    QueueItemUpdate,
    QueueItemResponse,
    QueueReorderRequest,
    MessageResponse,
)

router = APIRouter(prefix="/api/queue", tags=["Queue"])

GUEST_MAX_ITEMS = 10
GUEST_SESSION_DURATION_HOURS = 2


def _to_response(doc: dict) -> QueueItemResponse:
    """Convert a MongoDB document to a QueueItemResponse."""
    return QueueItemResponse(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        name=doc["name"],
        task=doc["task"],
        priority=doc["priority"],
        deadline=doc.get("deadline"),
        position=doc.get("position", 0),
        created_at=doc.get("created_at", datetime.now(timezone.utc)),
        is_guest=doc.get("is_guest", False),
        expires_at=doc.get("expires_at"),
    )


def _validate_object_id(item_id: str) -> ObjectId:
    """Validate and convert a string to ObjectId."""
    try:
        return ObjectId(item_id)
    except (InvalidId, Exception):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid item ID: {item_id}",
        )


@router.get("", response_model=List[QueueItemResponse])
async def get_queue(
    auth: Tuple[str, bool] = Depends(get_current_user_or_guest),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get all queue items for the current user/guest, ordered by position."""
    user_id, is_guest = auth
    cursor = db.queue_items.find({"user_id": user_id}).sort("position", 1)
    items = await cursor.to_list(length=500)
    return [_to_response(item) for item in items]


@router.post("", response_model=QueueItemResponse, status_code=status.HTTP_201_CREATED)
async def create_queue_item(
    item: QueueItemCreate,
    auth: Tuple[str, bool] = Depends(get_current_user_or_guest),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Create a new queue item at the end of the user's queue."""
    user_id, is_guest = auth

    # Enforce guest item limit
    if is_guest:
        count = await db.queue_items.count_documents({"user_id": user_id})
        if count >= GUEST_MAX_ITEMS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Guest users are limited to {GUEST_MAX_ITEMS} items. Sign up for unlimited access!",
            )

    # Find the current max position for this user
    last_item = await db.queue_items.find_one(
        {"user_id": user_id},
        sort=[("position", -1)],
    )
    next_position = (last_item["position"] + 1) if last_item else 0

    doc = {
        "user_id": user_id,
        "name": item.name,
        "task": item.task,
        "priority": item.priority.value,
        "deadline": item.deadline,
        "position": next_position,
        "created_at": datetime.now(timezone.utc),
    }

    # Add guest-specific fields
    if is_guest:
        doc["is_guest"] = True
        doc["expires_at"] = datetime.now(timezone.utc) + timedelta(hours=GUEST_SESSION_DURATION_HOURS)

    result = await db.queue_items.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_response(doc)


@router.put("/reorder", response_model=MessageResponse)
async def reorder_queue(
    reorder: QueueReorderRequest,
    auth: Tuple[str, bool] = Depends(get_current_user_or_guest),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Reorder queue items. Accepts a list of item IDs in desired order."""
    user_id, is_guest = auth

    # Validate all IDs and verify ownership
    object_ids = [_validate_object_id(id_str) for id_str in reorder.item_ids]

    # Verify all items belong to this user
    count = await db.queue_items.count_documents({
        "_id": {"$in": object_ids},
        "user_id": user_id,
    })

    if count != len(object_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Some items not found or don't belong to you",
        )

    # Update positions in bulk
    from pymongo import UpdateOne
    operations = [
        UpdateOne(
            {"_id": oid, "user_id": user_id},
            {"$set": {"position": idx}},
        )
        for idx, oid in enumerate(object_ids)
    ]

    if operations:
        await db.queue_items.bulk_write(operations)

    return MessageResponse(message=f"Reordered {len(operations)} items")


@router.put("/{item_id}", response_model=QueueItemResponse)
async def update_queue_item(
    item_id: str,
    update: QueueItemUpdate,
    auth: Tuple[str, bool] = Depends(get_current_user_or_guest),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Update a queue item's fields."""
    user_id, is_guest = auth
    oid = _validate_object_id(item_id)

    # Build update dict with only provided fields
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if "priority" in update_data:
        update_data["priority"] = update_data["priority"].value if hasattr(update_data["priority"], "value") else update_data["priority"]

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    result = await db.queue_items.find_one_and_update(
        {"_id": oid, "user_id": user_id},
        {"$set": update_data},
        return_document=True,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Queue item not found",
        )

    return _to_response(result)


@router.delete("/{item_id}", response_model=MessageResponse)
async def delete_queue_item(
    item_id: str,
    auth: Tuple[str, bool] = Depends(get_current_user_or_guest),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Delete a queue item and recompute positions."""
    user_id, is_guest = auth
    oid = _validate_object_id(item_id)

    # Find and delete the item
    deleted = await db.queue_items.find_one_and_delete(
        {"_id": oid, "user_id": user_id},
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Queue item not found",
        )

    # Recompute positions for remaining items
    await _recompute_positions(db, user_id)

    return MessageResponse(message=f"Deleted '{deleted['name']}' from queue")


@router.post("/{item_id}/complete", response_model=MessageResponse)
async def complete_queue_item(
    item_id: str,
    auth: Tuple[str, bool] = Depends(get_current_user_or_guest),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Mark a queue item as complete (removes it from the queue)."""
    user_id, is_guest = auth
    oid = _validate_object_id(item_id)

    # Find and delete the completed item
    completed = await db.queue_items.find_one_and_delete(
        {"_id": oid, "user_id": user_id},
    )

    if not completed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Queue item not found",
        )

    # Recompute positions for remaining items
    await _recompute_positions(db, user_id)

    return MessageResponse(
        message=f"🏁 {completed['name']} crossed the finish line!",
        name=completed["name"],
    )


async def _recompute_positions(db: AsyncIOMotorDatabase, user_id: str):
    """Recompute sequential positions for all items belonging to a user."""
    from pymongo import UpdateOne

    cursor = db.queue_items.find({"user_id": user_id}).sort("position", 1)
    items = await cursor.to_list(length=500)

    if items:
        operations = [
            UpdateOne({"_id": item["_id"]}, {"$set": {"position": idx}})
            for idx, item in enumerate(items)
        ]
        await db.queue_items.bulk_write(operations)
