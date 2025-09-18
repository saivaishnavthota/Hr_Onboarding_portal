from sqlmodel import SQLModel

class HolidayCreate(SQLModel):
    location_id: int
    holiday_date: str
    holiday_name: str
