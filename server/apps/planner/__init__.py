"""Module for events application router and routes initialization."""


from fastapi import APIRouter
from . import routes  # Import moved to the top as per PEP 8 guidelines

router = APIRouter()

def include_router(app):
    """
    Includes the planner router in the FastAPI application.

    Args:
        app (FastAPI): The FastAPI application instance.
    """
    app.include_router(router, prefix="/planner", tags=["planner"])