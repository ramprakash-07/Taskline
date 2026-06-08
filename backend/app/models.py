"""
Pydantic models for request/response validation.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class Priority(str, Enum):
    """Queue item priority levels."""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    NORMAL = "NORMAL"
    LOW = "LOW"


class QueueItemCreate(BaseModel):
    """Schema for creating a new queue item."""
    name: str = Field(..., min_length=1, max_length=100, description="Person's name")
    task: str = Field(..., min_length=1, max_length=500, description="Task description")
    priority: Priority = Field(default=Priority.NORMAL, description="Task priority")
    deadline: Optional[datetime] = Field(default=None, description="Task deadline")


class QueueItemUpdate(BaseModel):
    """Schema for updating an existing queue item."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    task: Optional[str] = Field(default=None, min_length=1, max_length=500)
    priority: Optional[Priority] = None
    deadline: Optional[datetime] = None


class QueueItemResponse(BaseModel):
    """Schema for queue item API responses."""
    id: str = Field(..., description="Item ID")
    user_id: str = Field(..., description="Owner user ID")
    name: str
    task: str
    priority: str
    deadline: Optional[datetime] = None
    position: int = Field(..., description="Position in queue (0-indexed)")
    created_at: datetime


class QueueReorderRequest(BaseModel):
    """Schema for reordering queue items."""
    item_ids: List[str] = Field(..., min_length=1, description="Item IDs in desired order")


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str
    name: Optional[str] = None
