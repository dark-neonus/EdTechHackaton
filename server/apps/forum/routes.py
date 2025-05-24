from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi import Query
from pathlib import Path
from sqlalchemy.orm import Session
from server.core.database import get_db
from .models import Post
from .schemas import PostCreate, PostResponse

router = APIRouter()

@router.get("/", response_class=HTMLResponse)
def events_page():
    # Path to the registration HTML file
    html_file_path = Path(__file__).parent.parent.parent.parent / "src/pages/forum-posts-page.html"

    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>Forum page not found</h1>", status_code=404)

@router.get("/create_post", response_class=HTMLResponse)
def create_post_page():
    # Path to the registration HTML file
    html_file_path = Path(__file__).parent.parent.parent.parent / "src/pages/create-post-page.html"

    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>Create post page not found</h1>", status_code=404)


@router.get("/view_post/{post_id}", response_class=HTMLResponse)
def view_post_page(post_id: int, db: Session = Depends(get_db)):
    html_file_path = Path(__file__).parent.parent.parent.parent / "src/pages/post-view-page.html"

    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>View post page not found</h1>", status_code=404)
