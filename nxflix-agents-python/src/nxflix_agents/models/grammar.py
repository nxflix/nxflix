"""Grammar point models."""

from enum import Enum
from pydantic import BaseModel


class GrammarCategory(str, Enum):
    """JLPT N1 grammar categories."""

    FORMAL = "formal"
    CLASSICAL = "classical"
    CONJUNCTIVE = "conjunctive"
    CONDITIONAL = "conditional"
    COMPARATIVE = "comparative"
    EMPHASIS = "emphasis"
    NEGATIVE = "negative"
    TEMPORAL = "temporal"
    CAUSATIVE = "causative"
    OTHER = "other"


class GrammarPoint(BaseModel):
    """A JLPT N1 grammar pattern."""

    id: str
    pattern: str
    meaning: str
    meaning_jp: str | None = None
    example: str
    example_translation: str
    category: GrammarCategory
    level: str = "N1"
    notes: str | None = None
    related_patterns: list[str] = []
