"""Room (Team Queue) routes — CRUD for rooms and shared task queues."""

from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth import get_current_user
from app.config import get_settings
from app.database import get_database
from app.models import (
    MessageResponse,
    QueueReorderRequest,
    RoomCreate,
    RoomResponse,
    RoomTaskCreate,
    RoomTaskResponse,
    RoomTaskUpdate,
)
from app.ws.rooms import broadcast_room_update

router = APIRouter(prefix="/api/rooms", tags=["Rooms"])


# ─── Helper Functions ───


def _to_room_response(doc: dict) -> RoomResponse:
    """Convert a MongoDB room document to a RoomResponse."""
    return RoomResponse(
        id=str(doc["_id"]),
        room_name=doc["room_name"],
        owner_id=doc["owner_id"],
        member_ids=doc.get("member_ids", []),
        invite_link=doc.get("invite_link", ""),
        created_at=doc["created_at"],
    )


def _to_task_response(doc: dict) -> RoomTaskResponse:
    """Convert a MongoDB room_task document to a RoomTaskResponse."""
    return RoomTaskResponse(
        id=str(doc["_id"]),
        room_id=doc["room_id"],
        assigned_to=doc["assigned_to"],
        name=doc["name"],
        task=doc["task"],
        priority=doc["priority"],
        deadline=doc.get("deadline"),
        position=doc["position"],
        created_at=doc["created_at"],
    )


async def _verify_membership(
    db: AsyncIOMotorDatabase, room_id: str, user_id: str
) -> dict:
    """Verify user is a member of the room. Returns the room doc or raises 403.

    Args:
        db: The database instance.
        room_id: The room's ObjectId as a string.
        user_id: The authenticated user's ID.

    Returns:
        The room document if the user is a member.

    Raises:
        HTTPException: 404 if room not found, 403 if user is not a member.
    """
    if not ObjectId.is_valid(room_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    room = await db.rooms.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    if user_id not in room.get("member_ids", []) and user_id != room["owner_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this room",
        )

    return room


async def _verify_owner(
    db: AsyncIOMotorDatabase, room_id: str, user_id: str
) -> dict:
    """Verify user is the owner of the room. Returns the room doc or raises 403.

    Args:
        db: The database instance.
        room_id: The room's ObjectId as a string.
        user_id: The authenticated user's ID.

    Returns:
        The room document if the user is the owner.

    Raises:
        HTTPException: 404 if room not found, 403 if user is not the owner.
    """
    if not ObjectId.is_valid(room_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    room = await db.rooms.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    if room["owner_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the room owner can perform this action",
        )

    return room


async def _recompute_room_positions(
    db: AsyncIOMotorDatabase, room_id: str
) -> None:
    """Recompute sequential positions for all tasks in a room after mutations.

    Args:
        db: The database instance.
        room_id: The room's ObjectId as a string.
    """
    cursor = db.room_tasks.find({"room_id": room_id}).sort("position", 1)
    position = 0
    async for task_doc in cursor:
        if task_doc["position"] != position:
            await db.room_tasks.update_one(
                {"_id": task_doc["_id"]},
                {"$set": {"position": position}},
            )
        position += 1


# ─── Room CRUD Endpoints ───


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    body: RoomCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Create a new team room.

    The creator becomes the owner and first member. An invite link is
    generated using the room's ObjectId.
    """
    settings = get_settings()
    room_id = ObjectId()

    room_doc = {
        "_id": room_id,
        "room_name": body.room_name,
        "owner_id": user_id,
        "member_ids": [user_id],
        "invite_link": f"{settings.FRONTEND_URL}/join/{str(room_id)}",
        "created_at": datetime.now(timezone.utc),
    }

    await db.rooms.insert_one(room_doc)
    return _to_room_response(room_doc)


@router.get("", response_model=List[RoomResponse])
async def list_rooms(
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """List all rooms where the current user is a member or owner."""
    cursor = db.rooms.find({
        "$or": [
            {"member_ids": user_id},
            {"owner_id": user_id},
        ]
    })
    rooms = await cursor.to_list(100)
    return [_to_room_response(r) for r in rooms]


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get room details. User must be a member."""
    room = await _verify_membership(db, room_id, user_id)
    return _to_room_response(room)


@router.post("/{room_id}/join", response_model=RoomResponse)
async def join_room(
    room_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Join a room by adding the user to member_ids if not already present."""
    if not ObjectId.is_valid(room_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    room = await db.rooms.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    if user_id not in room.get("member_ids", []):
        await db.rooms.update_one(
            {"_id": ObjectId(room_id)},
            {"$addToSet": {"member_ids": user_id}},
        )
        room["member_ids"].append(user_id)

    await broadcast_room_update(room_id, "member_joined", {"user_id": user_id})
    return _to_room_response(room)


@router.delete("/{room_id}", response_model=MessageResponse)
async def delete_room(
    room_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Delete a room and all its tasks. Owner only."""
    await _verify_owner(db, room_id, user_id)

    # Delete all tasks in the room
    await db.room_tasks.delete_many({"room_id": room_id})
    # Delete the room itself
    await db.rooms.delete_one({"_id": ObjectId(room_id)})

    await broadcast_room_update(room_id, "room_deleted", {})
    return MessageResponse(message="Room deleted successfully")


# ─── Room Queue Endpoints ───


@router.get("/{room_id}/queue", response_model=List[RoomTaskResponse])
async def get_room_queue(
    room_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get all tasks in a room's queue, sorted by position. User must be a member."""
    await _verify_membership(db, room_id, user_id)

    cursor = db.room_tasks.find({"room_id": room_id}).sort("position", 1)
    tasks = await cursor.to_list(200)
    return [_to_task_response(t) for t in tasks]


@router.post(
    "/{room_id}/tasks",
    response_model=RoomTaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_room_task(
    room_id: str,
    body: RoomTaskCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Add a task to the room's queue.

    The assigned_to user must be a current member of the room.
    Position is auto-assigned to the end of the queue.
    """
    room = await _verify_membership(db, room_id, user_id)

    # Verify assigned_to is a room member
    if body.assigned_to not in room.get("member_ids", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned user is not a member of this room",
        )

    # Auto-position: count existing tasks
    count = await db.room_tasks.count_documents({"room_id": room_id})

    task_doc = {
        "_id": ObjectId(),
        "room_id": room_id,
        "assigned_to": body.assigned_to,
        "name": body.name,
        "task": body.task,
        "priority": body.priority.value,
        "deadline": body.deadline,
        "position": count,
        "created_at": datetime.now(timezone.utc),
    }

    await db.room_tasks.insert_one(task_doc)

    response = _to_task_response(task_doc)
    await broadcast_room_update(room_id, "task_added", response.model_dump(mode="json"))
    return response


@router.put("/{room_id}/tasks/reorder", response_model=MessageResponse)
async def reorder_room_tasks(
    room_id: str,
    body: QueueReorderRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Reorder tasks in the room's queue. Owner only.

    Accepts an ordered list of task IDs representing the new order.
    """
    await _verify_owner(db, room_id, user_id)

    for position, item_id in enumerate(body.item_ids):
        if not ObjectId.is_valid(item_id):
            continue
        await db.room_tasks.update_one(
            {"_id": ObjectId(item_id), "room_id": room_id},
            {"$set": {"position": position}},
        )

    await broadcast_room_update(room_id, "queue_reordered", {"order": body.item_ids})
    return MessageResponse(message="Room queue reordered successfully")


@router.put("/{room_id}/tasks/{task_id}", response_model=RoomTaskResponse)
async def update_room_task(
    room_id: str,
    task_id: str,
    body: RoomTaskUpdate,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Update a task in the room's queue. Allowed for room owner or the assigned user."""
    room = await _verify_membership(db, room_id, user_id)

    if not ObjectId.is_valid(task_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    task_doc = await db.room_tasks.find_one(
        {"_id": ObjectId(task_id), "room_id": room_id}
    )
    if not task_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found in this room",
        )

    # Only owner or assignee can update
    if user_id != room["owner_id"] and user_id != task_doc["assigned_to"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the room owner or assigned user can update this task",
        )

    # Build update dict from non-None fields
    update_data = {}
    if body.name is not None:
        update_data["name"] = body.name
    if body.task is not None:
        update_data["task"] = body.task
    if body.priority is not None:
        update_data["priority"] = body.priority.value
    if body.deadline is not None:
        update_data["deadline"] = body.deadline
    if body.assigned_to is not None:
        # Verify new assignee is a member
        if body.assigned_to not in room.get("member_ids", []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned user is not a member of this room",
            )
        update_data["assigned_to"] = body.assigned_to

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    await db.room_tasks.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": update_data},
    )

    updated = await db.room_tasks.find_one({"_id": ObjectId(task_id)})
    response = _to_task_response(updated)
    await broadcast_room_update(room_id, "task_updated", response.model_dump(mode="json"))
    return response


@router.delete("/{room_id}/tasks/{task_id}", response_model=MessageResponse)
async def delete_room_task(
    room_id: str,
    task_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Delete a task from the room's queue. Owner only."""
    await _verify_owner(db, room_id, user_id)

    if not ObjectId.is_valid(task_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    result = await db.room_tasks.delete_one(
        {"_id": ObjectId(task_id), "room_id": room_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found in this room",
        )

    await _recompute_room_positions(db, room_id)
    await broadcast_room_update(room_id, "task_deleted", {"task_id": task_id})
    return MessageResponse(message="Task deleted from room queue")


@router.post(
    "/{room_id}/tasks/{task_id}/complete", response_model=MessageResponse
)
async def complete_room_task(
    room_id: str,
    task_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Complete a task in the room's queue.

    Allowed for room owner or the assigned user. The task is removed from
    the queue and positions are recomputed.
    """
    room = await _verify_membership(db, room_id, user_id)

    if not ObjectId.is_valid(task_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    task_doc = await db.room_tasks.find_one(
        {"_id": ObjectId(task_id), "room_id": room_id}
    )
    if not task_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found in this room",
        )

    # Only owner or assignee can complete
    if user_id != room["owner_id"] and user_id != task_doc["assigned_to"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the room owner or assigned user can complete this task",
        )

    task_name = task_doc["name"]
    await db.room_tasks.delete_one({"_id": ObjectId(task_id)})

    await _recompute_room_positions(db, room_id)
    await broadcast_room_update(
        room_id, "task_completed", {"task_id": task_id, "name": task_name}
    )
    return MessageResponse(message=f"Task '{task_name}' completed!", name=task_name)
