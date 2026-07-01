"""Background scheduler for daily briefing emails."""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def check_and_send_briefings():
    """Check all users with briefing enabled and send if it's their briefing time.

    Runs every minute. Queries user_preferences for users whose briefing_time
    matches the current UTC hour:minute and sends them a briefing email with
    their queue summary.
    """
    from app.database import database
    from app.email_service import send_briefing_email
    from app.config import get_settings

    settings = get_settings()
    if not settings.RESEND_API_KEY:
        return  # Email not configured

    db = database.db
    if db is None:
        return

    now = datetime.now(timezone.utc)
    current_hour_min = now.strftime("%H:%M")

    # Find users whose briefing time matches current UTC time
    # (simplified — doesn't handle per-user timezones perfectly)
    cursor = db.user_preferences.find({
        "briefing_enabled": True,
        "briefing_time": current_hour_min,
        "email": {"$ne": None, "$ne": ""},
    })

    async for pref in cursor:
        try:
            user_id = pref["user_id"]
            # Get user's queue
            items = await db.queue_items.find(
                {"user_id": user_id}
            ).sort("position", 1).to_list(100)
            if not items:
                continue

            up_next = items[0] if items else None
            streak_doc = await db.streaks.find_one({"user_id": user_id})

            briefing_data = {
                "task_count": len(items),
                "up_next_name": up_next["name"] if up_next else None,
                "up_next_task": up_next["task"] if up_next else None,
                "up_next_deadline": str(up_next.get("deadline", "")) if up_next else None,
                "current_streak": streak_doc.get("current_streak", 0) if streak_doc else 0,
            }

            await send_briefing_email(pref["email"], briefing_data)
            logger.info(f"Briefing sent to {pref['email']} for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to send briefing for {pref.get('user_id')}: {e}")


def start_scheduler():
    """Start the background scheduler with a 1-minute interval job."""
    scheduler.add_job(
        check_and_send_briefings,
        trigger=IntervalTrigger(minutes=1),
        id="briefing_check",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Briefing scheduler started")


def stop_scheduler():
    """Stop the background scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Briefing scheduler stopped")
