"""Quiz and question models."""

from enum import Enum
from pydantic import BaseModel, Field

from .content_type import ContentType


class QuestionType(str, Enum):
    """Types of quiz questions for all JLPT N1 content."""

    # General types
    MULTIPLE_CHOICE = "multiple_choice"
    FILL_IN_BLANK = "fill_in_blank"
    TRANSLATION = "translation"
    SENTENCE_CONSTRUCTION = "sentence_construction"
    ERROR_CORRECTION = "error_correction"

    # Kanji-specific types
    KANJI_READING = "kanji_reading"  # Read the kanji (select correct reading)
    KANJI_MEANING = "kanji_meaning"  # Select the meaning of kanji
    KANJI_COMPOUND = "kanji_compound"  # Complete compound word with kanji
    KANJI_WRITE = "kanji_write"  # Write the kanji from reading

    # Vocabulary-specific types
    VOCAB_MEANING = "vocab_meaning"  # Select meaning from word
    VOCAB_READING = "vocab_reading"  # Select reading from word
    VOCAB_USAGE = "vocab_usage"  # Select correct usage in context
    VOCAB_SYNONYM = "vocab_synonym"  # Select synonymous word

    # Listening-specific types
    LISTENING_COMPREHENSION = "listening_comprehension"  # Answer from audio
    LISTENING_TASK = "listening_task"  # Complete task from audio
    LISTENING_DETAIL = "listening_detail"  # Answer detail question

    # Reading-specific types
    READING_COMPREHENSION = "reading_comprehension"  # Standard MC from passage
    READING_INFERENCE = "reading_inference"  # Infer meaning/intent
    READING_VOCABULARY = "reading_vocabulary"  # Vocabulary question in context


class QuizQuestion(BaseModel):
    """A single quiz question."""

    id: str
    item_id: str
    content_type: ContentType = ContentType.GRAMMAR
    question_type: QuestionType
    question_text: str
    question_text_jp: str | None = None
    options: list[str] | None = None  # For multiple choice
    correct_answer: str
    correct_option_index: int | None = Field(default=None, ge=0, le=3)
    explanation: str
    difficulty: int = Field(default=3, ge=1, le=5)  # 1=easy, 5=hard
    hints: list[str] = []
    # For listening questions
    audio_url: str | None = None
    # For reading questions
    passage_id: str | None = None


class Quiz(BaseModel):
    """A complete quiz with multiple questions."""

    id: str
    user_id: str
    item_ids: list[str]
    content_types: list[ContentType] = []
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
