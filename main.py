from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import create_tables_database
from routes import user_routes, document_routes, attendance_routes, expenses_routes
from middleware.cors import add_cors_middleware
from fastapi.staticfiles import StaticFiles

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables_database()
    yield

app = FastAPI(lifespan=lifespan)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

add_cors_middleware(app)

app.include_router(user_routes.router)
app.include_router(document_routes.router) 
app.include_router(attendance_routes.router)
app.include_router(expenses_routes.router)
