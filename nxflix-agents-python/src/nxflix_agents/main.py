"""FastAPI application entry point."""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from nxflix_agents.config import get_settings
from nxflix_agents.tracing import init_tracing
from nxflix_agents.routers import study_router, quiz_router, progress_router, health_router

# Initialize tracing
init_tracing()

# Create FastAPI app
app = FastAPI(
    title="NXFlix JLPT N1 Agents",
    description="AI-powered agents for JLPT N1 grammar study",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router)
app.include_router(study_router)
app.include_router(quiz_router)
app.include_router(progress_router)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    settings = get_settings()
    print(f"Starting NXFlix Agents (Python)")
    print(f"  Provider: {settings.default_provider}")
    print(f"  Model: {settings.default_model}")
    print(f"  Opik: {'enabled' if settings.opik_enabled else 'disabled'}")


def main():
    """Run the application."""
    settings = get_settings()
    uvicorn.run(
        "nxflix_agents.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )


if __name__ == "__main__":
    main()
