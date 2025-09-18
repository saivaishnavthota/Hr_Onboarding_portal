# app/models/attendance_model.py
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, date

class Attendance(SQLModel, table=True):
    __tablename__ = "attendance"
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employees.id")
    day: Optional[str] = Field(max_length=15) #added
    date: date
    action: Optional[str] = Field(max_length=20)
    status: Optional[str] = Field(max_length=20, default="Not Marked") #added
    hours: Optional[int]
    project_name: Optional[str] = Field(max_length=100) #changed project to project_name
    sub_task: Optional[str] = Field(max_length=150)  #added
    created_at: Optional[datetime] = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = Field(default_factory=datetime.now)