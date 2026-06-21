"""
Streak tracking endpoints — tracks daily completion streaks per user.
Authenticated users only (no guest support).
"""

from datetime import datetime, timezone, timedelta, date
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth import get_current_user
from app.database import get_database
from app.models import StreakResponse

router = APIRouter(prefix="/api/streak", tags=["Streak"])


def _today_utc() -> date:
    """Get today's date in UTC."""
    return datetime.now(timezone.utc).date()


def _streak_doc_to_response(doc: dict, streak_increased: bool = False) -> StreakResponse:
    """Convert a MongoDB streak document to StreakResponse."""
    last_date = doc.get("last_completed_date")
    return StreakResponse(
        current_streak=doc.get("current_streak", 0),
        longest_streak=doc.get("longest_streak", 0),
        last_completed_date=last_date if isinstance(last_date, str) else (
            last_date.strftime("%Y-%m-%d") if last_date else None
        ),
        streak_increased=streak_increased,
    )


@router.get("", response_model=StreakResponse)
async def get_streak(
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get the current user's streak data."""
    doc = await db.streaks.find_one({"user_id": user_id})

    if not doc:
        return StreakResponse()

    return _streak_doc_to_response(doc)


@router.post("/complete", response_model=StreakResponse)
async def complete_streak(
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Record a streak completion for today.
    
    Logic:
    - Already completed today → no-op, return current data
    - Last completion was yesterday → increment streak
    - Last completion was older → reset streak to 1
    - No previous record → start streak at 1
    """
    today = _today_utc()
    today_str = today.strftime("%Y-%m-%d")

    doc = await db.streaks.find_one({"user_id": user_id})

    if not doc:
        # First ever completion
        new_doc = {
            "user_id": user_id,
            "current_streak": 1,
            "longest_streak": 1,
            "last_completed_date": today_str,
            "created_at": datetime.now(timezone.utc),
        }
        await db.streaks.insert_one(new_doc)
        return _streak_doc_to_response(new_doc, streak_increased=True)

    last_date_str = doc.get("last_completed_date")

    # Parse the last completed date
    if last_date_str:
        if isinstance(last_date_str, str):
            last_date = datetime.strptime(last_date_str, "%Y-%m-%d").date()
        else:
            last_date = last_date_str.date() if hasattr(last_date_str, 'date') else last_date_str
    else:
        last_date = None

    # Already completed today — no-op
    if last_date == today:
        return _streak_doc_to_response(doc, streak_increased=False)

    yesterday = today - timedelta(days=1)
    streak_increased = False

    if last_date == yesterday:
        # Consecutive day — increment streak
        new_streak = doc.get("current_streak", 0) + 1
        streak_increased = True
    else:
        # Missed a day (or first time) — reset to 1
        new_streak = 1
        streak_increased = True

    new_longest = max(doc.get("longest_streak", 0), new_streak)

    await db.streaks.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "current_streak": new_streak,
                "longest_streak": new_longest,
                "last_completed_date": today_str,
            }
        },
    )

    updated_doc = {
        **doc,
        "current_streak": new_streak,
        "longest_streak": new_longest,
        "last_completed_date": today_str,
    }

    return _streak_doc_to_response(updated_doc, streak_increased=streak_increased)
