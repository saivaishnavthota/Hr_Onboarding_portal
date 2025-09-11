from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, text
from database import get_session
from models.attendance_model import Attendance
from schemas.attendance_schema import AttendanceCreate
from typing import Dict
from auth import get_current_user
from datetime import datetime
from models.user_model import User

router = APIRouter(tags=["Attendance"])

@router.post("/attendance")
async def save_attendance(data: Dict[str, AttendanceCreate], session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    try:
        for date_str, entry in data.items():
            session.execute(
                text("SELECT save_attendance(:employee_id, :date, :action, :hours, :project)"),
                {
                    "employee_id": current_user.id,
                    "date": entry.date,
                    "action": entry.action,
                    "hours": entry.hours,
                    "project": entry.project
                }
            )
        session.commit()
        return {"success": True, "message": "Attendance submitted successfully"}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))