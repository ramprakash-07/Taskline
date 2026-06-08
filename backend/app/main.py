"""
TaskLine API — FastAPI application entry point.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import database
from app.routes.queue import router as queue_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: connect/disconnect database."""
    await database.connect()
    yield
    await database.disconnect()


app = FastAPI(
    title="TaskLine API",
    description="Priority queue task manager backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(queue_router)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API info."""
    return {
        "app": "TaskLine API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for Render."""
    return {"status": "healthy"}
