"""Pydantic models for the agent runtime."""

from .content_type import ContentType
from .grammar import GrammarPoint, GrammarCategory
from .kanji import KanjiItem, CompoundWord, KanjiGenerateRequest
from .vocabulary import VocabularyItem, VocabularyExample, VocabularyGenerateRequest, PartOfSpeech
from .listening import (
    ListeningItem,
    ListeningQuestion,
    ListeningType,
    Speaker,
    DialogueLine as ListeningDialogueLine,
    ListeningGenerateRequest,
)
from .reading import (
    ReadingPassage,
    ReadingQuestion,
    ReadingPassageType,
    ReadingGenre,
    KeyVocabulary,
    ReadingGenerateRequest,
)
from .progress import UserProgress, SM2Data, StudySession, SessionResult
from .quiz import (
    Quiz,
    QuizQuestion,
    QuestionType,
    QuizAnswer,
    QuizSubmission,
    GradedAnswer,
)
from .study import (
    StudyRecommendation,
    RecommendationRequest,
    SessionRequest,
    SessionCompleteRequest,
)
from .video import (
    VideoProject,
    VideoScript,
    VideoSubtitle,
    FuriganaAnnotation,
    CharacterStyle,
    VideoStyle,
    VideoStatus,
    VideoCreateRequest,
    ScriptGenerateRequest,
    TTSVoice,
    VideoStylesResponse,
)

__all__ = [
    "ContentType",
    "GrammarPoint",
    "GrammarCategory",
    "KanjiItem",
    "CompoundWord",
    "KanjiGenerateRequest",
    "VocabularyItem",
    "VocabularyExample",
    "VocabularyGenerateRequest",
    "PartOfSpeech",
    "ListeningItem",
    "ListeningQuestion",
    "ListeningType",
    "Speaker",
    "ListeningDialogueLine",
    "ListeningGenerateRequest",
    "ReadingPassage",
    "ReadingQuestion",
    "ReadingPassageType",
    "ReadingGenre",
    "KeyVocabulary",
    "ReadingGenerateRequest",
    "UserProgress",
    "SM2Data",
    "StudySession",
    "SessionResult",
    "Quiz",
    "QuizQuestion",
    "QuestionType",
    "QuizAnswer",
    "QuizSubmission",
    "GradedAnswer",
    "StudyRecommendation",
    "RecommendationRequest",
    "SessionRequest",
    "SessionCompleteRequest",
    "VideoProject",
    "VideoScript",
    "VideoSubtitle",
    "FuriganaAnnotation",
    "CharacterStyle",
    "VideoStyle",
    "VideoStatus",
    "VideoCreateRequest",
    "ScriptGenerateRequest",
    "TTSVoice",
    "VideoStylesResponse",
]
