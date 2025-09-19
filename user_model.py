from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

class User(SQLModel, table=True):
    __tablename__ = "employees"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: Optional[str] = Field(max_length=100)
    email: Optional[str] = Field(max_length=100)
    password_hash: Optional[str]
    role: Optional[str] = Field(max_length=100)
    o_status: Optional[bool] = Field(default=False)
    created_at: Optional[datetime] = Field(default_factory=datetime.now)
    manager_id: Optional[int] = Field(default=None, foreign_key="employees.id")
    hr_id: Optional[int] = Field(default=None, foreign_key="employees.id")
    location_id: Optional[int] = Field(default=None, foreign_key="locations.location_id")

    expense_requests: List["ExpenseRequest"] = Relationship(back_populates="employee")
    location: Optional["Location"] = Relationship(back_populates="employees")

from models.expenses_model import ExpenseRequest
from models.location_model import Location
User.update_forward_refs()