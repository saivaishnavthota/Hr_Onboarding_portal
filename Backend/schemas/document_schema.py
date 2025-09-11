# app/schemas/document_schema.py
from sqlmodel import SQLModel
from typing import Optional

class DocumentCreate(SQLModel):
    employee_id: int
    file_name: str
    file_type: str
    file_data: bytes

class DocumentResponse(SQLModel):
    id: int
    employee_id: int
    file_name: str
    file_type: str