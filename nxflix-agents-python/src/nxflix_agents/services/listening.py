"""Listening service for managing JLPT N1 listening items."""

from nxflix_agents.models import ListeningItem
from nxflix_agents.models.listening import ListeningType


class ListeningService:
    """Service for managing listening items in memory."""

    def __init__(self) -> None:
        self._listening_items: dict[str, ListeningItem] = {}
        self._by_type: dict[ListeningType, list[str]] = {}

    def add_listening_item(self, item: ListeningItem) -> None:
        """Add a listening item to the service."""
        self._listening_items[item.id] = item

        if item.listening_type not in self._by_type:
            self._by_type[item.listening_type] = []
        self._by_type[item.listening_type].append(item.id)

    def get_listening_item(self, item_id: str) -> ListeningItem | None:
        """Get a listening item by ID."""
        return self._listening_items.get(item_id)

    def get_all_listening_items(self) -> list[ListeningItem]:
        """Get all listening items."""
        return list(self._listening_items.values())

    def get_listening_by_type(self, listening_type: ListeningType) -> list[ListeningItem]:
        """Get listening items by type."""
        ids = self._by_type.get(listening_type, [])
        return [self._listening_items[id_] for id_ in ids if id_ in self._listening_items]

    def get_listening_items_by_ids(self, ids: list[str]) -> list[ListeningItem]:
        """Get multiple listening items by their IDs."""
        return [
            self._listening_items[id_] for id_ in ids if id_ in self._listening_items
        ]

    def get_listening_by_duration(
        self, min_seconds: float, max_seconds: float
    ) -> list[ListeningItem]:
        """Get listening items within a duration range."""
        return [
            item
            for item in self._listening_items.values()
            if min_seconds <= item.duration_seconds <= max_seconds
        ]

    def search_listening(self, query: str) -> list[ListeningItem]:
        """Search listening items by transcript, title, or context."""
        lower_query = query.lower()
        results: list[ListeningItem] = []

        for item in self._listening_items.values():
            if (
                lower_query in item.transcript.lower()
                or (item.title and lower_query in item.title.lower())
                or (item.situation_context and lower_query in item.situation_context.lower())
            ):
                results.append(item)

        return results

    @property
    def count(self) -> int:
        """Get the number of listening items."""
        return len(self._listening_items)

    @property
    def listening_types(self) -> list[ListeningType]:
        """Get all available listening types."""
        return list(self._by_type.keys())
