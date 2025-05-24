"""
This module initializes the authentication app and sets up its routes.
"""

from fastapi import APIRouter
from . import routes  # Import moved to the top as per PEP 8 guidelines

router = APIRouter()

def include_router(app):
    """
    Includes the authentication router in the FastAPI application.

    Args:
        app (FastAPI): The FastAPI application instance.
    """
    app.include_router(router, prefix="/auth", tags=["authentication"])
