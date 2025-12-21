# # Request / Response (Pydantic)
from pydantic import BaseModel, EmailStr

# from pydantic import BaseModel, EmailStr, AnyUrl, Field, Annotated
# from typing import Dict, Optional, List


class UserCreate(BaseModel):
    name: str
    email: EmailStr


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr


# class UserResponse(BaseModel):
#     id: str
#     name: str = Field(max_length=100)
#     name: Annotated[
#         str,
#         Field(
#             max_length=100,
#             title="Name of the patient so that make the url more attractive to build",
#             description="give the name of the famous person in the world",
#             example=["bicky", "abinash"],
#         ),
#     ]
#     email: EmailStr
#     linkdeinUrl: AnyUrl
#     age: int = Field(gt=18, lt=20)
#     marriage: bool = False
#     weight: int = Field(gt=40, lt=100)
#     allergies: optional[list[str]] = Field(max_length=18)
# contact_details: Dict[str, str] = Field(max_length=18)
