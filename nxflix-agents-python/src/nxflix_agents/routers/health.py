"""Health check API route."""

from fastapi import APIRouter
from pydantic import BaseModel

from nxflix_agents.config import get_settings

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    version: str
    provider: str
    model: str
    opik_enabled: bool


@router.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    settings = get_settings()

    return HealthResponse(
        status="healthy",
        version="0.1.0",
        provider=settings.default_provider,
        model=settings.default_model,
        opik_enabled=settings.opik_enabled,
    )
