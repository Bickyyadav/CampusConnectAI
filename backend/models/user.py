#database schema  in this pdf 

from beanie import Document
from pydantic import EmailStr, Field
from enum import Enum
from datetime import datetime


class CallStatus(str, Enum):
    PENDING = "PENDING"
    RINGING = "RINGING"
    CONNECTED = "CONNECTED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class User(Document):
    name: str
    email: EmailStr
    phonenumber: str
    call_sid: str
    Transcript: str
    Duration: int
    Quality_Score: int
    Analysis: str
    Recording_URL: str
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
