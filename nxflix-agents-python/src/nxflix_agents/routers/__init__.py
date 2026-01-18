"""API routers for the agent runtime."""

from .study import router as study_router
from .quiz import router as quiz_router
from .progress import router as progress_router
from .health import router as health_router
from .kanji import router as kanji_router
from .vocabulary import router as vocabulary_router
from .listening import router as listening_router
from .reading import router as reading_router
from .tts import router as tts_router

__all__ = [
    "study_router",
    "quiz_router",
    "progress_router",
    "health_router",
    "kanji_router",
    "vocabulary_router",
    "listening_router",
    "reading_router",
    "tts_router",
]
