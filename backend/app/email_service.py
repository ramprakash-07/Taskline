"""Email service using Resend for daily briefing emails."""

import logging
from app.config import get_settings

logger = logging.getLogger(__name__)


async def send_briefing_email(to_email: str, briefing_data: dict):
    """Send a dark-themed HTML briefing email via Resend.

    Args:
        to_email: Recipient email address.
        briefing_data: Dict containing task_count, up_next_name, up_next_task,
                       current_streak, and up_next_deadline.
    """
    settings = get_settings()
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return

    import resend
    resend.api_key = settings.RESEND_API_KEY

    task_count = briefing_data.get("task_count", 0)
    up_next_name = briefing_data.get("up_next_name", "your tasks")
    up_next_task = briefing_data.get("up_next_task", "")
    streak = briefing_data.get("current_streak", 0)
    deadline = briefing_data.get("up_next_deadline", "")

    html = f"""
    <div style="background:#080b12;color:#fff;font-family:'Helvetica Neue',Arial,sans-serif;padding:40px;max-width:500px;margin:0 auto;border-radius:20px;border:1px solid rgba(255,255,255,0.06);">
        <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:11px;color:rgba(255,255,255,0.25);letter-spacing:3px;">PRIORITY QUEUE</div>
            <div style="font-size:28px;font-weight:800;color:#fff;">TaskLine</div>
        </div>
        <div style="text-align:center;font-size:20px;margin-bottom:20px;">☀️</div>
        <div style="text-align:center;font-size:18px;font-weight:700;color:#fff;margin-bottom:8px;">Good morning!</div>
        <div style="text-align:center;font-size:14px;color:rgba(255,255,255,0.6);margin-bottom:24px;">You have <strong style="color:#FFD700;">{task_count}</strong> tasks in your queue today.</div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px;margin-bottom:20px;">
            <div style="font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:2px;margin-bottom:8px;">UP NEXT</div>
            <div style="font-size:16px;font-weight:700;color:#fff;">{up_next_name}</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;">{up_next_task}</div>
            {f'<div style="font-size:11px;color:#ff3b3b;margin-top:8px;">Deadline: {deadline}</div>' if deadline and deadline != 'None' else ''}
        </div>
        {f'<div style="text-align:center;font-size:14px;color:#FFD700;margin-bottom:16px;">🔥 {streak} day streak</div>' if streak > 0 else ''}
        <div style="text-align:center;font-size:11px;color:rgba(255,255,255,0.15);margin-top:24px;">TaskLine — Your work lines up</div>
    </div>
    """

    try:
        resend.Emails.send({
            "from": "TaskLine <briefing@taskline.app>",
            "to": [to_email],
            "subject": f"☀️ Your TaskLine Briefing — {task_count} tasks today",
            "html": html,
        })
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
