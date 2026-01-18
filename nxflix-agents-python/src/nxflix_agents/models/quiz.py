"""Quiz and question models."""

from enum import Enum
from pydantic import BaseModel, Field


class QuestionType(str, Enum):
    """Types of quiz questions."""

    MULTIPLE_CHOICE = "multiple_choice"
    FILL_IN_BLANK = "fill_in_blank"
    TRANSLATION = "translation"
    SENTENCE_CONSTRUCTION = "sentence_construction"
    ERROR_CORRECTION = "error_correction"


class QuizQuestion(BaseModel):
    """A single quiz question."""

    id: str
    grammar_id: str
    question_type: QuestionType
    question_text: str
    question_text_jp: str | None = None
    options: list[str] | None = None  # For multiple choice
    correct_answer: str
    explanation: str
    difficulty: int = Field(default=3, ge=1, le=5)  # 1=easy, 5=hard
    hints: list[str] = []


class Quiz(BaseModel):
    """A complete quiz with multiple questions."""

    id: str
    user_id: str
    grammar_ids: list[str]
    questions: list[QuizQuestion]
    difficulty: int = Field(default=3, ge=1, le=5)
    time_limit_seconds: int | None = None
    created_at: str | None = None


class QuizAnswer(BaseModel):
    """User's answer to a quiz question."""

    question_id: str
    user_answer: str
    time_taken_seconds: float | None = None


class GradedAnswer(BaseModel):
    """A graded answer with feedback."""

    question_id: str
    user_answer: str
    correct_answer: str
    is_correct: bool
    score: float = Field(ge=0.0, le=1.0)  # 0-1 partial credit
    feedback: str
    grammar_explanation: str | None = None


class QuizSubmission(BaseModel):
    """Complete quiz submission with all answers."""

    quiz_id: str
    answers: list[QuizAnswer]
    total_time_seconds: float | None = None
