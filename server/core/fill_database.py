"""
Module to populate the database with initial data for users and events.
"""

import datetime
import random
from sqlalchemy.orm import Session

from server.core.database import get_db
from server.apps.authentication.models import User, Role
from server.apps.events.models import Event, EventCategory, EventComment, \
      EventStatus, EventVote, EventRegistration
from server.core.security import hash_password

def fill_db():
    """Fill the database with meaningful initial data for users and events"""
    print("Starting database initialization...")
    db: Session = next(get_db())

    # Create users with different roles
    print("Creating users...")

    # Admin user
    admin_user = User(
        first_name="Admin",
        last_name="User",
        email="admin@tribuna.ua",
        hashed_password=hash_password('admin1234'),
        bio="Site administrator with full access to all features.",
        role=Role.ADMIN
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    # Regular users with meaningful profiles
    users = [
        User(
            first_name="Nazar",
            last_name="Pasichnyk",
            email="nazar@gmail.com",
            hashed_password=hash_password('1234'),
            bio="UCU student majoring in Computer Science. Interested in mobile app development and AI."
        ),
        User(
            first_name="Roman",
            last_name="Prokhorov",
            email="roman@gmail.com",
            hashed_password=hash_password('1234'),
            bio="Graphic designer and web developer with 5 years of experience. Creates beautiful UIs."
        ),
        User(
            first_name="Козак",
            last_name="Васильович",
            email="kozak@gmail.com",
            hashed_password=hash_password('1234'),
            bio="Ukrainian history enthusiast. Collects old photographs of Ukrainian cities."
        ),
        User(
            first_name="Maria",
            last_name="Shevchenko",
            email="maria@gmail.com",
            hashed_password=hash_password('1234'),
            bio="Environmental activist working on urban greening projects in Lviv."
        ),
        User(
            first_name="Oleh",
            last_name="Kravchenko",
            email="oleh@gmail.com",
            hashed_password=hash_password('1234'),
            bio="IT specialist with a passion for cybersecurity. Conducts workshops on digital safety."
        ),
        User(
            first_name="Sophia",
            last_name="Kovalenko",
            email="sophia@gmail.com",
            hashed_password=hash_password('1234'),
            bio="Medical student and volunteer at local hospital."
        )
    ]

    # Add and commit meaningful users
    for user in users:
        db.add(user)
        db.commit()
        db.refresh(user)

    # Add bulk users with basic profiles
    bulk_users = []
    for i in range(9, 30):
        first_names = ["Andriy", "Bohdan", "Viktoria", "Iryna", "Yulia", "Taras", "Petro", "Anna", "Natalia", "Ivan"]
        last_names = ["Melnyk", "Shevchuk", "Boyko", "Koval", "Tkachenko", "Ponomarenko", "Fedorenko", "Onyshchenko"]

        bulk_user = User(
            first_name=random.choice(first_names),
            last_name=random.choice(last_names),
            email=f"user{i}@example.com",
            hashed_password=hash_password('1234'),
            bio="Community member since 2025. Interested in local events and networking."
        )
        bulk_users.append(bulk_user)
        db.add(bulk_user)
        db.commit()
        db.refresh(bulk_user)

    all_users = users + bulk_users + [admin_user]
    print(f"Created {len(all_users)} users")

    # Create meaningful events
    print("Creating events...")

    # Predefined meaningful events
    meaningful_events = [
        Event(
            title="Lviv Tech Summit 2025",
            description="""
            Join the biggest tech conference in Western Ukraine! The event features:
            - 50+ speakers from leading tech companies
            - Workshops on AI, cloud technologies, and DevOps
            - Networking opportunities with industry professionals
            - Job fair with local and international companies
            
            This year's theme is "Technology for Sustainable Future" with special focus on 
            green tech initiatives and ethical AI development.
            """,
            date_scheduled=datetime.datetime(2025, 10, 15, 9, 0),
            category=EventCategory.NETWORKING,
            author_id=users[0].id,
            location="Lviv IT Park, Stryiska Street 232",
            status=EventStatus.OPEN,
            votes=0  # Initialize with 0 - we'll add votes as objects
        ),
        Event(
            title="Charity Concert for Medical Equipment",
            description="""
            Come support our fundraising concert to equip local hospitals with 
            modern medical equipment. All proceeds will be directed to purchasing 
            diagnostic equipment for the Children's Hospital.
            
            Featuring performances by:
            - "Okean Elzy"
            - "The Hardkiss"
            - "KAZKA"
            - And many local musicians
            
            Entry ticket: 300 UAH
            VIP ticket (includes meeting with performers): 1000 UAH
            """,
            date_scheduled=datetime.datetime(2025, 7, 3, 19, 0),
            category=EventCategory.CHARITY,
            author_id=users[1].id,
            location="Lviv Arena Stadium",
            status=EventStatus.OPEN,
            votes=0
        ),
        Event(
            title="Mental Health Awareness Workshop",
            description="""
            Free workshop focusing on mental health awareness and self-care techniques.
            Topics include:
            - Recognizing stress and anxiety symptoms
            - Effective coping mechanisms
            - Creating a daily mental wellness routine
            - When and how to seek professional help
            
            The workshop is led by licensed psychologists and is suitable for all ages.
            Registration is required due to limited space.
            """,
            date_scheduled=datetime.datetime(2025, 5, 14, 17, 30),
            category=EventCategory.HEALTH,
            author_id=users[0].id,  # Changed from users[2] (Daryna) to users[0] (Nazar)
            location="UCU Campus, Kozelnytska Street 2a",
            status=EventStatus.OPEN,
            votes=0
        ),
        Event(
            title="Job Fair for Recent Graduates",
            description="""
            Looking for your first job after graduation? Join our job fair specifically 
            designed for recent graduates and students in their final year.
            
            - 30+ companies from various industries
            - CV review and improvement service
            - Mock interviews with HR professionals
            - Workshops on job searching strategies
            
            Bring multiple copies of your CV and dress professionally!
            """,
            date_scheduled=datetime.datetime(2025, 6, 20, 10, 0),
            category=EventCategory.EMPLOYMENT,
            author_id=users[1].id,  # Changed from users[3] (Olesia) to users[1] (Roman)
            location="Lviv Polytechnic National University, Main Hall",
            status=EventStatus.OPEN,
            votes=0
        ),
        Event(
            title="Historical Walking Tour: Old Lviv",
            description="""
            Discover the hidden gems of Lviv's historical center with our expert guide.
            
            This 3-hour walking tour will take you through:
            - Medieval streets and buildings
            - Famous architectural landmarks
            - Lesser-known historical sites
            - Ancient churches and their stories
            
            The tour is conducted in Ukrainian with English translation available.
            Price: 200 UAH per person
            """,
            date_scheduled=datetime.datetime(2025, 8, 5, 11, 0),
            category=EventCategory.ENTERTAINING,
            author_id=users[2].id,  # This index is now Козак (was users[4] before removal)
            location="Rynok Square, near City Hall",
            status=EventStatus.OPEN,
            votes=0
        ),
        Event(
            title="Volunteer Initiative: City Cleanup",
            description="""
            Join our monthly city cleanup initiative! Let's make our city cleaner
            and more beautiful together.
            
            We will provide all necessary equipment:
            - Gloves and garbage bags
            - Basic cleaning tools
            - Refreshments for volunteers
            
            After the cleanup, all participants are invited for a picnic in the park.
            Every volunteer makes a difference!
            """,
            date_scheduled=datetime.datetime(2025, 5, 25, 9, 0),
            category=EventCategory.SUPPORT,
            author_id=users[3].id,  # This index is now Maria (was users[5] before removal)
            location="Stryiskyi Park, Main Entrance",
            status=EventStatus.OPEN,
            votes=0
        ),
        Event(
            title="Cybersecurity Workshop for Beginners",
            description="""
            Learn the basics of personal cybersecurity in this hands-on workshop.
            
            Topics covered:
            - Password management and security
            - Two-factor authentication setup
            - Recognizing phishing attempts
            - Secure browsing habits
            - Data backup best practices
            
            Bring your laptop to implement the security measures during the workshop!
            """,
            date_scheduled=datetime.datetime(2025, 9, 12, 18, 0),
            category=EventCategory.OTHER,
            author_id=users[4].id,  # This index is now Oleh (was users[6] before removal)
            location="Startup Depot, Vesela Street 5",
            status=EventStatus.OPEN,
            votes=0
        )
    ]

    events_with_ids = []
    for event in meaningful_events:
        db.add(event)
        db.commit()
        db.refresh(event)
        events_with_ids.append(event)

    # Create bulk events with some variety
    event_descriptions = [
        "Join us for this exciting community event! Networking opportunities, discussions, and refreshments will be provided.",
        "Learn new skills at this interactive workshop. Suitable for beginners and experts alike.",
        "A charity fundraiser to support local causes. Every donation makes a difference.",
        "An informational session about important community issues. Come share your thoughts and learn from others.",
        "Celebrate local culture with us at this festive gathering! Food, music, and activities for all ages."
    ]

    event_locations = [
        "Lviv, Center",
        "Kyiv, Innovation Park",
        "Odesa, City Beach",
        "Kharkiv, University Campus",
        "Dnipro, Art Space",
        "Lviv, IT Cluster Office",
        "Kyiv, National Museum",
        "Lviv, UCU Campus",
        "Kyiv, Olympic Stadium",
        "Odesa, Literature Museum"
    ]

    # Generate additional bulk events
    bulk_events = []
    for i in range(8, 50):
        future_date = datetime.datetime.now() + datetime.timedelta(days=random.randint(10, 500))
        bulk_event = Event(
            title=f"Community Event: {random.choice(['Workshop', 'Meetup', 'Discussion', 'Presentation', 'Conference'])} #{i}",
            description=random.choice(event_descriptions),
            date_scheduled=future_date.replace(hour=random.randint(9, 20), minute=0),
            category=random.choice(list(EventCategory)),
            author_id=random.choice(all_users).id,
            location=random.choice(event_locations),
            status=random.choice([EventStatus.OPEN, EventStatus.OPEN, EventStatus.OPEN, EventStatus.CLOSED]),
            votes=0  # Initialize with 0 - we'll add votes as objects
        )
        db.add(bulk_event)
        db.commit()
        db.refresh(bulk_event)
        bulk_events.append(bulk_event)

    # Combine all events
    all_events = events_with_ids + bulk_events
    print(f"Created {len(all_events)} events")

    # Adding event votes as separate objects
    print("Adding event votes...")

    # Add votes to meaningful events
    for event in events_with_ids:
        # Generate between 30-200 votes for meaningful events
        vote_count = random.randint(30, 200)
        event_voters = random.sample(all_users, min(vote_count, len(all_users)))

        for voter in event_voters:
            # Create a vote object
            vote = EventVote(
                event_id=event.id,
                user_id=voter.id,
                date_voted=datetime.datetime.now() - datetime.timedelta(
                    days=random.randint(0, 30),
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59)
                )
            )
            db.add(vote)

            # Increment the vote counter in the event
            event.votes += 1

        db.commit()

    # Add random votes to bulk events
    for event in bulk_events:
        # Generate between 0-50 votes for bulk events
        vote_count = random.randint(0, 50)

        if vote_count > 0:
            event_voters = random.sample(all_users, min(vote_count, len(all_users)))

            for voter in event_voters:
                # Create a vote object
                vote = EventVote(
                    event_id=event.id,
                    user_id=voter.id,
                    date_voted=datetime.datetime.now() - datetime.timedelta(
                        days=random.randint(0, 30),
                        hours=random.randint(0, 23),
                        minutes=random.randint(0, 59)
                    )
                )
                db.add(vote)

                # Increment the vote counter in the event
                event.votes += 1

            db.commit()

    print("Added votes to events")

    # Adding event comments
    print("Creating event comments...")

    comment_texts = [
        "Looking forward to this event! Can't wait to attend.",
        "I attended something similar last year and it was great. Highly recommended!",
        "Will there be parking available at the venue?",
        "Is this event suitable for beginners?",
        "Thanks for organizing this! Our community needs more events like this.",
        "Can I bring my friends who are visiting from out of town?",
        "What's the dress code for this event?",
        "Are there any prerequisites for participation?",
        "How long will the event last? I need to plan my day.",
        "Will refreshments be provided or should we bring our own?",
        "Is there an age restriction for this event?",
        "Will the presentations be recorded? I might not be able to attend in person.",
        "This looks really interesting! I've signed up already.",
        "Can you share more details about the speakers?",
        "Is the venue wheelchair accessible?"
    ]

    # Add multiple comments to each event
    for event in all_events:
        # Each event gets between 0-10 comments
        comment_count = random.randint(0, 10)

        for _ in range(comment_count):
            comment = EventComment(
                content=random.choice(comment_texts),
                event_id=event.id,
                user_id=random.choice(all_users).id,
                date_created=datetime.datetime.now() - datetime.timedelta(days=random.randint(1, 30)),
                votes=random.randint(0, 15)
            )
            db.add(comment)

            # Update the comments_count field in the event
            event.comments_count += 1

    db.commit()
    print("Added comments to events")

    # Add threaded comments (replies to comments)
    print("Adding comment replies...")

    reply_texts = [
        "Thanks for your question! Yes, there will be ample parking available.",
        "The event is definitely suitable for beginners. The instructors are very patient and helpful.",
        "I've been to similar events, and they usually last about 3 hours.",
        "According to the organizers, light refreshments will be provided.",
        "Yes, the venue is fully wheelchair accessible with ramps and elevators.",
        "I believe presentations will be recorded and made available afterward.",
        "Great point! I was wondering about that too.",
        "There's no age restriction, but participants under 16 should be accompanied by an adult.",
        "I can confirm that you can bring guests, but they need to register separately.",
        "The dress code is smart casual, nothing too formal required."
    ]

    # Get all comments
    all_comments = db.query(EventComment).filter(EventComment.parent_comment_id is None).all()

    # Add replies to some comments
    for comment in all_comments:
        # 30% chance of comment having replies
        if random.random() < 0.3:
            # Add 1-3 replies
            for _ in range(random.randint(1, 3)):
                reply = EventComment(
                    content=random.choice(reply_texts),
                    event_id=comment.event_id,
                    user_id=random.choice(all_users).id,
                    date_created=comment.date_created + datetime.timedelta(
                        hours=random.randint(1, 48)
                    ),
                    parent_comment_id=comment.id,
                    votes=random.randint(0, 5)
                )
                db.add(reply)

                # Update the comments_count field in the event
                event = db.query(Event).filter(Event.id == comment.event_id).first()
                if event:
                    event.comments_count += 1

    db.commit()
    print("Added replies to comments")

    # Add event registrations for some users
    print("Adding event registrations...")

    # Only add registrations for upcoming events
    future_events = [event for event in all_events if event.date_scheduled > datetime.datetime.now()]

    for event in future_events:
        # Between 5-20 registrations for each event
        registration_count = random.randint(5, 20)
        event_attendees = random.sample(all_users, min(registration_count, len(all_users)))

        for attendee in event_attendees:
            # Add event registration
            registration = EventRegistration(
                event_id=event.id,
                user_id=attendee.id,
                registration_time=datetime.datetime.now() - datetime.timedelta(
                    days=random.randint(1, 30),
                    hours=random.randint(0, 23)
                ),
                attendance_status=random.choice(["registered", "confirmed", "attended"])
            )
            db.add(registration)

    db.commit()
    print("Added event registrations")

    print("Database filled with initial data for users and events.")
