"""
This module defines the models for the authentication app, including the User model and Role enum.
"""

from uuid import uuid4, UUID  # Standard library imports
from typing import Optional  # Standard library imports
from enum import Enum  # Standard library imports

from sqlmodel import SQLModel, Field  # Third-party imports


class User(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    first_name: str = Field(index=True, unique=False, max_length=50, min_length=2)
    last_name: str = Field(index=True, unique=False, max_length=50, min_length=2)
    email: str = Field(index=True, unique=True)
    hashed_password: str
