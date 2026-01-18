"""Reading service for managing JLPT N1 reading passages."""

from nxflix_agents.models import ReadingPassage
from nxflix_agents.models.reading import ReadingPassageType


class ReadingService:
    """Service for managing reading passages in memory."""

    def __init__(self) -> None:
        self._reading_passages: dict[str, ReadingPassage] = {}
        self._by_type: dict[ReadingPassageType, list[str]] = {}
        self._by_topic: dict[str, list[str]] = {}

    def add_reading_passage(self, passage: ReadingPassage) -> None:
        """Add a reading passage to the service."""
        self._reading_passages[passage.id] = passage

        if passage.passage_type not in self._by_type:
            self._by_type[passage.passage_type] = []
        self._by_type[passage.passage_type].append(passage.id)

        if passage.topic:
            if passage.topic not in self._by_topic:
                self._by_topic[passage.topic] = []
            self._by_topic[passage.topic].append(passage.id)

    def get_reading_passage(self, passage_id: str) -> ReadingPassage | None:
        """Get a reading passage by ID."""
        return self._reading_passages.get(passage_id)

    def get_all_reading_passages(self) -> list[ReadingPassage]:
        """Get all reading passages."""
        return list(self._reading_passages.values())

    def get_reading_by_type(
        self, passage_type: ReadingPassageType
    ) -> list[ReadingPassage]:
        """Get reading passages by type."""
        ids = self._by_type.get(passage_type, [])
        return [self._reading_passages[id_] for id_ in ids if id_ in self._reading_passages]

    def get_reading_by_topic(self, topic: str) -> list[ReadingPassage]:
        """Get reading passages by topic."""
        ids = self._by_topic.get(topic, [])
        return [self._reading_passages[id_] for id_ in ids if id_ in self._reading_passages]

    def get_reading_passages_by_ids(self, ids: list[str]) -> list[ReadingPassage]:
        """Get multiple reading passages by their IDs."""
        return [
            self._reading_passages[id_] for id_ in ids if id_ in self._reading_passages
        ]

    def get_reading_by_length(
        self, min_chars: int, max_chars: int
    ) -> list[ReadingPassage]:
        """Get reading passages within a character count range."""
        return [
            passage
            for passage in self._reading_passages.values()
            if min_chars <= passage.character_count <= max_chars
        ]

    def search_reading(self, query: str) -> list[ReadingPassage]:
        """Search reading passages by content, title, or topic."""
        lower_query = query.lower()
        results: list[ReadingPassage] = []

        for passage in self._reading_passages.values():
            if (
                lower_query in passage.content.lower()
                or (passage.title and lower_query in passage.title.lower())
                or (passage.topic and lower_query in passage.topic.lower())
            ):
                results.append(passage)

        return results

    @property
    def count(self) -> int:
        """Get the number of reading passages."""
        return len(self._reading_passages)

    @property
    def passage_types(self) -> list[ReadingPassageType]:
        """Get all available passage types."""
        return list(self._by_type.keys())

    @property
    def topics(self) -> list[str]:
        """Get all available topics."""
        return list(self._by_topic.keys())
