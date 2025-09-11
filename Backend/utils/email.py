# app/utils/email.py
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
import os
from dotenv import load_dotenv

load_dotenv()

# Email configuration (update with your SMTP settings)
mail_conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "your-email@example.com"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "your-password"),
    MAIL_FROM=os.getenv("MAIL_FROM", "your-email@example.com"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",  # Update as needed
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False
)

async def send_login_email(email: EmailStr, temp_password: str):
    try:
        reset_url = "http://127.0.0.1:8000/reset-password"  # Update for your frontend
        body = f"""
        Your login credentials are:
        Login ID (Email): {email}
        Temporary Password: {temp_password}

        Change your password here: {reset_url}
        Please log in and change your password.
        """
        message = MessageSchema(
            subject="Your login creds",
            recipients=[email],
            body=body,
            subtype="plain"
        )
        fm = FastMail(mail_conf)
        await fm.send_message(message)
        print(f"✅ Login credentials email sent to {email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send login credentials email: {e}")
        return False