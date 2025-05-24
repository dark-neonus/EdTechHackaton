"""
Models for the events application including Event, EventVote, EventRegistration,
and EventComment entities, along with related enums and schemas.
"""
from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4, UUID
from typing import Optional
from pydantic import BaseModel
from sqlmodel import SQLModel, Field, Column, DateTime, UniqueConstraint

class EventStatus(str, Enum):
    """Enum representing the possible states of an event."""
    OPEN = "open"
    CLOSED = "closed"
    CANCELLED = "cancelled"

class EventCategory(str, Enum):
    """Enum representing the possible categories for an event."""
    HEALTH = "health"
    EMPLOYMENT = "employment"
    SUPPORT = "support"
    CHARITY = "charity"
    NETWORKING = "networking"
    ENTERTAINING = "entertaining"
    OTHER = "other"

class Event(SQLModel, table=True):
    """
    Model representing an event in the system.
    Contains all event details including metadata, status, and counters.
    """
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str = Field(max_length=150, index=True)
    description: str = Field(max_length=1000)
    location: str = Field(default="Unknown")
    date_created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    date_scheduled: datetime = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    category: str = Field(default=EventCategory.OTHER.value, index=True)
    author_id: UUID = Field(foreign_key="user.id", nullable=False)
    image_path: str = Field(default=None, nullable=True)
    image_caption: str = Field(default=None, max_length=255, nullable=True)
    status: str = Field(default=EventStatus.OPEN.value)
    votes: int = Field(default=0)
    comments_count: int = Field(default=0)  # Add comments counter

class EventVote(SQLModel, table=True):
    """
    Model for tracking user votes on events.
    Includes a unique constraint to prevent duplicate votes.
    """
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    event_id: UUID = Field(foreign_key="event.id", nullable=False)
    user_id: UUID = Field(foreign_key="user.id", nullable=False)
    date_voted: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Add a unique constraint on event_id and user_id to prevent duplicate votes
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="unique_event_user_vote"),
    )

class EventRegistration(SQLModel, table=True):
    """
    Model for tracking user registrations for events.
    Includes attendance status and optional notes.
    """
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    event_id: UUID = Field(foreign_key="event.id", nullable=False)
    user_id: UUID = Field(foreign_key="user.id", nullable=False)
    registration_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    attendance_status: str = Field(default="registered")  # registered, attended, cancelled
    notes: Optional[str] = Field(default=None, max_length=500)

    # Add a unique constraint to prevent duplicate registrations
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="unique_event_user_registration"),
    )

class EventComment(SQLModel, table=True):
    """
    Model for comments on events.
    Includes support for nested comments and soft deletion.
    """
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    event_id: UUID = Field(foreign_key="event.id", nullable=False)
    user_id: UUID = Field(foreign_key="user.id", nullable=False)
    content: str = Field(max_length=1000)
    date_created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    date_updated: Optional[datetime] = Field(default=None, \
                                              sa_column=Column(DateTime(timezone=True)))
    is_deleted: bool = Field(default=False)
    parent_comment_id: Optional[UUID] = Field(
        default=None,
        foreign_key="eventcomment.id",
        nullable=True
    )

class CommentUpdate(BaseModel):
    """Schema for updating the content of a comment."""
    content: str

    model_config = {"from_attributes": True}
