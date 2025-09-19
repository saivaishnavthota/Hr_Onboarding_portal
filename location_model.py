from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List

class Location(SQLModel, table=True):
    __tablename__ = "locations"

    location_id: Optional[int] = Field(default=None, primary_key=True)
    location_name: str = Field(max_length=100, unique=True)
    region: Optional[str] = None
    country: Optional[str] = None

    employees: List["User"] = Relationship(back_populates="location")

# at the end of file
from models.user_model import User
Location.update_forward_refs()
