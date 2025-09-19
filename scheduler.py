from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import text
from datetime import datetime
from database import get_session  

def carry_forward_job():
    with get_session() as session:
        now = datetime.utcnow()
        year = now.year
        month = now.month
        session.exec(
            text(
                "SELECT carry_forward_pending_expenses(:y, :m)"
            ),
            {"y": year, "m": month}
        )
        session.commit()
        print(f"[Carry Forward] Job executed for {year}-{month}")

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run at 00:05 on the 1st day of every month
    scheduler.add_job(carry_forward_job, 'cron', day=1, hour=0, minute=5)
    scheduler.start()
    print("[Scheduler] Carry forward scheduler started")

