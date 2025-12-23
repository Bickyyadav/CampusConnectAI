# API routes

from fastapi import APIRouter, HTTPException
from beanie import PydanticObjectId
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


@router.get("/calls")
async def get_all_calls():
    """Get all calls sorted by date (newest first)."""
    return await User.find_all().sort("-createdAt").to_list()


@router.get("/call/{id}")
async def get_call_by_id(id: str):
    """Get a specific call by ID."""
    try:
        user = await User.get(PydanticObjectId(id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    if not user:
        raise HTTPException(status_code=404, detail="Call not found")
    return user


import os
from server_utils import make_twilio_call, DialoutRequest
from models.user import CallStatus


@router.post("/redial/{id}")
async def redial_user(id: str):
    """Redial a user by their ID."""
    try:
        # Find original user record
        original_user = await User.get(PydanticObjectId(id))
        if not original_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get from_number from env
        from_number = os.getenv("TWILIO_FROM_NUMBER")
        if not from_number:
            raise HTTPException(status_code=500, detail="TWILIO_FROM_NUMBER not set")

        to_number = original_user.phonenumber
        if not to_number:
            raise HTTPException(status_code=400, detail="User has no phone number")

        # Initiate call
        dialout_req = DialoutRequest(to_number=to_number, from_number=from_number)
        call_result = await make_twilio_call(dialout_req)

        # Create NEW user record for this call
        new_user = User(
            name=original_user.name,
            email=original_user.email,
            phonenumber=to_number,
            call_sid=call_result.call_sid,
            status=CallStatus.RINGING,
        )
        await new_user.insert()

        return {
            "status": "initiated",
            "call_sid": call_result.call_sid,
            "new_user_id": str(new_user.id),
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from datetime import datetime, timezone, timedelta


@router.patch("/{id}/timestamp")
async def update_timestamp(id: str):
    """Update user's time_to_call to current UTC time."""
    try:
        user = await User.get(PydanticObjectId(id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.time_to_call = datetime.now(timezone.utc)
        await user.save()

        return {"message": "Timestamp updated", "time_to_call": user.time_to_call}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# async def check_scheduled_calls():
#     """Check for scheduled calls and initiate them."""
#     try:
#         now = datetime.now(timezone.utc)
#         print(f"DEBUG: Checking for calls at UTC: {now}")

#         # Debug: Check any user with time_to_call set
#         users_with_time = await User.find(User.time_to_call != None).to_list()
#         print(f"DEBUG: Total users with time_to_call set: {len(users_with_time)}")
#         for u in users_with_time:
#             print(
#                 f"DEBUG: Found User: {u.name}, Status: '{u.status}', Time: {u.time_to_call}"
#             )

#         # "Ignore seconds" => check if time_to_call is within the current minute
#         # We check: start_of_minute <= time_to_call < start_of_next_minute
#         start_of_minute = now.replace(second=0, microsecond=0)
#         end_of_minute = start_of_minute + timedelta(minutes=1)

#         print(f"DEBUG: Matching window: {start_of_minute} <= time < {end_of_minute}")

#         scheduled_users = await User.find(
#             User.time_to_call >= start_of_minute,
#             User.time_to_call < end_of_minute,
#         ).to_list()

#         if scheduled_users:
#             print(f"Found {len(scheduled_users)} scheduled calls.")
#             from_number = os.getenv("TWILIO_FROM_NUMBER")

#             for user in scheduled_users:
#                 if user.phonenumber and from_number:
#                     try:
#                         print(f"Initiating callback for {user.name}")
#                         dialout_req = DialoutRequest(
#                             to_number=user.phonenumber, from_number=from_number
#                         )
#                         print("Initiating Twilio Call...")
#                         call_result = await make_twilio_call(dialout_req)

#                         # Create NEW user record for this call
#                         new_user = User(
#                             name=user.name,
#                             email=user.email,
#                             phonenumber=user.phonenumber,
#                             call_sid=call_result.call_sid,
#                             status=CallStatus.RINGING,
#                         )
#                         await new_user.insert()

#                         # Mark original request as COMPLETED so we don't call again
#                         user.status = CallStatus.COMPLETED
#                         user.time_to_call = None
#                         await user.save()
#                         print(f"Callback initiated for {user.name}")

#                     except Exception as e:
#                         print(f"Failed to callback {user.name}: {e}")

#     except Exception as e:
#         print(f"Error in check_scheduled_calls: {e}")
