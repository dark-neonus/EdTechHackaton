import os
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List
from uuid import UUID

from fastapi import (APIRouter, BackgroundTasks, Depends, FastAPI, File, Form,
                    HTTPException, Request, UploadFile)
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import or_, desc, asc
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from server.apps.authentication.models import User
from server.core.database import get_db
from server.core.security import OAuth2PasswordBearer, get_current_user
from .models import (Task, Goal)
from .schemas import (CreateGoal, CreateTask, DeleteGoal, DeleteTask, GoalResponse, TaskResponse)

router = APIRouter()

# Set up Jinja2 templates
templates = Jinja2Templates(directory="src/pages")

# Define path for event images
UPLOAD_DIR = Path("static/uploads/events")
# Ensure the upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/create_goal", response_model=GoalResponse)
def create_goal(
    goal: CreateGoal,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new goal in the system.
    """
    if goal.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only create goals for yourself.")

    new_goal = Goal.model_validate(goal)
    db.add(new_goal)
    try:
        db.commit()
        db.refresh(new_goal)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Goal with this title already exists.")

    return GoalResponse.from_goal(new_goal)

@router.post("/create_task", response_model=TaskResponse)
def create_task(
    task: CreateTask,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new task associated with a goal.
    """
    # Ensure the goal exists and belongs to the current user
    goal = db.query(Goal).filter(Goal.id == task.goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found or you do not have permission to access it.")

    new_task = Task.model_validate(task)
    db.add(new_task)
    try:
        db.commit()
        db.refresh(new_task)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Task with this title already exists.")

    return TaskResponse.from_task(new_task)

@router.post("/delete_goal/{goal_id}", response_model=dict)
def delete_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a goal and all associated tasks.
    """
    try:
        goal_uuid = UUID(goal_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid goal ID format.")

    goal_to_delete = db.query(Goal).filter(Goal.id == goal_uuid, Goal.user_id == current_user.id).first()
    if not goal_to_delete:
        raise HTTPException(status_code=404, detail="Goal not found or you do not have permission to delete it.")

    # First delete all associated tasks
    db.query(Task).filter(Task.goal_id == goal_uuid).delete()
    
    # Then delete the goal
    db.delete(goal_to_delete)
    
    db.commit()
    return {"detail": "Goal and associated tasks deleted successfully."}

@router.post("/delete_task/{task_id}", response_model=dict)
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a task associated with a goal.
    """
    try:
        task_uuid = UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format.")

    # Find the task using a join to ensure it belongs to the current user's goal
    task_to_delete = db.query(Task).join(Goal).filter(
        Task.id == task_uuid,
        Goal.user_id == current_user.id
    ).first()
    
    if not task_to_delete:
        raise HTTPException(status_code=404, detail="Task not found or you do not have permission to delete it.")

    db.delete(task_to_delete)
    db.commit()
    return {"detail": "Task deleted successfully."}

# HTML endpoint for viewing a goal (what was missing!)
@router.get("/goal/{goal_id}", response_class=HTMLResponse)
async def view_goal_page(
    request: Request,
    goal_id: str
):
    """
    Render the goal detail page.
    Note: Authentication and data loading handled by JavaScript
    """
    try:
        # Just validate the goal_id format
        UUID(goal_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid goal ID format.")
    
    # Return your HTML template - authentication will be handled by JavaScript
    return templates.TemplateResponse("goal-view-page.html", {
        "request": request,
        "goal_id": goal_id
    })

# API endpoint for getting goal data (keep this for API calls)
@router.get("/api/goal/{goal_id}", response_model=GoalResponse)
def get_goal_api(
    goal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve a specific goal by its ID (API endpoint).
    """
    try:
        goal_uuid = UUID(goal_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid goal ID format.")
    goal = db.query(Goal).filter(Goal.id == goal_uuid, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found or you do not have permission to access it.")

    return GoalResponse.from_goal(goal)

@router.get("/get_goals", response_model=List[GoalResponse])
def get_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all goals for the current user.
    """
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    return [GoalResponse.from_goal(goal) for goal in goals]

@router.get("/goal/{goal_id}/tasks", response_model=List[TaskResponse])
def get_goal_tasks(
    goal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all tasks for a specific goal.
    """
    try:
        goal_uuid = UUID(goal_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid goal ID format.")
    
    # Ensure the goal exists and belongs to the current user
    goal = db.query(Goal).filter(Goal.id == goal_uuid, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found or you do not have permission to access it.")
    
    # Get all tasks for this goal
    tasks = db.query(Task).filter(Task.goal_id == goal_uuid).all()
    return [TaskResponse.from_task(task) for task in tasks]

@router.post("/task/{task_id}/toggle", response_model=TaskResponse)
def toggle_task(
    task_id: str,
    toggle_data: dict,  # Should contain {"completed": bool}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggle the completion status of a task.
    """
    try:
        task_uuid = UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format.")
    
    # Find the task using a join to ensure it belongs to the current user's goal
    task = db.query(Task).join(Goal).filter(
        Task.id == task_uuid,
        Goal.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or you do not have permission to access it.")
    
    # Update the completion status
    task.completed = toggle_data.get("completed", False)
    
    db.commit()
    db.refresh(task)
    
    return TaskResponse.from_task(task)
