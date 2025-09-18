# app/schemas/attendance_schema.py
from sqlmodel import SQLModel
from typing import Optional
from datetime import date, datetime

class AttendanceCreate(SQLModel):
    #employee_id: int
    day: Optional[str] #added
    date: date
    action: str
    status: Optional[str] = "Not Marked" #added
    hours: Optional[int]
    project_name: Optional[str] #changed project to project_name
    sub_task: Optional[str]   #added

class AttendanceResponse(SQLModel):
    id: int
    employee_id: int
    day: Optional[str] #added
    date: date
    action: str
    status: Optional[str] #added
    hours: Optional[int]
    project_name: Optional[str] #changed project to project_name
    sub_task: Optional[str]   #added
    created_at: datetime
    updated_at: datetime

    