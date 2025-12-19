import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(override=True)

async def test_connect():
    mongo_url = os.getenv("MONGO_URL")
    print(f"Testing connection to: {mongo_url}")
    
    if not mongo_url:
        print("❌ MONGO_URL not set")
        return

    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        # Force a connection attempt
        await client.admin.command("ping")
        print("✅ Connected successfully!")
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connect())
