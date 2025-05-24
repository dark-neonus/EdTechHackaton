"""
Main module for the FastAPI application.
"""

# Standard library imports
import atexit
import logging
from pathlib import Path

# Third-party imports
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect

from server.apps.authentication.routes import router as auth_router
from server.apps.planner.routes import router as planner_router
from server.core.database import create_db_and_tables, drop_db_and_tables, engine


def lifespan(app_instance: FastAPI):
    print("Checking if the database exists...")
    print(app_instance)
    try:
        # Use SQLAlchemy's inspector to check for existing tables
        with engine.connect() as connection:
            inspector = inspect(connection)
            tables = inspector.get_table_names()  # Get a list of all tables in the database
            if tables:
                print("Database exists and has tables.")
            else:
                print("Database exists but has no tables. Dropping and recreating...")
                drop_db_and_tables()  # Drop all tables
                create_db_and_tables()  # Recreate the database and tables
                print("Database recreated successfully.")
    except (ConnectionError, RuntimeError) as error:  # Catch specific exceptions if possible
        print(f"Error accessing the database: {error}")
        print("Dropping and recreating the database...")
        drop_db_and_tables()  # Drop all tables
        create_db_and_tables()  # Recreate the database and tables
        print("Database recreated successfully.")

    yield  # This marks the end of the startup phase and the beginning of the shutdown phase
    # Shutdown logic (if needed)


logging.basicConfig()

app = FastAPI(lifespan=lifespan)#, docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this as needed for your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the static files directory
app.mount("/src", StaticFiles(directory="src"), name="static")
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth_router, prefix="/auth", tags=["authentication"])
app.include_router(planner_router, prefix="/planner", tags=["planner"])


@app.get("/", response_class=HTMLResponse)
def home_page():
    """
    Serves the home page HTML content.
    """
    # Path to the registration HTML file
    html_file_path = Path(__file__).parent.parent / "src/pages/home-page.html"

    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    return HTMLResponse(content="<h1>Home page not found</h1>", status_code=404)
