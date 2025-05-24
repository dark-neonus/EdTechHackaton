"""
This module defines the schemas for the authentication app, including user creation, login,
response, and update schemas.
"""

from typing import Optional  # Standard library imports
from pydantic import BaseModel  # Third-party imports


class UserCreate(BaseModel):
    """
    Schema for creating a new user.

    Attributes:
        first_name (str): The user's first name.
        last_name (str): The user's last name.
        email (str): The user's email address.
        password (str): The user's password.
    """
    first_name: str
    last_name: str
    email: str
    password: str


class UserLogin(BaseModel):
    """
    Schema for user login.

    Attributes:
        email (str): The user's email address.
        password (str): The user's password.
    """
    email: str
    password: str


class UserResponse(BaseModel):
    """
    Schema for user response.

    Attributes:
        id (str): The user's unique identifier.
        first_name (str): The user's first name.
        last_name (str): The user's last name.
        email (str): The user's email address.
        bio (Optional[str]): The user's biography.
    """
    id: str
    first_name: str
    last_name: str
    email: str
    bio: Optional[str] = None

    class Config:
        """
        Configuration for the UserResponse schema.
        """
        from_attributes = True


class UserUpdate(BaseModel):
    """
    Schema for updating user information.

    Attributes:
        first_name (str): The user's first name.
        last_name (str): The user's last name.
        email (str): The user's email address.
        bio (Optional[str]): The user's biography.
        current_password (Optional[str]): The user's current password.
        new_password (Optional[str]): The user's new password.
    """
    first_name: str
    last_name: str
    email: str
    bio: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
