"""
Models for the events application including Event, EventVote, EventRegistration,
and EventComment entities, along with related enums and schemas.
"""

from enum import Enum
from uuid import uuid4, UUID
from typing import Optional, List
from pydantic import BaseModel
from sqlmodel import SQLModel, Field, Column, DateTime, UniqueConstraint, Relationship

class Task(SQLModel, table=True):
    """
    Model representing a task in the system.
    Contains details about the task, its status, and associated metadata.
    """
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str = Field(max_length=150, index=True)
    completed: bool = Field(default=False, index=True)

     # Foreign key to link task to goal
    goal_id: UUID = Field(foreign_key="goal.id", nullable=False)

    # Relationship back to the goal
    goal: "Goal" = Relationship(back_populates="tasks")

class Goal(SQLModel, table=True):
    """
    Model representing a goal in the system.
    Contains details about the goal, its status, and associated metadata.
    """
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str = Field(max_length=150, index=True)
    description: str = Field(max_length=1000)
    completed: bool = Field(default=False, index=True)
    user_id: UUID = Field(foreign_key="user.id", nullable=False)

    # Relationship to tasks
    tasks: List[Task] = Relationship(back_populates="goal")

    # You might want to calculate completion status based on tasks
    @property
    def completion_percentage(self):
        """Calculate the percentage of completed tasks."""
        if not self.tasks:
            return 0
        completed_tasks = sum(1 for task in self.tasks if task.completed)
        return (completed_tasks / len(self.tasks)) * 100
