"""
Shared in-memory state for the application.
In production, this would be replaced with database persistence.
"""

from nxflix_agents.models import UserProgress, GrammarPoint, GrammarCategory, ContentType
from nxflix_agents.services import GrammarService, SM2Service

# Shared user progress storage
# Structure: user_id -> f"{content_type}:{item_id}" -> UserProgress
user_progress: dict[str, dict[str, UserProgress]] = {}


def make_progress_key(content_type: ContentType, item_id: str) -> str:
    """Create a composite key for progress storage."""
    return f"{content_type.value}:{item_id}"


def parse_progress_key(key: str) -> tuple[ContentType, str]:
    """Parse a composite key back to content_type and item_id."""
    content_type_str, *rest = key.split(":")
    return ContentType(content_type_str), ":".join(rest)

# Singleton services shared across all routers
grammar_service = GrammarService()
sm2_service = SM2Service()

# Seed grammar data (subset of 200 N1 patterns)
SEED_GRAMMAR_DATA: list[dict] = [
    {
        "id": "n1-001",
        "pattern": "～あっての",
        "meaning": "only because of; owing to",
        "meaning_jp": "～があるからこそ",
        "example": "家族あっての幸せだ。",
        "example_translation": "Happiness exists only because of family.",
        "category": GrammarCategory.FORMAL,
        "related_patterns": ["n1-002"],
    },
    {
        "id": "n1-002",
        "pattern": "～いかんで/いかんによっては",
        "meaning": "depending on",
        "meaning_jp": "～次第で",
        "example": "結果いかんで、対応を決める。",
        "example_translation": "We will decide the response depending on the results.",
        "category": GrammarCategory.CONDITIONAL,
        "related_patterns": ["n1-001"],
    },
    {
        "id": "n1-003",
        "pattern": "～いかんにかかわらず",
        "meaning": "regardless of",
        "meaning_jp": "～に関係なく",
        "example": "理由いかんにかかわらず、遅刻は許されない。",
        "example_translation": "Regardless of the reason, being late is not permitted.",
        "category": GrammarCategory.FORMAL,
        "related_patterns": ["n1-002"],
    },
    {
        "id": "n1-004",
        "pattern": "～う/ようが～まいが",
        "meaning": "whether... or not",
        "meaning_jp": "～ても～なくても",
        "example": "雨が降ろうが降るまいが、出かける。",
        "example_translation": "Whether it rains or not, I'm going out.",
        "category": GrammarCategory.CONDITIONAL,
        "related_patterns": ["n1-005"],
    },
    {
        "id": "n1-005",
        "pattern": "～う/ようと(も)",
        "meaning": "even if; no matter how",
        "meaning_jp": "たとえ～ても",
        "example": "何があろうと、諦めない。",
        "example_translation": "No matter what happens, I won't give up.",
        "category": GrammarCategory.CONDITIONAL,
        "related_patterns": ["n1-004"],
    },
    {
        "id": "n1-006",
        "pattern": "～かぎりだ",
        "meaning": "extremely; to the utmost degree",
        "meaning_jp": "非常に～だ",
        "example": "嬉しいかぎりだ。",
        "example_translation": "I am extremely happy.",
        "category": GrammarCategory.EMPHASIS,
        "related_patterns": [],
    },
    {
        "id": "n1-007",
        "pattern": "～がてら",
        "meaning": "while; on the occasion of",
        "meaning_jp": "～のついでに",
        "example": "散歩がてら、買い物に行く。",
        "example_translation": "I'll go shopping while taking a walk.",
        "category": GrammarCategory.CONJUNCTIVE,
        "related_patterns": ["n1-008"],
    },
    {
        "id": "n1-008",
        "pattern": "～かたがた",
        "meaning": "at the same time; while also",
        "meaning_jp": "～を兼ねて",
        "example": "お礼かたがた、お伺いします。",
        "example_translation": "I will visit while also expressing my thanks.",
        "category": GrammarCategory.FORMAL,
        "related_patterns": ["n1-007"],
    },
    {
        "id": "n1-009",
        "pattern": "～かたわら",
        "meaning": "while; alongside",
        "meaning_jp": "～一方で",
        "example": "働くかたわら、学校に通っている。",
        "example_translation": "While working, I'm also attending school.",
        "category": GrammarCategory.CONJUNCTIVE,
        "related_patterns": [],
    },
    {
        "id": "n1-010",
        "pattern": "～が早いか",
        "meaning": "as soon as; the moment",
        "meaning_jp": "～とすぐに",
        "example": "ベルが鳴るが早いか、生徒たちは教室を飛び出した。",
        "example_translation": "The moment the bell rang, the students rushed out of the classroom.",
        "category": GrammarCategory.TEMPORAL,
        "related_patterns": ["n1-011", "n1-012"],
    },
]


def _initialize_grammar_data() -> None:
    """Initialize grammar service with seed data."""
    for data in SEED_GRAMMAR_DATA:
        grammar = GrammarPoint(**data)
        grammar_service.add_grammar_point(grammar)
    print(f"Loaded {len(SEED_GRAMMAR_DATA)} grammar patterns into memory.")


# Initialize on module load
_initialize_grammar_data()


def get_user_progress_list(user_id: str) -> list[UserProgress]:
    """Get user progress as a list for all items."""
    return list(user_progress.get(user_id, {}).values())


def get_user_progress_by_type(user_id: str, content_type: ContentType) -> list[UserProgress]:
    """Get user progress filtered by content type."""
    all_progress = user_progress.get(user_id, {})
    prefix = f"{content_type.value}:"
    return [p for key, p in all_progress.items() if key.startswith(prefix)]


def update_user_progress(
    user_id: str, item_id: str, content_type: ContentType, progress: UserProgress
) -> None:
    """Update user progress for a specific item."""
    if user_id not in user_progress:
        user_progress[user_id] = {}
    key = make_progress_key(content_type, item_id)
    user_progress[user_id][key] = progress


def get_user_progress(
    user_id: str, item_id: str, content_type: ContentType
) -> UserProgress | None:
    """Get single user progress item."""
    key = make_progress_key(content_type, item_id)
    return user_progress.get(user_id, {}).get(key)
