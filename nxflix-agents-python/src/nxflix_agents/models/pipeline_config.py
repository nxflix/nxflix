"""
Pipeline configuration models for video generation.
Allows users to select which AI provider to use for each step.
"""

from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class ScriptProvider(str, Enum):
    """Script generation provider options."""
    CLAUDE = "claude"
    OPENAI = "openai"
    GEMINI = "gemini"


class TTSProviderType(str, Enum):
    """Text-to-speech provider options."""
    ELEVENLABS = "elevenlabs"
    OPENAI = "openai"
    GOOGLE = "google"
    AZURE = "azure"


class ImageProvider(str, Enum):
    """Image generation provider options."""
    DALLE = "dalle"
    GEMINI = "gemini"
    STABLE_DIFFUSION = "stable_diffusion"
    STATIC = "static"


class VideoProvider(str, Enum):
    """Video composition provider options."""
    FFMPEG = "ffmpeg"
    GEMINI_VEO = "gemini_veo"
    RUNWAY = "runway"
    PIKA = "pika"


class VideoResolution(str, Enum):
    """Video resolution options."""
    HD_720P = "720p"
    FULL_HD_1080P = "1080p"
    UHD_4K = "4k"


class VideoFormat(str, Enum):
    """Video output format options."""
    MP4 = "mp4"
    WEBM = "webm"


class TTSSettings(BaseModel):
    """TTS provider-specific settings."""
    voice: Optional[str] = None
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    pitch: float = Field(default=0, ge=-20, le=20)


class ImageSettings(BaseModel):
    """Image provider-specific settings."""
    style: Optional[str] = None
    generate_background: bool = False
    generate_character: bool = False


class VideoSettings(BaseModel):
    """Video composition settings."""
    resolution: VideoResolution = VideoResolution.FULL_HD_1080P
    fps: int = Field(default=30, ge=15, le=60)
    format: VideoFormat = VideoFormat.MP4
    codec: str = "h264"


class PipelineConfig(BaseModel):
    """Complete pipeline configuration for video generation."""
    script_provider: ScriptProvider = ScriptProvider.CLAUDE
    tts_provider: TTSProviderType = TTSProviderType.OPENAI
    image_provider: ImageProvider = ImageProvider.STATIC
    video_provider: VideoProvider = VideoProvider.FFMPEG
    tts_settings: TTSSettings = Field(default_factory=TTSSettings)
    image_settings: ImageSettings = Field(default_factory=ImageSettings)
    video_settings: VideoSettings = Field(default_factory=VideoSettings)


class ProviderStatus(BaseModel):
    """Provider availability status."""
    id: str
    name: str
    available: bool
    reason: Optional[str] = None


class VoiceOption(BaseModel):
    """Voice option for TTS."""
    id: str
    name: str
    gender: str
    language: str = "ja-JP"
    provider: TTSProviderType
    description: Optional[str] = None


class TTSProviderStatus(ProviderStatus):
    """TTS provider status with available voices."""
    voices: Optional[List[VoiceOption]] = None


class ProvidersResponse(BaseModel):
    """Response containing all available providers and their status."""
    script: List[ProviderStatus]
    tts: List[TTSProviderStatus]
    image: List[ProviderStatus]
    video: List[ProviderStatus]


# Default configuration
DEFAULT_PIPELINE_CONFIG = PipelineConfig(
    script_provider=ScriptProvider.CLAUDE,
    tts_provider=TTSProviderType.OPENAI,
    image_provider=ImageProvider.STATIC,
    video_provider=VideoProvider.FFMPEG,
)

# Video provider fallback order
VIDEO_PROVIDER_FALLBACK_ORDER = [
    VideoProvider.GEMINI_VEO,
    VideoProvider.RUNWAY,
    VideoProvider.PIKA,
    VideoProvider.FFMPEG,
]
