# API routes

from fastapi import APIRouter
from models.user import User
from schemas.user import UserCreate, UserResponse
from core.database import client

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserResponse)
async def create_user(data: UserCreate):
    user = User(**data.dict())
    await user.insert()
    return user

@router.get("/")
async def get_users():
    return await User.find_all().to_list()

@router.get("/health")
async def health_check():
    try:
        await client.admin.command("ping")
        return {"status": "ok", "db": "connected"}
    except Exception:
        return {"status": "error", "db": "not connected"}
                        






