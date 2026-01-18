"""Listening model for JLPT N1 study."""

from enum import Enum
from typing import Literal
from pydantic import BaseModel, Field


class ListeningType(str, Enum):
    """Type of listening exercise matching JLPT N1 format."""

    TASK_BASED = "task_based"  # 課題理解 - Task-based comprehension
    POINT_COMPREHENSION = "point_comprehension"  # ポイント理解 - Key point comprehension
    QUICK_RESPONSE = "quick_response"  # 即時応答 - Quick response
    GENERAL_COMPREHENSION = "general_comprehension"  # 概要理解 - General comprehension
    INTEGRATED = "integrated"  # 統合理解 - Integrated comprehension


class ListeningQuestion(BaseModel):
    """A question within a listening exercise."""

    id: str
    question_text: str
    question_text_jp: str | None = None
    options: list[str]
    correct_option: int = Field(..., ge=0, le=3)
    explanation: str


class Speaker(BaseModel):
    """A speaker in a dialogue."""

    id: str
    name: str
    gender: Literal["male", "female", "neutral"] = "neutral"
    voice: str | None = None


class DialogueLine(BaseModel):
    """A line of dialogue in a listening exercise."""

    speaker_id: str
    text: str
    start_time: float | None = None
    end_time: float | None = None


class ListeningItem(BaseModel):
    """A JLPT N1 listening item with audio, transcript, and questions."""

    id: str
    listening_type: ListeningType
    title: str | None = None
    description: str | None = None
    audio_url: str | None = None
    audio_base64: str | None = None
    transcript: str
    dialogue: list[DialogueLine] = []
    speakers: list[Speaker] = []
    duration_seconds: float
    questions: list[ListeningQuestion]
    situation_context: str | None = None
    level: str = "N1"
    content_type: Literal["listening"] = "listening"


class ListeningGenerateRequest(BaseModel):
    """Request to generate a listening exercise."""

    listening_type: ListeningType = ListeningType.TASK_BASED
    topic: str | None = None
    duration_seconds: int = Field(default=60, ge=30, le=300)
    question_count: int = Field(default=2, ge=1, le=5)
    speaker_count: int = Field(default=2, ge=1, le=3)
    generate_audio: bool = True
