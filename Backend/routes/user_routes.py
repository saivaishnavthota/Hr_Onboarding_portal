from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from models.user_model import User
from schemas.user_schema import UserCreate, UserResponse, UserLogin, EmployeeOnboardingRequest,EmployeeOnboardingResponse,ResetPasswordRequest,EmployeeOnboardingRequest, ForgotPasswordRequest,Employee,AssignRequest,AssignResponse
from utils.email import send_login_email
from auth import get_current_user, create_access_token, verify_password, role_required, hash_password
from database import get_session
from sqlalchemy.sql import text
from models.employee_master_model import EmployeeMaster
from schemas.employee_master_schema import EmployeeMasterCreate, EmployeeMasterResponse


router = APIRouter(prefix="/users", tags=["Users"])


# ----------------------------
# Create Employee (HR only)
# ----------------------------
@router.post("/hr/create_employee", response_model=UserResponse)
async def create_employee(
    user: UserCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(role_required("HR"))
):
    # Check if email exists
    db_user = session.exec(select(User).where(User.email == user.email)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Call stored procedure correctly
    query = text("SELECT add_employee(:name, :email)")\
        .bindparams(name=user.name, email=user.email)
    temp_password = session.exec(query).scalar()

    session.commit() 

    if not temp_password:
        raise HTTPException(status_code=500, detail="Failed to create employee")

    # Fetch new user
    new_user = session.exec(select(User).where(User.email == user.email)).first()
    if not new_user:
        raise HTTPException(status_code=500, detail="Failed to retrieve created employee")

    # Send login email
    await send_login_email(user.email, temp_password)

    return UserResponse(
        employeeId=new_user.id,
        name=new_user.name,
        
        message=f"Employee created successfully with ID: {new_user.id}"
    )

@router.post("/login", response_model=UserResponse)
async def login(user: UserLogin, session: Session = Depends(get_session)):
    email = user.email.strip().lower()
    password = user.password.strip()

    # Get user by email
    db_user = session.exec(select(User).where(User.email == email)).first()

    if not db_user or not verify_password(password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create JWT token
    access_token = create_access_token(
        data={"sub": db_user.email},
        
    )

    return UserResponse(
        employeeId=db_user.id,
        name=db_user.name,
        role=db_user.role,
        access_token=access_token,  
        onboarding_status=db_user.o_status,
        message=f"Welcome, {db_user.name}!"
    )

# ----------------------------
# Reset Password
# ----------------------------
@router.post("/reset_password")
async def reset_password(req: ResetPasswordRequest, session: Session = Depends(get_session)):
    email = req.email.strip().lower()
    old_password = req.current_password.strip()
    new_password = req.new_password.strip()

    # 1️⃣ Check if the email exists
    statement = select(User).where(User.email == email)
    db_user = session.exec(statement).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Email not found")

    # 2️⃣ Verify old password
    if not verify_password(old_password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    # 3️⃣ Hash the new password and update
    db_user.password_hash = hash_password(new_password)
    session.add(db_user)
    session.commit()

    return {"status": "success", "message": "Password updated successfully"}
    

# ----------------------------
# Forgot Password
# ----------------------------
@router.post("/forgot_password")
async def forgot_password(req: ForgotPasswordRequest, session: Session = Depends(get_session)):
    try:
        # Bind email parameter correctly
        query = text("SELECT forgot_password(:email)").bindparams(email=req.email.lower())
        temp_password = session.exec(query).first()

        if not temp_password:
            raise HTTPException(status_code=404, detail="Email not found")

        email_sent = await send_login_email(req.email, temp_password[0] if isinstance(temp_password, tuple) else temp_password)
        if not email_sent:
            raise HTTPException(status_code=500, detail="Failed to send email")

        session.commit()
        return {"status": "success", "message": f"Temporary password sent to {req.email}"}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    

    # ----------------------------
# Get all managers
# ----------------------------
@router.get("/managers")
async def display_managers(session: Session = Depends(get_session)):
    statement = select(User.id, User.name).where(User.role == "Manager")
    managers = session.exec(statement).all()
    manager_list = [{"id": m[0], "name": m[1]} for m in managers]
    return {"managers": manager_list}

# ----------------------------
# Get all HRs
# ----------------------------
@router.get("/hrs")
async def display_hrs(session: Session = Depends(get_session)):
    statement = select(User.id, User.name).where(User.role == "HR")
    hrs = session.exec(statement).all()
    hr_list = [{"id": h[0], "name": h[1]} for h in hrs]
    return {"HRs": hr_list}

# ----------------------------
# Get all employees with their assigned HRs and Managers
# ----------------------------

@router.get("/employees")
async def display_employees(session: Session = Depends(get_session)):
    query = text("""
    SELECT
        e.id AS employeeId,
        e.name,
        e.email,
        e.role,
        ARRAY_REMOVE(ARRAY[m1.name, m2.name], NULL) AS hr,
        ARRAY_REMOVE(ARRAY[mgr1.name, mgr2.name, mgr3.name], NULL) AS managers
    FROM employees e
    LEFT JOIN employee_master em ON e.id = em.emp_id
    LEFT JOIN employees m1 ON em.hr1_id = m1.id
    LEFT JOIN employees m2 ON em.hr2_id = m2.id
    LEFT JOIN employees mgr1 ON em.manager1_id = mgr1.id
    LEFT JOIN employees mgr2 ON em.manager2_id = mgr2.id
    LEFT JOIN employees mgr3 ON em.manager3_id = mgr3.id;
    """)
 
    result = session.exec(query).all()
    employees = []
    for row in result:
        employees.append({
            "employeeId": row.employeeid,  
            "name": row.name,
            "email": row.email,
            "role": row.role,
            "hr": row.hr,
            "managers": row.managers
        })
    return employees

@router.post("/assign", response_model=EmployeeMasterResponse)
async def assign_employee(data: EmployeeMasterCreate, session: Session = Depends(get_session)):
    try:
        if not (data.emp_id and data.manager1_id and data.hr1_id):
            raise HTTPException(status_code=400, detail="Missing required data")
       
        existing = session.exec(select(EmployeeMaster).where(EmployeeMaster.emp_id == data.emp_id)).first()
 
        if existing:
            existing.manager1_id = data.manager1_id
            existing.manager2_id = data.manager2_id
            existing.manager3_id = data.manager3_id
            existing.hr1_id = data.hr1_id
            existing.hr2_id = data.hr2_id
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing
        else:
            assignment = EmployeeMaster(
                emp_id=data.emp_id,
                manager1_id=data.manager1_id,
                manager2_id=data.manager2_id,
                manager3_id=data.manager3_id,
                hr1_id=data.hr1_id,
                hr2_id=data.hr2_id,
            )
            session.add(assignment)
            session.commit()
            session.refresh(assignment)
            return assignment
 
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Onboarding endpoint
@router.post("/onboard", response_model=EmployeeOnboardingResponse)
async def onboard_employee(
    employee_data: EmployeeOnboardingRequest,
    session: Session = Depends(get_session)
):
    """
    Onboard a new employee by storing their details in the database
    using the emp_details stored procedure
    """
    try:
        logger.info(f"Starting onboarding process for employee ID: {employee_data.employee_id}")
        
        # Validate session
        if session is None:
            raise HTTPException(status_code=500, detail="Database session is not available")

        # Call the PostgreSQL function
        with session.connection().connection.cursor() as cur:
            cur.execute(
                "SELECT emp_details(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);",
                (
                    employee_data.employee_id,
                    employee_data.full_name,
                    employee_data.contact_no,
                    employee_data.personal_email,
                    employee_data.doj,
                    employee_data.dob,
                    employee_data.address,
                    employee_data.gender,
                    employee_data.graduation_year,
                    employee_data.work_experience_years,
                    employee_data.emergency_contact_name,
                    employee_data.emergency_contact_number,
                    employee_data.emergency_contact_relation
                )
            )
            
            # If using the version that returns a message
            result = cur.fetchone()
            if result:
                db_message = result[0]
                logger.info(f"Database response: {db_message}")
            
        session.commit()
        logger.info(f"Successfully onboarded employee ID: {employee_data.employee_id}")
        
        return EmployeeOnboardingResponse(
            status="success",
            message="Employee onboarded successfully",
            employee_id=employee_data.employee_id
        )

    except Exception as e:
        session.rollback()
        logger.error(f"Error onboarding employee {employee_data.employee_id}: {str(e)}")
        
        # Handle specific database errors
        if "duplicate key" in str(e).lower():
            raise HTTPException(
                status_code=400, 
                detail=f"Employee with ID {employee_data.employee_id} already exists"
            )
        elif "foreign key" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail="Invalid employee ID or related data constraint violation"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Internal server error: {str(e)}"
            )

# Get employee details endpoint
@router.get("/employee/{employee_id}")
async def get_employee_details(
    employee_id: int,
    session: Session = Depends(get_session)
):
    """
    Retrieve employee details by employee ID
    """
    try:
        if session is None:
            raise HTTPException(status_code=500, detail="Database session is not available")

        with session.connection().connection.cursor() as cur:
            cur.execute(
                """
                SELECT 
                    employee_id, full_name, contact_no, personal_email, 
                    doj, dob, address, gender, graduation_year, 
                    work_experience_years, emergency_contact_name, 
                    emergency_contact_number, emergency_contact_relation,
                    created_at
                FROM employee_details 
                WHERE employee_id = %s
                """,
                (employee_id,)
            )
            
            result = cur.fetchone()
            
            if not result:
                raise HTTPException(
                    status_code=404,
                    detail=f"Employee with ID {employee_id} not found"
                )
            
            # Convert result to dictionary
            columns = [
                'employee_id', 'full_name', 'contact_no', 'personal_email',
                'doj', 'dob', 'address', 'gender', 'graduation_year',
                'work_experience_years', 'emergency_contact_name',
                'emergency_contact_number', 'emergency_contact_relation',
                'created_at'
            ]
            
            employee_data = dict(zip(columns, result))
            
            return {
                "status": "success",
                "data": employee_data
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving employee {employee_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

# Update employee details endpoint
@router.put("/employee/{employee_id}")
async def update_employee_details(
    employee_id: int,
    employee_data: EmployeeOnboardingRequest,
    session: Session = Depends(get_session)
):
    """
    Update existing employee details
    """
    try:
        if session is None:
            raise HTTPException(status_code=500, detail="Database session is not available")

        # Check if employee exists
        with session.connection().connection.cursor() as cur:
            cur.execute(
                "SELECT employee_id FROM employee_details WHERE employee_id = %s",
                (employee_id,)
            )
            
            if not cur.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail=f"Employee with ID {employee_id} not found"
                )
            
            # Update employee details
            cur.execute(
                """
                UPDATE employee_details SET
                    full_name = %s,
                    contact_no = %s,
                    personal_email = %s,
                    doj = %s,
                    dob = %s,
                    address = %s,
                    gender = %s,
                    graduation_year = %s,
                    work_experience_years = %s,
                    emergency_contact_name = %s,
                    emergency_contact_number = %s,
                    emergency_contact_relation = %s,
                    updated_at = NOW()
                WHERE employee_id = %s
                """,
                (
                    employee_data.full_name,
                    employee_data.contact_no,
                    employee_data.personal_email,
                    employee_data.doj,
                    employee_data.dob,
                    employee_data.address,
                    employee_data.gender,
                    employee_data.graduation_year,
                    employee_data.work_experience_years,
                    employee_data.emergency_contact_name,
                    employee_data.emergency_contact_number,
                    employee_data.emergency_contact_relation,
                    employee_id
                )
            )
            
        session.commit()
        logger.info(f"Successfully updated employee ID: {employee_id}")
        
        return {
            "status": "success",
            "message": "Employee details updated successfully",
            "employee_id": employee_id
        }

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Error updating employee {employee_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
