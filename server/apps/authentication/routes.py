"""Authentication routes module for handling user registration, login, and profile management."""

# Standard library imports
import uuid
from datetime import timedelta
from pathlib import Path

# Third-party imports
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordBearer
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import desc

# Local application imports
from server.core.database import get_db
from server.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from server.apps.authentication.models import User
from server.apps.events.models import Event
from server.apps.events.schemas import EventResponse
from .schemas import UserCreate, UserLogin, UserResponse, UserUpdate


router = APIRouter()

templates = Jinja2Templates(directory="src/pages")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with the provided information.
    
    Args:
        user: User creation data
        db: Database session
        
    Returns:
        Newly created user information
        
    Raises:
        HTTPException: If email is already registered
    """
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(user.password)
    new_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Convert the UUID to a string in the response
    return UserResponse(
        id=str(new_user.id),  # Convert UUID to string
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        email=new_user.email,
        bio=""
    )


@router.get("/register", response_class=HTMLResponse)
def register_page():
    """
    Serve the user registration page.
    
    Returns:
        HTML response with registration form
    """
    # Path to the registration HTML file
    html_file_path = Path(__file__).parent.parent.parent.parent / "src/pages/registration-page.html"

    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>Registration page not found</h1>", status_code=404)


@router.post("/login", response_model=dict)
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and provide access token.
    
    Args:
        user: Login credentials
        db: Database session
        
    Returns:
        JWT access token and token type
        
    Raises:
        HTTPException: If credentials are invalid
    """
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # Generate JWT token
    access_token_expires = timedelta(minutes=30)  # Token expiration time
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/login", response_class=HTMLResponse)
def login_page():
    """
    Serve the login page.
    
    Returns:
        HTML response with login form
    """
    # Path to the login HTML file
    html_file_path = Path(__file__).parent.parent.parent.parent / "src/pages/login-page.html"

    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>Login page not found</h1>", status_code=404)


@router.get("/get_user_id", response_model=dict)
def get_user_id(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Get the current user's ID from token.
    
    Args:
        token: JWT access token
        db: Database session
        
    Returns:
        User ID as string
        
    Raises:
        HTTPException: If token is invalid
    """
    # Validate the token and get the current user
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Return the user's ID
    return {"user_id": str(user.id)}


@router.get("/profile/{user_id}", response_class=HTMLResponse)
def view_profile_page(user_id: str, request: Request, db: Session = Depends(get_db)):
    """
    Serve the profile page for a user.
    
    Args:
        user_id: ID of the user to view
        request: Request object for templates
        db: Database session
        
    Returns:
        HTML response with user profile
        
    Raises:
        HTTPException: If user is not found
    """
    # Convert the user_id to UUID
    try:
        user_id_uuid = uuid.UUID(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail='Invalid user ID format') from exc

    # Query the database for the user
    user = db.query(User).filter(User.id == user_id_uuid).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Convert the user to the UserResponse model
    user_data = UserResponse(
        id=str(user.id),
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        bio=user.bio or ""  # Ensure bio is not None
    )

    # Get user's events
    users_events = (
        db.query(Event)
        .filter(Event.author_id == user_id_uuid)
        .order_by(desc(Event.date_created))
        .all()
    )

    # Convert the events to the EventResponse model
    events_data = [
        EventResponse(
            id=str(event.id),  # Convert UUID to string
            title=event.title,
            description=event.description,
            date_created=event.date_created.isoformat(),
            location=event.location,
            date_scheduled=event.date_scheduled.isoformat() if event.date_scheduled else None,
            category=event.category,
            author_id=str(event.author_id),  # Convert UUID to string
        ).dict()
        for event in users_events
    ]

    # Render the template with user data
    return templates.TemplateResponse(
        "user-profile-page.html",
        {
            "request": request,
            "user": user_data.dict(),
            "events": events_data,
        },
    )


@router.get("/get_user_data", response_model=UserResponse)
def get_user_data(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Get current user's profile data.
    
    Args:
        token: JWT access token
        db: Database session
        
    Returns:
        Current user's profile information
        
    Raises:
        HTTPException: If token is invalid
    """
    # Validate the token and get the current user
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Return the user's data as UserResponse
    return UserResponse(
        id=str(user.id),
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        bio=user.bio or "",  # Ensure bio is not None
    )


@router.get("/settings", response_class=HTMLResponse)
def settings_page(_: Request):
    """
    Serve the settings page.
    
    Returns:
        HTML response with settings form
    """
    # Path to the settings HTML file
    html_file_path = Path(__file__).parent.parent.parent.parent / "src/pages/settings-page.html"

    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>Settings page not found</h1>", status_code=404)


@router.post("/settings", response_model=UserResponse)
def update_user_settings(
    user_update: UserUpdate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Update user settings.
    
    Args:
        user_update: Updated user information
        token: JWT access token
        db: Database session
        
    Returns:
        Updated user profile information
        
    Raises:
        HTTPException: If validation fails or token is invalid
    """
    # Validate the token and get the current user
    current_user = get_current_user(token, db)
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Validate required fields
    if not user_update.first_name or not user_update.first_name.strip():
        raise HTTPException(status_code=400, detail="First name is required")

    if not user_update.last_name or not user_update.last_name.strip():
        raise HTTPException(status_code=400, detail="Last name is required")

    if not user_update.email or not user_update.email.strip():
        raise HTTPException(status_code=400, detail="Email is required")

    # Check if the email is already registered by another user (if email is being changed)
    if user_update.email != current_user.email:
        db_user = db.query(User).filter(User.email == user_update.email).first()
        if db_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered by another user"
            )

    # Update user details
    current_user.first_name = user_update.first_name.strip()
    current_user.last_name = user_update.last_name.strip()
    current_user.email = user_update.email.strip()

    # Handle bio (can be empty)
    if user_update.bio is not None:
        current_user.bio = user_update.bio.strip()

    # Handle password change if provided
    if user_update.current_password and user_update.new_password:
        # Validate password length
        if len(user_update.new_password) < 8:
            raise HTTPException(
                status_code=400,
                detail="New password must be at least 8 characters long"
            )

        # Verify current password
        if not verify_password(user_update.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        # Update password
        current_user.hashed_password = hash_password(user_update.new_password)

    # Save changes to database
    db.commit()
    db.refresh(current_user)

    # Return updated user data with all fields
    return UserResponse(
        id=str(current_user.id),
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        email=current_user.email,
        bio=current_user.bio or ""  # Ensure bio is not None
    )


@router.delete("/delete_account", response_model=dict)
def delete_account(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Delete the current user's account.
    
    Args:
        token: JWT access token
        db: Database session
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If token is invalid or deletion fails
    """
    # Validate the token and get the current user
    current_user = get_current_user(token, db)
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    try:
        # Delete the user
        user_id = current_user.id  # Save ID for logging
        db.delete(current_user)
        db.commit()
        print(f"User account deleted: {user_id}")

        return {"message": "Account successfully deleted"}
    except Exception as e:
        db.rollback()
        print(f"Error deleting account: {e}")
        # Proper exception chaining using "from"
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete account: {str(e)}"
        ) from e
