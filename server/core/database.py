"""
This module handles database configuration, session management, and utility functions
for creating and dropping database tables.
"""

from typing import Generator  # Standard library imports
from sqlmodel import SQLModel, create_engine  # Third-party imports
from sqlalchemy.orm import sessionmaker, Session  # Third-party imports
from server.core.config import settings  # First-party imports

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_db_and_tables():
    """
    Creates the database and all defined tables.
    """
    print("Creating database and tables...")
    SQLModel.metadata.create_all(bind=engine)


def drop_db_and_tables():
    """
    Drops all tables in the database.
    """
    SQLModel.metadata.drop_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Provides a database session generator for dependency injection.

    Yields:
        Session: A database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
