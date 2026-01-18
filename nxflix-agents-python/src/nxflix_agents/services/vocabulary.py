"""Vocabulary service for managing JLPT N1 vocabulary items."""

from nxflix_agents.models import VocabularyItem
from nxflix_agents.models.vocabulary import PartOfSpeech


class VocabularyService:
    """Service for managing vocabulary items in memory."""

    def __init__(self) -> None:
        self._vocabulary_items: dict[str, VocabularyItem] = {}
        self._by_word: dict[str, str] = {}
        self._by_part_of_speech: dict[PartOfSpeech, list[str]] = {}

    def add_vocabulary_item(self, vocab: VocabularyItem) -> None:
        """Add a vocabulary item to the service."""
        self._vocabulary_items[vocab.id] = vocab
        self._by_word[vocab.word] = vocab.id

        if vocab.part_of_speech not in self._by_part_of_speech:
            self._by_part_of_speech[vocab.part_of_speech] = []
        self._by_part_of_speech[vocab.part_of_speech].append(vocab.id)

    def get_vocabulary_item(self, vocab_id: str) -> VocabularyItem | None:
        """Get a vocabulary item by ID."""
        return self._vocabulary_items.get(vocab_id)

    def get_vocabulary_by_word(self, word: str) -> VocabularyItem | None:
        """Get a vocabulary item by its word."""
        vocab_id = self._by_word.get(word)
        return self._vocabulary_items.get(vocab_id) if vocab_id else None

    def get_all_vocabulary_items(self) -> list[VocabularyItem]:
        """Get all vocabulary items."""
        return list(self._vocabulary_items.values())

    def get_vocabulary_by_part_of_speech(
        self, part_of_speech: PartOfSpeech
    ) -> list[VocabularyItem]:
        """Get vocabulary items by part of speech."""
        ids = self._by_part_of_speech.get(part_of_speech, [])
        return [self._vocabulary_items[id_] for id_ in ids if id_ in self._vocabulary_items]

    def get_vocabulary_items_by_ids(self, ids: list[str]) -> list[VocabularyItem]:
        """Get multiple vocabulary items by their IDs."""
        return [
            self._vocabulary_items[id_] for id_ in ids if id_ in self._vocabulary_items
        ]

    def search_vocabulary(self, query: str) -> list[VocabularyItem]:
        """Search vocabulary by word, reading, or meanings."""
        lower_query = query.lower()
        results: list[VocabularyItem] = []

        for vocab in self._vocabulary_items.values():
            if (
                query in vocab.word
                or query in vocab.reading
                or any(m.lower().find(lower_query) != -1 for m in vocab.meanings)
            ):
                results.append(vocab)

        return results

    @property
    def count(self) -> int:
        """Get the number of vocabulary items."""
        return len(self._vocabulary_items)

    @property
    def parts_of_speech(self) -> list[PartOfSpeech]:
        """Get all available parts of speech."""
        return list(self._by_part_of_speech.keys())
