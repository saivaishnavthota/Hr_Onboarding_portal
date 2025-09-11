# app/schemas/leave_balance_schema.py
from sqlmodel import SQLModel
from typing import Optional
from datetime import datetime

class LeaveBalanceResponse(SQLModel):
    id: int
    employee_id: int
    sick_leaves: int
    casual_leaves: int
    paid_leaves: int
    created_at: datetime
    updated_at: datetime