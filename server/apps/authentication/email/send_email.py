"""
Module for sending emails and event reminder notifications.
"""

import os
import smtplib
import datetime

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

from sqlalchemy import between
from dotenv import load_dotenv

from server.apps.events.models import Event, EventRegistration
from server.apps.authentication.models import User

# Load environment variables from a .env file (for development)
load_dotenv()

# Configure logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Email configuration with Gmail defaults
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "yourgmail@gmail.com")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "your_app_password")
FROM_EMAIL = os.environ.get("FROM_EMAIL", SMTP_USERNAME)


def send_email(recipient_email, subject, body, is_html=False):
    """
    Send an email to the specified recipient.

    Args:
        recipient_email (str): The recipient's email address.
        subject (str): The email subject.
        body (str): The email body content.
        is_html (bool): Whether the body content is HTML.

    Returns:
        bool: True if the email was sent successfully, False otherwise.
    """
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = subject

        # Attach body with appropriate content type
        content_type = "html" if is_html else "plain"
        msg.attach(MIMEText(body, content_type))

        logger.debug("Connecting to SMTP server: %s:%d", SMTP_SERVER, SMTP_PORT)

        # Connect to SMTP server and send message
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Secure the connection
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info("Email sent successfully to %s", recipient_email)
        logger.debug("SMTP_USERNAME: %s", SMTP_USERNAME)
        logger.debug("SMTP_SERVER: %s, PORT: %d", SMTP_SERVER, SMTP_PORT)
        return True

    except smtplib.SMTPException as error:
        logger.error("Failed to send email to %s: %s", recipient_email, str(error))
        return False


def send_event_reminder_emails():
    """
    Send reminder emails to users registered for events that start tomorrow.

    This function should be run daily by a scheduler (e.g., cron job or Celery).

    Returns:
        None
    """

    # Get tomorrow's date
    tomorrow = datetime.date.today() + datetime.timedelta(days=1)
    tomorrow_start = datetime.datetime.combine(tomorrow, datetime.time.min)
    tomorrow_end = datetime.datetime.combine(tomorrow, datetime.time.max)

    logger.info("Checking for events starting between %s and %s", tomorrow_start, tomorrow_end)

    try:
        # Find all events starting tomorrow
        tomorrow_events = Event.query.filter(
            between(Event.date_scheduled, tomorrow_start, tomorrow_end)
        ).all()

        logger.info("Found %d events starting tomorrow", len(tomorrow_events))

        # For each event, get registered users and send reminders
        for event in tomorrow_events:
            # Get all registrations for this event
            registrations = EventRegistration.query.filter_by(event_id=event.id).all()
            logger.info("Event '%s' (ID: %d) has %d registrations", event.title, \
                         event.id, len(registrations))

            # Get user emails and send reminders
            for registration in registrations:
                user = User.query.get(registration.user_id)
                if not user or not user.email:
                    logger.warning("User %d has no valid email", registration.user_id)
                    continue

                # Format the reminder email
                subject = f"Reminder: '{event.title}' starts tomorrow!"

                # Create HTML email body
                html_body = (
f"""
<html>
<body>
    <h2>Event Reminder</h2>
    <p>Hello {user.first_name} {user.last_name},</p>
    <p>This is a friendly reminder that you're registered for the following event 
    happening tomorrow:</p>
    <div style="padding: 10px; border-left: 4px solid #3498db; margin: 15px 0;">
        <h3>{event.title}</h3>
        <p><strong>Date:</strong> {event.date_scheduled.strftime('%A, %B %d, %Y')}</p>
        <p><strong>Time:</strong> {event.date_scheduled.strftime('%I:%M %p')}</p>
        <p><strong>Location:</strong> {event.location}</p>
    </div>
    <p>We're looking forward to seeing you there!</p>
    <p>View event details: 
<a href="{os.environ.get('SITE_URL', 'https://yourdomain.com')}/events/{event.id}">
Click here</a></p>
    <p>Best regards,<br>The Community Events Team<br>Tribuna</p>
</body>
</html>
"""
)

                # Send the email
                success = send_email(user.email, subject, html_body, is_html=True)

                if success:
                    logger.info("Sent reminder email to %s for event %d", user.email, event.id)
                else:
                    logger.error("Failed to send reminder email to %s for event %d",\
                                  user.email, event.id)

    except (smtplib.SMTPException, AttributeError, KeyError) as error:
        logger.error("Error sending event reminders: %s", str(error))
        # Consider sending an admin notification for critical failures
