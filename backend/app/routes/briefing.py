"""Briefing routes — morning briefing data and preference management."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth import get_current_user
from app.database import get_database
from app.models import BriefingData, BriefingPreferences, QueueItemResponse

router = APIRouter(prefix="/api/briefing", tags=["Briefing"])


def _to_queue_item_response(doc: dict) -> QueueItemResponse:
    """Convert a MongoDB queue_items document to a QueueItemResponse."""
    return QueueItemResponse(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        name=doc["name"],
        task=doc["task"],
        priority=doc["priority"],
        deadline=doc.get("deadline"),
        position=doc["position"],
        created_at=doc["created_at"],
        is_guest=doc.get("is_guest", False),
        expires_at=doc.get("expires_at"),
    )


@router.get("", response_model=BriefingData)
async def get_briefing(
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Build today's morning briefing.

    Fetches the user's queue, identifies the UP NEXT task (position 0),
    counts urgent tasks (those with a deadline within 3 days), retrieves
    streak data, and checks if today's briefing was already dismissed.
    """
    # Fetch user's queue sorted by position
    items = await db.queue_items.find(
        {"user_id": user_id}
    ).sort("position", 1).to_list(200)

    task_count = len(items)

    # UP NEXT = first item in queue (position 0)
    up_next = None
    if items:
        up_next = _to_queue_item_response(items[0])

    # Count urgent tasks: those with a deadline within 3 days from now
    now = datetime.now(timezone.utc)
    urgent_count = 0
    for item in items:
        deadline = item.get("deadline")
        if deadline and isinstance(deadline, datetime):
            delta = deadline - now
            if delta.total_seconds() > 0 and delta.days <= 3:
                urgent_count += 1

    # Fetch streak data
    streak_doc = await db.streaks.find_one({"user_id": user_id})
    current_streak = streak_doc.get("current_streak", 0) if streak_doc else 0

    # Build greeting from first task's name
    greeting_name = items[0]["name"] if items else "there"
    greeting = f"Good morning, {greeting_name}!"

    # Check if dismissed today
    prefs = await db.user_preferences.find_one({"user_id": user_id})
    dismissed_today = False
    if prefs and prefs.get("last_briefing_dismissed"):
        last_dismissed = prefs["last_briefing_dismissed"]
        if isinstance(last_dismissed, str):
            dismissed_today = last_dismissed == now.strftime("%Y-%m-%d")
        elif isinstance(last_dismissed, datetime):
            dismissed_today = last_dismissed.date() == now.date()

    return BriefingData(
        greeting=greeting,
        task_count=task_count,
        up_next=up_next,
        urgent_count=urgent_count,
        current_streak=current_streak,
        dismissed_today=dismissed_today,
    )


@router.get("/preferences", response_model=BriefingPreferences)
async def get_preferences(
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Fetch the user's briefing preferences. Returns defaults if not set."""
    prefs = await db.user_preferences.find_one({"user_id": user_id})

    if not prefs:
        return BriefingPreferences()

    return BriefingPreferences(
        briefing_enabled=prefs.get("briefing_enabled", True),
        briefing_time=prefs.get("briefing_time", "09:00"),
        timezone=prefs.get("timezone", "UTC"),
        email=prefs.get("email"),
    )


@router.put("/preferences", response_model=BriefingPreferences)
async def update_preferences(
    body: BriefingPreferences,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Upsert the user's briefing preferences."""
    update_data = {
        "user_id": user_id,
        "briefing_enabled": body.briefing_enabled,
        "briefing_time": body.briefing_time,
        "timezone": body.timezone,
        "email": body.email,
    }

    await db.user_preferences.update_one(
        {"user_id": user_id},
        {"$set": update_data},
        upsert=True,
    )

    return body


@router.post("/dismiss")
async def dismiss_briefing(
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Dismiss today's briefing.

    Sets last_briefing_dismissed to today's UTC date string in the
    user_preferences collection.
    """
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    await db.user_preferences.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "last_briefing_dismissed": today_str,
        }},
        upsert=True,
    )

    return {"message": "Briefing dismissed for today", "date": today_str}
