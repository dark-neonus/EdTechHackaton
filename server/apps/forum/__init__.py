# File: /fastapi-backend/fastapi-backend/backend/apps/forum/__init__.py

from fastapi import APIRouter

router = APIRouter()

from . import routes  # Import routes to register them with the router