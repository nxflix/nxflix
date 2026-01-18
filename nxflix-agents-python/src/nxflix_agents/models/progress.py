"""User progress and study session models."""

from datetime import datetime
from pydantic import BaseModel, Field


class SM2Data(BaseModel):
    """SM-2 spaced repetition algorithm data."""

    ease_factor: float = Field(default=2.5, ge=1.3)
    interval: int = Field(default=0, ge=0)  # Days until next review
    repetitions: int = Field(default=0, ge=0)
    next_review_date: datetime | None = None
    last_review_date: datetime | None = None


class UserProgress(BaseModel):
    """User's progress on a specific grammar point."""

    user_id: str
    grammar_id: str
    sm2_data: SM2Data = Field(default_factory=SM2Data)
    times_studied: int = 0
    times_correct: int = 0
    last_score: float | None = None
    mastery_level: int = Field(default=0, ge=0, le=5)  # 0-5 mastery scale
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def accuracy(self) -> float:
        """Calculate accuracy percentage."""
        if self.times_studied == 0:
            return 0.0
        return (self.times_correct / self.times_studied) * 100


class SessionResult(BaseModel):
    """Result of a single grammar point within a study session."""

    grammar_id: str
    questions_asked: int
    correct_answers: int
    score: float  # 0-5 quality score for SM-2


class StudySession(BaseModel):
    """A study session tracking user's practice."""

    id: str
    user_id: str
    grammar_ids: list[str]
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None
    results: list[SessionResult] = []
    total_questions: int = 0
    total_correct: int = 0

    @property
    def is_complete(self) -> bool:
        """Check if session is complete."""
        return self.completed_at is not None

    @property
    def accuracy(self) -> float:
        """Calculate session accuracy."""
        if self.total_questions == 0:
            return 0.0
        return (self.total_correct / self.total_questions) * 100
