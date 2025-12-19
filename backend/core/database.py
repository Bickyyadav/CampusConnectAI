from dotenv import load_dotenv
load_dotenv()
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from models.user import User
import os

client: AsyncIOMotorClient | None = None

async def init_db():
    global client

    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME")

    if not mongo_url or not db_name:
        raise RuntimeError("MONGO_URL or DB_NAME is not set")

    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        await client.admin.command("ping")

        database = client[db_name]

        await init_beanie(database=database, document_models=[User])

        print("✅ MongoDB connected successfully")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        client = None

async def close_db():
    if client:
        client.close()

