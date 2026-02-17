"""
Database connection and configuration for MongoDB.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from typing import Optional

from app.config import settings
from app.models.user import User
from app.models.resume import Resume
from app.models.job import JobDescription
from app.models.interview import Interview
from app.models.screening import ScreeningResult
from app.models.conversation import Conversation
from app.models.application import Application
from app.models.message import DirectMessage, DirectConversation
from app.models.notification import Notification


class Database:
    """Database connection manager."""
    
    client: Optional[AsyncIOMotorClient] = None
    

db = Database()


async def connect_to_mongo():
    """Connect to MongoDB and initialize Beanie ODM."""
    db.client = AsyncIOMotorClient(settings.MONGODB_URI)
    
    # Initialize Beanie with document models
    await init_beanie(
        database=db.client[settings.DATABASE_NAME],
        document_models=[
            User,
            Resume,
            JobDescription,
            Interview,
            ScreeningResult,
            Conversation,
            Application,
            DirectMessage,
            DirectConversation,
            Notification,
        ]
    )
    
    print(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")


async def close_mongo_connection():
    """Close MongoDB connection."""
    if db.client:
        db.client.close()
        print("❌ Disconnected from MongoDB")


def get_database():
    """Get database instance."""
    return db.client[settings.DATABASE_NAME]

