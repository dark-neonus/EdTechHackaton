"""
This module defines the application settings and configuration using Pydantic's BaseSettings.
"""

from pydantic.v1 import BaseSettings


class Settings(BaseSettings):
    """
    Defines the application settings.

    Attributes:
        DATABASE_URL (str): The database connection URL.
        SECRET_KEY (str): The secret key for cryptographic operations.
        ALGORITHM (str): The algorithm used for token encoding.
        ACCESS_TOKEN_EXPIRE_MINUTES (int): The token expiration time in minutes.
    """
    DATABASE_URL: str = "sqlite:///./database.db"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        """
        Configuration for the Settings class.

        Attributes:
            env_file (str): The path to the environment file.
        """
        env_file = ".env"


settings = Settings()
