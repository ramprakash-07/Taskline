"""Pydantic models for request/response validation."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class Priority(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    NORMAL = "NORMAL"
    LOW = "LOW"


class QueueItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    task: str = Field(..., min_length=1, max_length=500)
    priority: Priority = Field(default=Priority.NORMAL)
    deadline: Optional[datetime] = None


class QueueItemUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    task: Optional[str] = Field(default=None, min_length=1, max_length=500)
    priority: Optional[Priority] = None
    deadline: Optional[datetime] = None


class QueueItemResponse(BaseModel):
    id: str
    user_id: str
    name: str
    task: str
    priority: str
    deadline: Optional[datetime] = None
    position: int
    created_at: datetime
    is_guest: bool = False
    expires_at: Optional[datetime] = None


class QueueReorderRequest(BaseModel):
    item_ids: List[str] = Field(..., min_length=1)


class MessageResponse(BaseModel):
    message: str
    name: Optional[str] = None


class GuestSessionResponse(BaseModel):
    guest_id: str
    expires_at: datetime


class GuestConvertRequest(BaseModel):
    guest_id: str


class StreakResponse(BaseModel):
    current_streak: int = 0
    longest_streak: int = 0
    last_completed_date: Optional[str] = None
    streak_increased: bool = False


# ─── Room/Team Models ───

class RoomCreate(BaseModel):
    room_name: str = Field(..., min_length=1, max_length=100, description="Team room name")


class RoomResponse(BaseModel):
    id: str
    room_name: str
    owner_id: str
    member_ids: List[str]
    invite_link: str
    created_at: datetime


class RoomTaskCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    task: str = Field(..., min_length=1, max_length=500)
    priority: Priority = Field(default=Priority.NORMAL)
    deadline: Optional[datetime] = None
    assigned_to: str = Field(..., description="User ID of the assigned member")


class RoomTaskUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    task: Optional[str] = Field(default=None, min_length=1, max_length=500)
    priority: Optional[Priority] = None
    deadline: Optional[datetime] = None
    assigned_to: Optional[str] = None


class RoomTaskResponse(BaseModel):
    id: str
    room_id: str
    assigned_to: str
    name: str
    task: str
    priority: str
    deadline: Optional[datetime] = None
    position: int
    created_at: datetime


# ─── Briefing Models ───

class BriefingPreferences(BaseModel):
    briefing_enabled: bool = True
    briefing_time: str = Field(default="09:00", description="HH:MM format")
    timezone: str = Field(default="UTC")
    email: Optional[str] = None


class BriefingData(BaseModel):
    greeting: str
    task_count: int
    up_next: Optional[QueueItemResponse] = None
    urgent_count: int
    current_streak: int = 0
    dismissed_today: bool = False
