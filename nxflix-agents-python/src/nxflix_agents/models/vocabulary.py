"""Vocabulary model for JLPT N1 study."""

from enum import Enum
from typing import Literal
from pydantic import BaseModel, Field


class PartOfSpeech(str, Enum):
    """Part of speech for vocabulary items."""

    NOUN = "noun"
    VERB = "verb"
    ADJECTIVE_I = "adjective_i"
    ADJECTIVE_NA = "adjective_na"
    ADVERB = "adverb"
    PARTICLE = "particle"
    CONJUNCTION = "conjunction"
    EXPRESSION = "expression"


class VocabularyExample(BaseModel):
    """An example sentence for a vocabulary item."""

    sentence: str
    translation: str


class VocabularyItem(BaseModel):
    """A JLPT N1 vocabulary item with readings, meanings, and examples."""

    id: str
    word: str
    reading: str
    meanings: list[str]
    part_of_speech: PartOfSpeech
    examples: list[VocabularyExample] = []
    synonyms: list[str] = []
    antonyms: list[str] = []
    level: str = "N1"
    content_type: Literal["vocabulary"] = "vocabulary"
    audio_url: str | None = None
    notes: str | None = None


class VocabularyGenerateRequest(BaseModel):
    """Request to generate a set of vocabulary items."""

    topic: str | None = None
    part_of_speech: PartOfSpeech | None = None
    count: int = Field(default=10, ge=1, le=50)
    include_examples: bool = True
    include_audio: bool = False
