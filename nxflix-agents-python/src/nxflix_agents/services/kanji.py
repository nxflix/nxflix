"""Kanji service for managing JLPT N1 kanji items."""

from nxflix_agents.models import KanjiItem


class KanjiService:
    """Service for managing kanji items in memory."""

    def __init__(self) -> None:
        self._kanji_items: dict[str, KanjiItem] = {}
        self._by_character: dict[str, str] = {}
        self._by_stroke_count: dict[int, list[str]] = {}

    def add_kanji_item(self, kanji: KanjiItem) -> None:
        """Add a kanji item to the service."""
        self._kanji_items[kanji.id] = kanji
        self._by_character[kanji.character] = kanji.id

        if kanji.stroke_count not in self._by_stroke_count:
            self._by_stroke_count[kanji.stroke_count] = []
        self._by_stroke_count[kanji.stroke_count].append(kanji.id)

    def get_kanji_item(self, kanji_id: str) -> KanjiItem | None:
        """Get a kanji item by ID."""
        return self._kanji_items.get(kanji_id)

    def get_kanji_by_character(self, character: str) -> KanjiItem | None:
        """Get a kanji item by its character."""
        kanji_id = self._by_character.get(character)
        return self._kanji_items.get(kanji_id) if kanji_id else None

    def get_all_kanji_items(self) -> list[KanjiItem]:
        """Get all kanji items."""
        return list(self._kanji_items.values())

    def get_kanji_by_stroke_count(self, stroke_count: int) -> list[KanjiItem]:
        """Get kanji items by stroke count."""
        ids = self._by_stroke_count.get(stroke_count, [])
        return [self._kanji_items[id_] for id_ in ids if id_ in self._kanji_items]

    def get_kanji_items_by_ids(self, ids: list[str]) -> list[KanjiItem]:
        """Get multiple kanji items by their IDs."""
        return [
            self._kanji_items[id_] for id_ in ids if id_ in self._kanji_items
        ]

    def search_kanji(self, query: str) -> list[KanjiItem]:
        """Search kanji by character, meaning, or readings."""
        lower_query = query.lower()
        results: list[KanjiItem] = []

        for kanji in self._kanji_items.values():
            if (
                query in kanji.character
                or any(m.lower().find(lower_query) != -1 for m in kanji.meanings)
                or any(query in r for r in kanji.onyomi)
                or any(query in r for r in kanji.kunyomi)
            ):
                results.append(kanji)

        return results

    @property
    def count(self) -> int:
        """Get the number of kanji items."""
        return len(self._kanji_items)

    @property
    def stroke_counts(self) -> list[int]:
        """Get all available stroke counts."""
        return sorted(self._by_stroke_count.keys())
