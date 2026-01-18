"""Grammar service for managing JLPT N1 grammar points."""

from nxflix_agents.models import GrammarPoint, GrammarCategory


class GrammarService:
    """Service for managing grammar points."""

    def __init__(self):
        self._grammar_points: dict[str, GrammarPoint] = {}
        self._by_category: dict[GrammarCategory, list[str]] = {}

    def add_grammar_point(self, grammar: GrammarPoint) -> None:
        """Add a grammar point to the service."""
        self._grammar_points[grammar.id] = grammar

        if grammar.category not in self._by_category:
            self._by_category[grammar.category] = []
        self._by_category[grammar.category].append(grammar.id)

    def get_grammar_point(self, grammar_id: str) -> GrammarPoint | None:
        """Get a grammar point by ID."""
        return self._grammar_points.get(grammar_id)

    def get_all_grammar_points(self) -> list[GrammarPoint]:
        """Get all grammar points."""
        return list(self._grammar_points.values())

    def get_grammar_by_category(self, category: GrammarCategory) -> list[GrammarPoint]:
        """Get grammar points by category."""
        ids = self._by_category.get(category, [])
        return [self._grammar_points[id] for id in ids if id in self._grammar_points]

    def get_grammar_points_by_ids(self, ids: list[str]) -> list[GrammarPoint]:
        """Get multiple grammar points by their IDs."""
        return [
            self._grammar_points[id]
            for id in ids
            if id in self._grammar_points
        ]

    def search_grammar(self, query: str) -> list[GrammarPoint]:
        """Search grammar points by pattern or meaning."""
        query = query.lower()
        results = []

        for grammar in self._grammar_points.values():
            if (
                query in grammar.pattern.lower()
                or query in grammar.meaning.lower()
                or (grammar.meaning_jp and query in grammar.meaning_jp)
            ):
                results.append(grammar)

        return results

    def get_related_grammar(self, grammar_id: str) -> list[GrammarPoint]:
        """Get grammar points related to the given one."""
        grammar = self.get_grammar_point(grammar_id)
        if not grammar:
            return []

        related = []
        for related_id in grammar.related_patterns:
            related_grammar = self.get_grammar_point(related_id)
            if related_grammar:
                related.append(related_grammar)

        return related

    @property
    def count(self) -> int:
        """Get the total number of grammar points."""
        return len(self._grammar_points)

    @property
    def categories(self) -> list[GrammarCategory]:
        """Get all categories with grammar points."""
        return list(self._by_category.keys())
