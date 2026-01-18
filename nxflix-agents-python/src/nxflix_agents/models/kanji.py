"""Kanji model for JLPT N1 study."""

from typing import Literal
from pydantic import BaseModel, Field


class CompoundWord(BaseModel):
    """A compound word containing a kanji character."""

    word: str
    reading: str
    meaning: str


class KanjiItem(BaseModel):
    """A JLPT N1 kanji item with readings, meanings, and related compounds."""

    id: str
    character: str = Field(..., min_length=1, max_length=1)
    stroke_count: int = Field(..., ge=1)
    onyomi: list[str] = []
    kunyomi: list[str] = []
    meanings: list[str]
    radicals: list[str] = []
    compound_words: list[CompoundWord] = []
    mnemonics: str | None = None
    level: str = "N1"
    content_type: Literal["kanji"] = "kanji"


class KanjiGenerateRequest(BaseModel):
    """Request to generate a set of kanji items."""

    characters: list[str] | None = None
    count: int = Field(default=10, ge=1, le=50)
    topic: str | None = None
    include_compounds: bool = True
