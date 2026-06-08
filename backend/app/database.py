"""
MongoDB connection using Motor async driver.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import get_settings


class Database:
    """Manages the MongoDB connection lifecycle."""

    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

    async def connect(self):
        """Initialize MongoDB connection and create indexes."""
        settings = get_settings()
        self.client = AsyncIOMotorClient(settings.MONGODB_URL)
        self.db = self.client[settings.DATABASE_NAME]

        # Create compound index for efficient user-scoped queries
        await self.db.queue_items.create_index(
            [("user_id", 1), ("position", 1)],
            background=True,
        )
        print(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")

    async def disconnect(self):
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            print("🔌 Disconnected from MongoDB")

    def get_db(self) -> AsyncIOMotorDatabase:
        """Return the database instance."""
        return self.db


# Singleton database instance
database = Database()


async def get_database() -> AsyncIOMotorDatabase:
    """FastAPI dependency to get the database instance."""
    return database.get_db()
