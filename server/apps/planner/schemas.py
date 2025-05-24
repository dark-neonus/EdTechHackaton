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
from server.apps.planner.models import Task, Goal

class CreateGoal(BaseModel):
    """Schema for creating a new goal."""
    title: str = Field(max_length=150, index=True)
    description: str = Field(max_length=1000)
    user_id: UUID = Field(foreign_key="user.id", nullable=False)

    model_config = {"from_attributes": True}

class CreateTask(BaseModel):
    """Schema for creating a new task."""
    title: str = Field(max_length=150, index=True)
    completed: bool = Field(default=False, index=True)
    goal_id: UUID = Field(foreign_key="goal.id", nullable=False)

    model_config = {"from_attributes": True}

class DeleteGoal(BaseModel):
    """Schema for deleting a goal."""
    id: UUID = Field(foreign_key="goal.id", nullable=False)

class DeleteTask(BaseModel):
    """Schema for deleting a task."""
    id: UUID = Field(foreign_key="task.id", nullable=False)

class GoalRequest(BaseModel):
    """Schema for requesting a goal."""
    id: UUID = Field(foreign_key="goal.id", nullable=False)

    model_config = {"from_attributes": True}

class GoalResponse(BaseModel):
    """Schema for the response of a goal."""
    id: UUID
    title: str
    description: str
    completed: bool
    user_id: UUID
    tasks: List[Task] = []

    model_config = {"from_attributes": True}

    @classmethod
    def from_goal(cls, goal: Goal):
        """Convert a Goal model to a GoalResponse schema."""
        # Create instance with all required fields at once
        return cls(
            id=goal.id,
            title=goal.title,
            description=goal.description,
            completed=goal.completed,
            user_id=goal.user_id,
            tasks=goal.tasks
        )

class TaskResponse(BaseModel):
    """Schema for the response of a task."""
    id: UUID
    title: str
    completed: bool
    goal_id: UUID

    model_config = {"from_attributes": True}

    @classmethod
    def from_task(cls, task: Task):
        """Convert a Task model to a TaskResponse schema."""
        return cls(
            id=task.id,
            title=task.title,
            completed=task.completed,
            goal_id=task.goal_id
        )
