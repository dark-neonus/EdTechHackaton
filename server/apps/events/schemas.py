"""
Schema definitions for Event-related data models using Pydantic.
This module provides schemas for data validation and serialization for the Events application.
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, validator
from sqlalchemy.orm import Session
from sqlmodel import Field

from server.apps.authentication.models import User
from server.apps.events.models import Event, EventCategory, EventComment


class EventStatus(str, Enum):
    """Enum representing the possible statuses of an event."""
    OPEN = "open"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class EventCreate(BaseModel):
    """Schema for creating a new event."""
    title: str = Field(max_length=150, index=True)
    description: str = Field(max_length=1000)
    date_scheduled: Optional[datetime] = None
    category: EventCategory = Field(default=EventCategory.OTHER)
    location: str = Field(default="Unknown")
    author_id: UUID = Field(foreign_key="user.id", nullable=False)
    # New fields for image support
    image_path: Optional[str] = None
    image_caption: Optional[str] = None

    @classmethod
    @validator("date_scheduled", pre=True, always=True)
    def parse_date_scheduled(cls, value):
        """Validate and parse the date_scheduled field into a datetime object."""
        if value is None:
            return None
        if isinstance(value, datetime):
            return value
        try:
            print("Trying to parse date_scheduled:", value)
            return datetime.fromisoformat(value)  # Parse ISO 8601 string
        except ValueError as exc:
            print("Failed to parse date_scheduled:", value)
            raise ValueError("Invalid date format for 'date_scheduled'" +\
                             ". Expected ISO 8601 format.") from exc

    model_config = {"from_attributes": True}


class EventResponse(BaseModel):
    """Schema for event response data."""
    id: UUID
    title: str
    description: str
    date_created: str
    location: str = "Unknown"
    date_scheduled: Optional[str] = None
    category: str
    author_id: UUID
    author_username: Optional[str] = None
    image_path: Optional[str] = None
    image_caption: Optional[str] = None
    status: str = Field(default="open")
    votes: int = Field(default=0)
    comments_count: int = Field(default=0)  # Add comments counter to response

    @classmethod
    def from_orm(cls, obj, db: Optional[Session] = None):
        """
        Convert an ORM event object to this schema, including author information.
        
        Args:
            obj: The Event ORM object
            db: Database session for related queries
        
        Returns:
            EventResponse: The formatted event response
        """
        event = obj  # Use a local variable for clarity while keeping the method signature
        # Query the user by author_id
        user = db.query(User).filter(User.id == event.author_id).first()
        if not user:
            raise ValueError(f"User with ID {event.author_id} not found")

        # Construct the username
        author_username = user.first_name
        if user.last_name:
            author_username += f" {user.last_name}"

        # Return the EventResponse instance
        return cls(
            id=event.id,
            title=event.title,
            description=event.description,
            date_created=event.date_created.isoformat(),  # Convert datetime to ISO 8601 string
            location=event.location,
            date_scheduled=event.date_scheduled.isoformat() if event.date_scheduled else None,
            category=event.category,
            author_id=event.author_id,
            author_username=author_username,
            image_path=event.image_path,
            image_caption=event.image_caption,
            votes=event.votes,
            status=event.status,
            comments_count=event.comments_count
        )


class EventListResponse(BaseModel):
    """Schema for a list of event responses."""
    events: List[EventResponse]

    model_config = {"from_attributes": True}


class EventVoteResponse(BaseModel):
    """Schema for event voting response."""
    event_id: str
    vote_count: int
    has_voted: bool

    model_config = {"from_attributes": True}


class EventRegistrationCreate(BaseModel):
    """Schema for creating an event registration."""
    event_id: UUID
    user_id: UUID
    notes: Optional[str] = None


class EventRegistrationResponse(BaseModel):
    """Schema for event registration response."""
    id: UUID
    event_id: UUID
    user_id: UUID
    registration_time: str
    attendance_status: str
    notes: Optional[str] = None
    event_title: Optional[str] = None
    event_date: Optional[str] = None

    @classmethod
    def from_orm(cls, obj, db: Optional[Session] = None):
        """
        Convert an ORM registration object to this schema, including event information.
        
        Args:
            obj: The EventRegistration ORM object
            db: Database session for related queries
            
        Returns:
            EventRegistrationResponse: The formatted registration response
        """
        registration = obj  # Use a local variable for clarity while keeping the method signature
        # Get event information
        event = db.query(Event).filter(Event.id == registration.event_id).first()

        return cls(
            id=registration.id,
            event_id=registration.event_id,
            user_id=registration.user_id,
            registration_time=registration.registration_time.isoformat(),
            attendance_status=registration.attendance_status,
            notes=registration.notes,
            event_title=event.title if event else None,
            event_date=event.date_scheduled.isoformat() if event and event.date_scheduled else None
        )

    model_config = {"from_attributes": True}


class EventRegistrationListResponse(BaseModel):
    """Schema for a list of event registration responses."""
    registrations: List[EventRegistrationResponse]

    model_config = {"from_attributes": True}


class EventCommentCreate(BaseModel):
    """Schema for creating an event comment."""
    content: str
    parent_comment_id: Optional[UUID] = None


class EventCommentResponse(BaseModel):
    """Schema for event comment response."""
    id: UUID
    event_id: UUID
    user_id: UUID
    author_username: str
    content: str
    date_created: str
    date_updated: Optional[str] = None
    parent_comment_id: Optional[UUID] = None
    parent_comment_author: Optional[str] = None

    @classmethod
    def from_orm(cls, obj, db: Optional[Session] = None):
        """
        Convert an ORM comment object to this schema, including author information.
        
        Args:
            obj: The EventComment ORM object
            db: Database session for related queries
            
        Returns:
            EventCommentResponse: The formatted comment response
        """
        comment = obj  # Use a local variable for clarity while keeping the method signature
        # Query the user to get username
        user = db.query(User).filter(User.id == comment.user_id).first()

        # Construct the username
        author_username = "Unknown User"
        if user:
            author_username = user.first_name
            if user.last_name:
                author_username += f" {user.last_name}"

        # Get parent comment author if this is a reply
        parent_comment_author = None
        if comment.parent_comment_id:
            parent_comment = db.query(EventComment).filter(
                EventComment.id == comment.parent_comment_id
            ).first()

            if parent_comment:
                parent_user = db.query(User).filter(
                    User.id == parent_comment.user_id
                ).first()

                if parent_user:
                    parent_comment_author = parent_user.first_name
                    if parent_user.last_name:
                        parent_comment_author += f" {parent_user.last_name}"

        return cls(
            id=comment.id,
            event_id=comment.event_id,
            user_id=comment.user_id,
            author_username=author_username,
            content=comment.content,
            date_created=comment.date_created.isoformat(),
            date_updated=comment.date_updated.isoformat() if comment.date_updated else None,
            parent_comment_id=comment.parent_comment_id,
            parent_comment_author=parent_comment_author
        )

    model_config = {"from_attributes": True}


class EventCommentListResponse(BaseModel):
    """Schema for a list of event comment responses."""
    comments: List[EventCommentResponse]

    model_config = {"from_attributes": True}
