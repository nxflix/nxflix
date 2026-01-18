"""Study recommendation and session request models."""

from pydantic import BaseModel, Field


class StudyRecommendation(BaseModel):
    """A personalized study recommendation."""

    grammar_ids: list[str]
    reason: str
    priority: int = Field(default=1, ge=1, le=5)
    estimated_time_minutes: int = 15
    focus_areas: list[str] = []
    suggested_question_types: list[str] = []


class RecommendationRequest(BaseModel):
    """Request for study recommendations."""

    user_id: str
    available_grammar_ids: list[str] = []
    max_items: int = Field(default=5, ge=1, le=20)
    focus_weak_areas: bool = True
    include_new: bool = True
    time_available_minutes: int | None = None


class SessionRequest(BaseModel):
    """Request to start a study session."""

    user_id: str
    grammar_ids: list[str]
    question_count: int = Field(default=10, ge=1, le=50)
    question_types: list[str] = []
    difficulty: int | None = Field(default=None, ge=1, le=5)


class SessionCompleteRequest(BaseModel):
    """Request to complete a study session."""

    session_id: str
    results: list[dict]  # List of SessionResult-like dicts
