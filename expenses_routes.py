from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request
from sqlmodel import Session, select
from database import get_session
from models.expenses_model import ExpenseRequest, ExpenseAttachment, ExpenseHistory
from utils.code import generate_request_code
import os
from auth import get_current_user
from models.user_model import User
from models.employee_master_model import EmployeeMaster

router = APIRouter(prefix="/expenses", tags=["Expenses"])

UPLOAD_DIR = "uploads/expenses"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Public URL prefix (for frontend to fetch files)
BASE_URL = "http://localhost:8000" 


@router.post("/submit-exp", response_model=dict)
def submit_expense(
    employee_id: int = Form(...),
    category: str = Form(...),
    amount: float = Form(...),
    currency: str = Form(...),
    description: str = Form(None),
    expense_date: str = Form(...),
    tax_included: bool = Form(False),
    file: UploadFile = File(None),
    session: Session = Depends(get_session),
):
    req = ExpenseRequest(
        request_code=generate_request_code(),
        employee_id=employee_id,
        category=category,
        amount=amount,
        currency=currency,
        description=description,
        expense_date=datetime.strptime(expense_date, "%Y-%m-%d"),
        tax_included=tax_included,
    )
    session.add(req)
    session.commit()
    session.refresh(req)

    attachment_data = None
    if file:
        folder_path = os.path.join(UPLOAD_DIR, str(req.request_code))
        os.makedirs(folder_path, exist_ok=True)
        file_location = os.path.join(folder_path, file.filename)
        
        with open(file_location, "wb") as f:
            f.write(file.file.read())
            
        rel_path = os.path.join("uploads/expenses", str(req.request_code), file.filename).replace(os.sep, "/")

        attach = ExpenseAttachment(
            request_id=req.request_id,
            file_name=file.filename,
            file_path=rel_path,  # Relative path only
            file_type=file.content_type,
            file_size=os.path.getsize(file_location),
        )
        session.add(attach)
        session.commit()
        session.refresh(attach)
    
        # Build public URL for response (single prefix)
        public_url = f"{BASE_URL}/{rel_path.lstrip('/')}"
    
        attachment_data = {
            "attachment_id": attach.attachment_id,
            "file_name": attach.file_name,
            "file_path": public_url,  # Full URL in response for immediate use
            "file_type": attach.file_type,
            "file_size": attach.file_size,
        }

    return {
        "request_id": req.request_id,
        "request_code": req.request_code,
        "employee_id": req.employee_id,
        "category": req.category,
        "amount": req.amount,
        "currency": req.currency,
        "description": req.description,
        "expense_date": req.expense_date,
        "tax_included": req.tax_included,
        "status": req.status,
        "attachments": [attachment_data] if attachment_data else [],
    }

@router.get("/employee/{employee_id}", response_model=List[dict])
def list_my_expenses(employee_id: int, session: Session = Depends(get_session)):
    expenses = session.query(ExpenseRequest).filter(
        ExpenseRequest.employee_id == employee_id
    ).order_by(ExpenseRequest.created_at.desc()).all()

    result = []
    for exp in expenses:
        history_entries = []
        for h in getattr(exp, "history", []):  
            user = session.get(User, h.action_by)
            action_by_name = user.name if user else str(h.action_by)  

            history_entries.append(
                {
                    "action_by": h.action_by,          
                    "action_by_name": action_by_name,   
                    "action_role": h.action_role,
                    "action": h.action,
                    "reason": h.reason,
                    "created_at": h.created_at
                }
            )

        result.append(
            {
                "request_id": exp.request_id,
                "request_code": exp.request_code,
                "employee_id": exp.employee_id,
                "category": exp.category,
                "amount": exp.amount,
                "currency": exp.currency,
                "description": exp.description,
                "expense_date": exp.expense_date,
                "tax_included": exp.tax_included,
                "status": exp.status,
                "attachments": [
                    {
                        "attachment_id": att.attachment_id,
                        "file_name": att.file_name,
                        "file_path": att.file_path,  # already public URL
                        "file_type": att.file_type,
                        "file_size": att.file_size,
                    }
                    for att in exp.attachments
                ],
                "history": history_entries, 
            }
        )

    return result




@router.get("/mgr-exp-list", response_model=List[dict])
def list_all_expenses(request: Request, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):

    employee_links = session.exec(
        select(EmployeeMaster.emp_id).where(
            (EmployeeMaster.manager1_id == current_user.id) |
            (EmployeeMaster.manager2_id == current_user.id) |
            (EmployeeMaster.manager3_id == current_user.id)
        )
    ).all()

    if not employee_links:
        return []

    expenses = session.exec(select(ExpenseRequest).where(
            (ExpenseRequest.employee_id.in_(employee_links)) &
            (ExpenseRequest.status.in_([
                "pending_manager_approval",
                "pending_hr_approval",
                "mgr_rejected",
                "approved"
            ]))
        )
        .order_by(ExpenseRequest.created_at.desc())
    ).all()
    
    result = []

    for exp in expenses:
        employee = session.get(User, exp.employee_id)

        attachment_url = None
        if exp.attachments:
            att = exp.attachments[0]
            # keep relative path after "uploads/"
            rel_path = att.file_path.replace("\\", "/").split("uploads/")[-1]
            attachment_url = f"{request.base_url}uploads/{rel_path}"

        history_entries = session.exec(
            select(ExpenseHistory)
            .where(ExpenseHistory.request_id == exp.request_id)
            .order_by(ExpenseHistory.created_at.asc())
        ).all()

        manager_reason = None
        for h in history_entries:
            if h.action_role == "Manager" and h.reason:
                manager_reason = h.reason 

        result.append(
            {
                "id": exp.request_id,
                "employeeName": employee.name if employee else "Unknown",
                "employeeEmail": employee.email if employee else "Unknown",
                "category": exp.category,
                "amount": exp.amount,
                "currency": exp.currency,
                "status": exp.status,
                "description": exp.description,
                "date": exp.expense_date.strftime("%Y-%m-%d"),
                "taxIncluded": exp.tax_included,
                "attachment": attachment_url,
                "manager_rejection_reason": manager_reason or "-",
            }
        )
    return result

@router.put("/mgr-upd-status/{request_id}")
def update_expense_status(
    request_id: int,
    status: str = Form(...),
    reason: str = Form(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if status not in ["Pending", "Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    expense = session.get(ExpenseRequest, request_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Map frontend → DB statuses
    if status == "Pending":
        expense.status = "pending_manager_approval"
    elif status == "Approved":
        expense.status = "pending_hr_approval"
    elif status == "Rejected":
        expense.status = "mgr_rejected"

    expense.updated_at = datetime.utcnow()
    session.add(expense)
    session.commit()
    session.refresh(expense)

    history_entry = ExpenseHistory(
        request_id=request_id,
        action_by=current_user.id,
        action_role="Manager",
        action=status,
        reason=reason
    )
    session.add(history_entry)
    session.commit()

    return {
        "message": "Manager Status updated",
        "request_id": expense.request_id,
        "new_status": expense.status
    }


@router.get("/hr-exp-list", response_model=List[dict])
def list_hr_expenses(
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    
    employee_links = session.exec(
        select(EmployeeMaster.emp_id).where(
            (EmployeeMaster.hr1_id == current_user.id)
            | (EmployeeMaster.hr2_id == current_user.id)
        )
    ).all()

    if not employee_links:
        return []

    expenses = session.exec(
        select(ExpenseRequest)
        .where(
            ExpenseRequest.employee_id.in_(employee_links),
            ExpenseRequest.status.in_(
                ["pending_hr_approval", "pending_account_mgr_approval", "hr_rejected", "approved"]
            ),
        )
        .order_by(ExpenseRequest.created_at.desc())
    ).all()

    result = []
    for exp in expenses:
        employee = session.get(User, exp.employee_id)

        attachment_url = None
        if exp.attachments:
            att = exp.attachments[0]
            rel_path = att.file_path.replace("\\", "/").split("uploads/")[-1]
            attachment_url = f"{request.base_url}uploads/{rel_path}"

        history_entries = session.exec(
            select(ExpenseHistory)
            .where(ExpenseHistory.request_id == exp.request_id)
            .order_by(ExpenseHistory.created_at.desc())
        ).all()

        hr_reason = None
        for h in history_entries:
            if h.action_role == "HR" and h.reason:
                hr_reason = h.reason 

        result.append(
            {
                "id": exp.request_id,
                "employeeName": employee.name if employee else "Unknown",
                "employeeEmail": employee.email if employee else "Unknown",
                "category": exp.category,
                "amount": exp.amount,
                "currency": exp.currency,
                "status": exp.status,
                "description": exp.description,
                "date": exp.expense_date.strftime("%Y-%m-%d"),
                "taxIncluded": exp.tax_included,
                "attachment": attachment_url,
                "hr_rejection_reason": hr_reason or "-",
            }
        )

    return result

@router.put("/hr-upd-status/{request_id}")
def update_hr_status(
    request_id: int,
    status: str = Form(...),
    reason: str = Form(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if status not in ["Pending", "Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    expense = session.get(ExpenseRequest, request_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Map frontend → DB statuses
    if status == "Pending":
        expense.status = "pending_hr_approval"
    elif status == "Approved":
        expense.status = "pending_account_mgr_approval"
    elif status == "Rejected":
        expense.status = "hr_rejected"

    expense.updated_at = datetime.utcnow()
    session.add(expense)
    session.commit()
    session.refresh(expense)

    history_entry = ExpenseHistory(
        request_id=request_id,
        action_by=current_user.id,
        action_role="HR",
        action=status,
        reason=reason
    )
    session.add(history_entry)
    session.commit()

    return {
        "message": "HR status updated",
        "request_id": expense.request_id,
        "new_status": expense.status
    }

@router.get("/acc-mgr-exp-list", response_model=List[dict])
def list_acc_mgr_expenses(request: Request, session: Session = Depends(get_session)):
    expenses = session.exec(
        select(ExpenseRequest)
        .where(ExpenseRequest.status.in_(["pending_account_mgr_approval","approved", "acc_mgr_rejected"]))
        .order_by(ExpenseRequest.created_at.desc())
    ).all()

    result = []
    for exp in expenses:
        employee = session.get(User, exp.employee_id)

        attachment_url = None
        if exp.attachments:
            att = exp.attachments[0]
            rel_path = att.file_path.replace("\\", "/").split("uploads/")[-1]
            attachment_url = f"{request.base_url}uploads/{rel_path}"


        history_entries = session.exec(
            select(ExpenseHistory)
            .where(ExpenseHistory.request_id == exp.request_id)
            .order_by(ExpenseHistory.created_at.asc())
        ).all()

        acc_mgr_reason = None
        for h in history_entries:
            if h.action_role == "Account Manager" and h.reason:
                acc_mger_reason = h.reason 

        result.append(
            {
                "id": exp.request_id,
                "employeeName": employee.name if employee else "Unknown",
                "employeeEmail": employee.email if employee else "Unknown",
                "category": exp.category,
                "amount": exp.amount,
                "currency": exp.currency,
                "status": exp.status,
                "description": exp.description,
                "date": exp.expense_date.strftime("%Y-%m-%d"),
                "taxIncluded": exp.tax_included,
                "attachment": attachment_url,
                "account_manager_rejection_reason": acc_mgr_reason or "-",
            }
        )
    return result


@router.put("/acc-mgr-upd-status/{request_id}")
def update_acc_mgr_status(
    request_id: int,
    status: str = Form(...),           
    reason: str = Form(None),           
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):

    if status not in ["Pending", "Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    expense = session.get(ExpenseRequest, request_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Map frontend → DB statuses
    if status == "Pending":
        expense.status = "pending_account_mgr_approval"
    elif status == "Approved":
        expense.status = "approved"
    elif status == "Rejected":
        expense.status = "acc_mgr_rejected"
        expense.account_mgr_rejection_reason = reason

    expense.updated_at = datetime.utcnow()
    session.add(expense)
    session.commit()
    session.refresh(expense)

    history_entry = ExpenseHistory(
        request_id=request_id,
        action_by=current_user.id,
        action_role="Account Manager",
        action=status,
        reason=reason
    )
    session.add(history_entry)
    session.commit()

    return {
        "message": "Account Manager status updated",
        "request_id": expense.request_id,
        "new_status": expense.status
    }
