"""Module for events application router and routes initialization."""

from fastapi import APIRouter
from . import routes  # Import routes to register them with the router

router = APIRouter()
