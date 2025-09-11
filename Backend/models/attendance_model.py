# app/models/attendance_model.py
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, date

class Attendance(SQLModel, table=True):
    __tablename__ = "attendance"
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employees.id")
    date: date
    action: Optional[str] = Field(max_length=20)
    hours: Optional[int]
    project: Optional[str] = Field(max_length=100)
    created_at: Optional[datetime] = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = Field(default_factory=datetime.now)