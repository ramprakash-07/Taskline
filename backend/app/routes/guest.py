"""
Guest session endpoints — create temporary sessions and convert to permanent accounts.
"""

import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth import get_current_user
from app.database import get_database
from app.models import GuestSessionResponse, GuestConvertRequest, MessageResponse

router = APIRouter(prefix="/api/guest", tags=["Guest"])

GUEST_SESSION_DURATION_HOURS = 2


@router.post("/session", response_model=GuestSessionResponse)
async def create_guest_session(
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Create a new guest session with a 2-hour expiry."""
    guest_id = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=GUEST_SESSION_DURATION_HOURS)

    await db.guest_sessions.insert_one({
        "guest_id": guest_id,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
    })

    return GuestSessionResponse(
        guest_id=guest_id,
        expires_at=expires_at,
    )


@router.post("/convert", response_model=MessageResponse)
async def convert_guest_to_user(
    body: GuestConvertRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Convert a guest queue to a permanent user-owned queue.
    Requires Clerk authentication — the guest items are transferred
    to the authenticated user's account.
    """
    guest_id = body.guest_id

    # Verify the guest session exists
    session = await db.guest_sessions.find_one({"guest_id": guest_id})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest session not found",
        )

    # Find the current max position for the authenticated user
    last_item = await db.queue_items.find_one(
        {"user_id": user_id},
        sort=[("position", -1)],
    )
    position_offset = (last_item["position"] + 1) if last_item else 0

    # Transfer all guest items to the authenticated user
    guest_items = await db.queue_items.find(
        {"user_id": guest_id, "is_guest": True}
    ).sort("position", 1).to_list(length=500)

    if guest_items:
        from pymongo import UpdateOne
        operations = [
            UpdateOne(
                {"_id": item["_id"]},
                {
                    "$set": {
                        "user_id": user_id,
                        "is_guest": False,
                        "position": position_offset + idx,
                    },
                    "$unset": {"expires_at": ""},
                },
            )
            for idx, item in enumerate(guest_items)
        ]
        await db.queue_items.bulk_write(operations)

    # Delete the guest session
    await db.guest_sessions.delete_one({"guest_id": guest_id})

    count = len(guest_items)
    return MessageResponse(
        message=f"Successfully converted {count} guest item{'s' if count != 1 else ''} to your account!"
    )
