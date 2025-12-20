import datetime
import wave
import os
import httpx
import asyncio
from loguru import logger
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi import Request, BackgroundTasks, HTTPException
import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
from models.user import User

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_SECRET_KEY"),
    secure=True,
)


async def upload_file_to_cloud(file_path: str, call_id: str = None):
    """Upload a single audio file to Cloudinary and remove it locally."""
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Recording file not found")

    try:
        result = cloudinary.uploader.upload(
            file_path,
            folder="AudioFile",
            use_filename=True,
            resource_type="auto",
        )
        secure_url = result.get("secure_url")
        logger.info("Uploaded recording to Cloudinary: {}", secure_url)

        # db_entry = await _persist_recording_url(secure_url)
        if call_id:
            user = await User.find_one(User.call_sid == call_id)
            if user:
                user.Recording_URL = secure_url
                await user.save()
                logger.info(f"Updated recording URL for user {user.id}")
            else:
                logger.warning(
                    f"No user found for call_id {call_id} to save recording URL"
                )

        return {
            "msg": "Audio uploaded successfully",
            "src": secure_url,
            "recording_id": "🔴🔴🔴🔴🔴🔴🔴🔴🐈🐈🐈🐈",
        }

    except Exception as exc:
        logger.exception("Failed to upload recording %s", file_path)
        raise HTTPException(
            status_code=422,
            detail=f"Cloud upload failed: {exc}",
        ) from exc
    finally:
        try:
            os.remove(file_path)
        except OSError as cleanup_error:
            logger.warning(
                "Could not delete local recording %s: %s", file_path, cleanup_error
            )


async def save_recording(buffer, audio, sample_rate, num_channels, call_id: str = None):
    """Save audio locally and upload complete file to cloudinary."""
    # Ensure recordings directory exists
    recordings_dir = "recordings"
    if not os.path.exists(recordings_dir):
        os.makedirs(recordings_dir)
        logger.info(f"Created recordings directory: {recordings_dir}")

    # Save audio file locally
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{recordings_dir}/conversation_{timestamp}.wav"

    # Create the WAV file
    with wave.open(filename, "wb") as wf:
        wf.setnchannels(num_channels)
        wf.setsampwidth(2)  # 16-bit audio
        wf.setframerate(sample_rate)
        wf.writeframes(audio)

    await upload_file_to_cloud(filename, call_id)
