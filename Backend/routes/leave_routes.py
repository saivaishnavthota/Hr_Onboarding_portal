# app/routes/leave_routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime
from sqlalchemy import text
from database import get_session
from models.leave_model import LeaveManagement
from models.user_model import User  # assuming you already have this
from schemas.leave_schema import LeaveCreate, LeaveResponse, LeaveApprovalCreate
from schemas.leave_balance_schema import LeaveBalanceResponse,LeaveBalance
router = APIRouter()

# ------------------ EMPLOYEE APPLY LEAVE ------------------ #
@router.post("/apply_leave")
def apply_leave(leave: dict, session: Session = Depends(get_session)):
    try:
        result = session.execute(
            text("""
                SELECT * FROM apply_leave(
                    :employee_id, 
                    :leave_type, 
                    :reason, 
                    :start_date, 
                    :end_date
                )
            """),
            {
                "employee_id": leave["employee_id"],
                "leave_type": leave["leave_type"],
                "reason": leave["reason"],
                "start_date": leave["start_date"],
                "end_date": leave["end_date"],
            },
        )

        row = result.fetchone()
        session.commit()

        if not row:
            raise HTTPException(status_code=500, detail="Leave not created")

        # ✅ Map DB → frontend keys
        return {
            "id": row.id,
            "leaveType": row.leave_type,
            "startDate": row.start_date,
            "endDate": row.end_date,
            "totalDays": row.no_of_days,
           
            "reason": row.reason,
            "status": row.status
        }

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error applying leave: {str(e)}")

# ------------------ EMPLOYEE LEAVE HISTORY ------------------ #
@router.get("/all_leaves/{employee_id}", response_model=list[LeaveResponse])
def get_all_leaves(employee_id: int, session: Session = Depends(get_session)):
    leaves = session.exec(
        select(LeaveManagement).where(LeaveManagement.employee_id == employee_id)
    ).all()
    return leaves


# ------------------ HR PENDING LEAVES ------------------ #
@router.get("/hr/pending-leaves")
def get_pending_leaves(session: Session = Depends(get_session)):
    leaves = session.exec(
        select(LeaveManagement).where(LeaveManagement.status == "Pending")
    ).all()

    results = []
    for leave in leaves:
        emp = session.get(User, leave.employee_id)
        results.append({
            "id": leave.id,
            "employee_id": leave.employee_id,
            "employee_name": emp.name if emp else "Unknown",
            "email": emp.email if emp else "",
            "leave_type": leave.leave_type,
            "start_date": str(leave.start_date),
            "end_date": str(leave.end_date),
            "days": leave.no_of_days,
            "status": leave.status,
            "reason":leave.reason
        })
    return results


# ------------------ HR ALL LEAVES ------------------ #
@router.get("/hr/all-leaves")
def get_all_hr_leaves(session: Session = Depends(get_session)):
    leaves = session.exec(select(LeaveManagement)).all()

    results = []
    for leave in leaves:
        emp = session.get(User, leave.employee_id)
        results.append({
            "id": leave.id,
            "employee_id": leave.employee_id,
            "employee_name": emp.name if emp else "Unknown",
            "email": emp.email if emp else "",
            "leave_type": leave.leave_type,
            "start_date": str(leave.start_date),
            "end_date": str(leave.end_date),
            "days": leave.no_of_days,
            "status": leave.status,
            "reason":leave.reason
        })
    return results


# ------------------ HR APPROVE / REJECT LEAVE ------------------ #
@router.post("/hr/leave-action/{leave_id}")
def hr_leave_action(leave_id: int, data: dict, session: Session = Depends(get_session)):
    leave = session.get(LeaveManagement, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave not found")

    action = data.get("action")
    if action not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid action")

    leave.hr_status = action
    leave.status = action
    leave.updated_at = datetime.now()

    session.add(leave)
    session.commit()
    session.refresh(leave)

    return {"success": True, "message": f"Leave {action}"}


@router.get("/leave_balances/{employee_id}")
def get_leave_balance(employee_id: int, session: Session = Depends(get_session)):
    balance = session.exec(
        select(LeaveBalance).where(LeaveBalance.employee_id == employee_id)
    ).first()
    if not balance:
        raise HTTPException(status_code=404, detail="Leave balance not found")
    return balance