"""API routers for the agent runtime."""

from .study import router as study_router
from .quiz import router as quiz_router
from .progress import router as progress_router
from .health import router as health_router

__all__ = ["study_router", "quiz_router", "progress_router", "health_router"]
