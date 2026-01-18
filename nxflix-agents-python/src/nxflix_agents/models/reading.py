"""Reading model for JLPT N1 study."""

from enum import Enum
from typing import Literal
from pydantic import BaseModel, Field


class ReadingPassageType(str, Enum):
    """Type of reading passage matching JLPT N1 format."""

    SHORT = "short"  # 短文 - Short passages (~200-400 characters)
    MEDIUM = "medium"  # 中文 - Medium passages (~400-800 characters)
    LONG = "long"  # 長文 - Long passages (~800-1200 characters)
    COMPARISON = "comparison"  # 比較読解 - Comparison reading
    INFORMATION = "information"  # 情報検索 - Information retrieval


class ReadingGenre(str, Enum):
    """Genre of reading passage."""

    ESSAY = "essay"
    ARTICLE = "article"
    LETTER = "letter"
    ADVERTISEMENT = "advertisement"
    STORY = "story"
    OPINION = "opinion"


class ReadingQuestion(BaseModel):
    """A question within a reading passage."""

    id: str
    question_text: str
    question_text_jp: str | None = None
    options: list[str]
    correct_option: int = Field(..., ge=0, le=3)
    explanation: str
    target_line: int | None = None  # Line number the question refers to


class KeyVocabulary(BaseModel):
    """Key vocabulary item in a reading passage."""

    word: str
    reading: str
    meaning: str


class ReadingPassage(BaseModel):
    """A JLPT N1 reading passage with comprehension questions."""

    id: str
    passage_type: ReadingPassageType
    title: str | None = None
    author: str | None = None
    source: str | None = None
    content: str
    content_html: str | None = None  # For formatted display
    word_count: int
    character_count: int
    questions: list[ReadingQuestion]
    key_vocabulary: list[KeyVocabulary] = []
    key_grammar: list[str] = []
    topic: str | None = None
    level: str = "N1"
    content_type: Literal["reading"] = "reading"
    estimated_minutes: int = 5


class ReadingGenerateRequest(BaseModel):
    """Request to generate a reading passage."""

    passage_type: ReadingPassageType = ReadingPassageType.SHORT
    topic: str | None = None
    genre: ReadingGenre | None = None
    question_count: int = Field(default=3, ge=1, le=6)
    include_vocabulary: bool = True
    include_grammar: bool = True
