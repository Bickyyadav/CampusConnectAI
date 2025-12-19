from fastapi import APIRouter
from core.database import client

health_router = APIRouter(tags=["Health"])

@health_router.get("/health")
async def health_check():
    try:
        # Check MongoDB connection
        if client:
            await client.admin.command("ping")
            db_status = "connected"
        else:
            db_status = "not initialized"
            
        return {
            "status": "ok",
            "database": db_status
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "detail": str(e)
        }
