"""
This module defines the models for the authentication app, including the User model and Role enum.
"""

from uuid import uuid4, UUID  # Standard library imports
from typing import Optional  # Standard library imports
from enum import Enum  # Standard library imports

from sqlmodel import SQLModel, Field  # Third-party imports


class Role(str, Enum):
    """
    Enum representing user roles in the application.
    """
    USER = "user"
    ADMIN = "admin"


class User(SQLModel, table=True):
    """
    Represents a user in the application.

    Attributes:
        id (UUID): The unique identifier for the user.
        first_name (str): The user's first name.
        last_name (str): The user's last name.
        email (str): The user's email address.
        hashed_password (str): The hashed password for the user.
        bio (Optional[str]): A short biography for the user.
        role (Role): The role of the user (default is USER).
    """
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    first_name: str = Field(index=True, unique=False, max_length=50, min_length=2)
    last_name: str = Field(index=True, unique=False, max_length=50, min_length=2)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    bio: Optional[str] = Field(default="", max_length=500)
    role: Role = Field(default=Role.USER)
