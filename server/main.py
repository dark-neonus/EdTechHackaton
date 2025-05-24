"""
Main module for the FastAPI application.
"""

# Standard library imports
import atexit
import logging
from pathlib import Path

# Third-party imports
from apscheduler.schedulers.background import BackgroundScheduler
import apscheduler.events
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect

from server.apps.authentication.email.send_email import send_event_reminder_emails
from server.apps.authentication.routes import router as auth_router
from server.apps.events.routes import router as events_router, configure_app_with_schedulers
from server.apps.forum.routes import router as forum_router
from server.core.database import create_db_and_tables, drop_db_and_tables, engine
from server.core.fill_database import fill_db
from server.core.get_factorial import get_factorial, get_max_factorial_idx


def lifespan(app_instance: FastAPI):
    """
    Handles the startup and shutdown lifecycle of the FastAPI application.
    """
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
                fill_db()  # Fill the database with initial data
    except (ConnectionError, RuntimeError) as error:  # Catch specific exceptions if possible
        print(f"Error accessing the database: {error}")
        print("Dropping and recreating the database...")
        drop_db_and_tables()  # Drop all tables
        create_db_and_tables()  # Recreate the database and tables
        print("Database recreated successfully.")
        fill_db()  # Fill the database with initial data

    yield  # This marks the end of the startup phase and the beginning of the shutdown phase
    # Shutdown logic (if needed)


logging.basicConfig()
logging.getLogger('apscheduler').setLevel(logging.DEBUG)

app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None)

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
app.include_router(events_router, prefix="/events", tags=["events"])
app.include_router(forum_router, prefix="/forum", tags=["forum"])
app = configure_app_with_schedulers(app)


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


@app.get("/api/factorial/{n}")
async def factorial_endpoint(n: int):
    """
    API endpoint to calculate factorial of a given number.
    Uses pre-calculated factorials for efficiency.
    """
    if n < 0:
        raise HTTPException(status_code=400, detail="Factorial is not defined for negative numbers")
    
    max_idx = get_max_factorial_idx()
    if n > max_idx + 1:
        raise HTTPException(status_code=400, detail=f"Maximum available factorial is {max_idx + 1}")
    
    result = get_factorial(n)
    if result is None:
        raise HTTPException(status_code=500, detail="Failed to calculate factorial")
        
    return {"result": str(result)}


@app.get("/api/max_factorial")
async def max_factorial_endpoint():
    """
    API endpoint to get the maximum available pre-calculated factorial.
    """
    max_idx = get_max_factorial_idx()
    return {"max_factorial": max_idx}


@app.on_event("startup")
def init_scheduler():
    """
    Initializes the background scheduler for sending event reminder emails.
    """
    scheduler = BackgroundScheduler()
    # Run daily at 8:00 AM
    scheduler.add_job(
        send_event_reminder_emails,
        'cron',
        hour=8,
        minute=0,
        id='event_reminder_email_job',
        name='Daily Event Reminder Emails',
        misfire_grace_time=60 * 60  # Allow the job to be an hour late if server was down
    )

    # Add a logger to track when jobs are run
    scheduler.add_listener(
        lambda event: logging.info("Job %s executed successfully", event.job_id),
        mask=apscheduler.events.EVENT_JOB_EXECUTED
    )

    # Add a logger for job failures
    scheduler.add_listener(
        lambda event: logging.error("Job %s failed with exception: %s", \
                                     event.job_id, event.exception),
        mask=apscheduler.events.EVENT_JOB_ERROR
    )

    scheduler.start()
    logging.info("Scheduler started - Event reminder emails will be sent daily at 8:00 AM")

    # Shut down the scheduler when app exits
    atexit.register(scheduler.shutdown)
