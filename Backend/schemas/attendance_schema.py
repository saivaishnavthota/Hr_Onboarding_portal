# app/schemas/attendance_schema.py
from sqlmodel import SQLModel
from typing import Optional
from datetime import date, datetime

class AttendanceCreate(SQLModel):
    employee_id: int
    date: date
    action: str
    hours: Optional[int]
    project: Optional[str]

class AttendanceResponse(SQLModel):
    id: int
    employee_id: int
    date: date
    action: str
    hours: Optional[int]
    project: Optional[str]
    created_at: datetime
    updated_at: datetime