# app/schemas/user_schema.py
from sqlmodel import SQLModel
from typing import Optional
from datetime import datetime,date
from pydantic import EmailStr

class UserCreate(SQLModel):
    name: str
    email: str
   

class UserResponse(SQLModel):
    employeeId: int
    name: str
    role: str
    onboarding_status: bool
    message: Optional[str] = None
    access_token: Optional[str] = None

class UserLogin(SQLModel):
    email: str
    password: str
  

class ResetPasswordRequest(SQLModel):
    email: EmailStr
    current_password: str
    new_password: str

class ForgotPasswordRequest(SQLModel):
    email: EmailStr

class Employee(SQLModel):
    employeeId: int
    name: str
    email: str
    role: str
    hrs: list[str]
    managers: list[str]

class AssignRequest(SQLModel):
    id: int
    manager1_id: int
    hr1_id: int
    manager2_id: Optional[int] = None
    manager3_id: Optional[int] = None
    hr2_id: Optional[int] = None

class AssignResponse(SQLModel):
    status: str
    message: str

class EmployeeOnboardingRequest(SQLModel):
    employee_id: int
    full_name: str
    contact_no: str
    personal_email: str
    doj: date  # Date of Joining
    dob: date  # Date of Birth
    address: str
    gender: str
    graduation_year: int
    work_experience_years: int
    emergency_contact_name: str
    emergency_contact_number: str
    emergency_contact_relation: str

class EmployeeOnboardingResponse(SQLModel):
    status: str
    message: str
    employee_id: int