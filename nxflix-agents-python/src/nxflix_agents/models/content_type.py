"""Content type enum for JLPT N1 study materials."""

from enum import Enum


class ContentType(str, Enum):
    """Types of JLPT N1 study content."""

    GRAMMAR = "grammar"
    VOCABULARY = "vocabulary"
    KANJI = "kanji"
    READING = "reading"
    LISTENING = "listening"

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """Check if a string is a valid content type."""
        try:
            cls(value)
            return True
        except ValueError:
            return False
