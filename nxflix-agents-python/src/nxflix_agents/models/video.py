"""Video model for JLPT N1 educational content creation."""

from enum import Enum
from typing import Literal
from pydantic import BaseModel, Field


class CharacterStyle(str, Enum):
    """Character/Avatar style selection for videos."""

    ANIME_FEMALE = "anime_female"
    ANIME_MALE = "anime_male"
    REALISTIC_FEMALE = "realistic_female"
    REALISTIC_MALE = "realistic_male"
    CHIBI = "chibi"
    MASCOT = "mascot"
    NONE = "none"  # Subtitles only, no character


class VideoStyle(str, Enum):
    """Video visual style/background."""

    CLASSROOM = "classroom"  # Traditional learning setting
    CAFE = "cafe"  # Casual conversation setting
    NATURE = "nature"  # Outdoor/scenic backgrounds
    ABSTRACT = "abstract"  # Minimalist/gradient backgrounds
    MANGA = "manga"  # Comic panel style


class VideoStatus(str, Enum):
    """Video project status."""

    DRAFT = "draft"
    GENERATING = "generating"
    READY = "ready"
    FAILED = "failed"


class FuriganaAnnotation(BaseModel):
    """Furigana reading annotation for a word."""

    word: str  # Original word (kanji)
    reading: str  # Hiragana reading
    start_index: int  # Position in text


class VideoSubtitle(BaseModel):
    """Subtitle with furigana support."""

    id: str
    start_time: float  # Seconds from start
    end_time: float
    text: str  # Japanese text
    reading: str | None = None  # Full reading for TTS
    furigana: list[FuriganaAnnotation] = []
    translation: str | None = None  # English translation


class VideoScript(BaseModel):
    """Video script with timing and metadata."""

    id: str
    title: str
    description: str | None = None
    subtitles: list[VideoSubtitle]
    total_duration_seconds: float
    target_vocabulary: list[str] = []
    grammar_points: list[str] = []


class VideoProject(BaseModel):
    """Video project with all assets."""

    id: str
    user_id: str
    prompt: str  # Original user prompt
    script: VideoScript
    character_style: CharacterStyle
    video_style: VideoStyle
    voice: str  # TTS voice ID
    status: VideoStatus
    audio_url: str | None = None
    audio_base64: str | None = None
    video_url: str | None = None
    thumbnail_url: str | None = None
    created_at: str
    updated_at: str
    error_message: str | None = None
    progress: int = Field(default=0, ge=0, le=100)


class VideoCreateRequest(BaseModel):
    """Request to create a new video project."""

    prompt: str = Field(..., min_length=1, max_length=500)
    user_id: str = Field(..., min_length=1)
    character_style: CharacterStyle = CharacterStyle.ANIME_FEMALE
    video_style: VideoStyle = VideoStyle.CLASSROOM
    voice: str | None = None
    max_duration_seconds: int = Field(default=60, ge=15, le=60)


class ScriptGenerateRequest(BaseModel):
    """Request to generate just a script."""

    prompt: str = Field(..., min_length=1, max_length=500)
    max_duration_seconds: int = Field(default=60, ge=15, le=60)


class TTSVoice(BaseModel):
    """Available TTS voice info."""

    id: str
    name: str
    gender: str
    description: str
    provider: str


class StyleOption(BaseModel):
    """A style option for characters or backgrounds."""

    id: str
    name: str
    description: str


class VideoStylesResponse(BaseModel):
    """Available style options response."""

    characters: list[StyleOption]
    backgrounds: list[StyleOption]
