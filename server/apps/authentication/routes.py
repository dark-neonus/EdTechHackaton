"""Authentication routes module for handling user registration, login, and profile management."""

# Standard library imports
import uuid
from datetime import timedelta
from pathlib import Path

# Third-party imports
from fastapi import APIRouter, Depends, HTTPException, Request, Form
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
def login_user(
    username: str = Form(...),  # not 'email'
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(User.email == username).first()
    if not db_user or not verify_password(password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    access_token_expires = timedelta(minutes=30)
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

