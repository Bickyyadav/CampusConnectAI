# database schema  in this pdf

from beanie import Document
from pydantic import EmailStr, Field
from enum import Enum
from datetime import datetime
from typing import Optional


class CallStatus(str, Enum):
    PENDING = "PENDING"
    RINGING = "ringing"
    CONNECTED = "connected"
    COMPLETED = "completed"
    FAILED = "failed"
    NO_ANSWER = "no-answer"
    BUSY = "busy"
    CANCELED = "canceled"
    IN_PROGRESS = "in-progress"
    QUEUED = "queued"
    SCHEDULED = "scheduled"


class User(Document):
    name: str
    email: EmailStr
    phonenumber: str
    call_sid: str
    Transcript: str | None = None
    Duration: int | None = None
    Quality_Score: int | None = None
    Analysis: str | None = None
    Recording_URL: str | None = None
    CallerCountry: str | None = None
    CallerZip: str | None = None
    ToCountry: str | None = None
    FromCountry: str | None = None
    Intent: str | None = None
    Outcome: str | None = None
    time_to_call: Optional[datetime] = None
    status: CallStatus = CallStatus.PENDING

    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "user"  # MongoDB collection name

        indexes = [
            "email",  # unique index handled below
        ]

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Vicky Yadav",
                "email": "vicky@example.com",
                "phonenumber": "+919999999999",
                "call_sid": "CA123456789",
                "Transcript": "Hello, this is a test call",
                "Duration": 120,
                "Quality_Score": 85,
                "Analysis": "Call quality was good",
                "Recording_URL": "https://recordings.example.com/123",
                "status": "PENDING",
            }
        }
