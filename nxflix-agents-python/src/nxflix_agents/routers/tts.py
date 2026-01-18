"""TTS API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from nxflix_agents.services.tts import (
    TTSService,
    TTSProvider,
    TTSSynthesizeOptions,
    DialogueLine,
    JAPANESE_VOICES,
)

router = APIRouter(prefix="/api/tts", tags=["tts"])

# Singleton TTS service
_tts_service = TTSService()


class SynthesizeRequest(BaseModel):
    """Request to synthesize text to speech."""

    text: str = Field(..., min_length=1, max_length=5000)
    voice: str | None = None
    speed: float = Field(default=1.0, ge=0.25, le=4.0)
    pitch: float = Field(default=0, ge=-20, le=20)
    provider: TTSProvider | None = None


class SynthesizeResponse(BaseModel):
    """Response from text synthesis."""

    audio_base64: str
    audio_url: str | None = None
    duration_seconds: float
    format: str


class DialogueSynthesizeRequest(BaseModel):
    """Request to synthesize dialogue."""

    dialogue: list[DialogueLine]
    voice_map: dict[str, str]
    speed: float = Field(default=1.0, ge=0.25, le=4.0)
    provider: TTSProvider | None = None


class VoiceInfo(BaseModel):
    """Voice information."""

    name: str
    gender: str
    description: str


class VoicesResponse(BaseModel):
    """Response for voices endpoint."""

    provider: TTSProvider | None = None
    voices: dict[str, VoiceInfo] | None = None
    providers: dict[str, dict[str, VoiceInfo]] | None = None


class ProvidersResponse(BaseModel):
    """Response for providers endpoint."""

    providers: list[str]
    default: str


@router.post("/synthesize", response_model=SynthesizeResponse)
async def synthesize(request: SynthesizeRequest):
    """Synthesize text to speech."""
    try:
        result = await _tts_service.synthesize(
            request.text,
            TTSSynthesizeOptions(
                voice=request.voice,
                speed=request.speed,
                pitch=request.pitch,
                provider=request.provider,
            ),
        )

        return SynthesizeResponse(
            audio_base64=result.audio_base64,
            audio_url=result.audio_url,
            duration_seconds=result.duration_seconds,
            format=result.format,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/synthesize-dialogue", response_model=SynthesizeResponse)
async def synthesize_dialogue(request: DialogueSynthesizeRequest):
    """Synthesize dialogue with multiple speakers."""
    try:
        result = await _tts_service.synthesize_dialogue(
            request.dialogue,
            request.voice_map,
            provider=request.provider,
            speed=request.speed,
        )

        return SynthesizeResponse(
            audio_base64=result.audio_base64,
            audio_url=result.audio_url,
            duration_seconds=result.duration_seconds,
            format=result.format,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/voices")
async def get_voices(provider: TTSProvider | None = None):
    """Get available voices."""
    if provider:
        voices = _tts_service.get_available_voices(provider)
        return {"provider": provider.value, "voices": voices}
    else:
        return {
            "providers": {
                "google": JAPANESE_VOICES[TTSProvider.GOOGLE],
                "openai": JAPANESE_VOICES[TTSProvider.OPENAI],
                "elevenlabs": JAPANESE_VOICES[TTSProvider.ELEVENLABS],
            }
        }


@router.get("/providers", response_model=ProvidersResponse)
async def get_providers():
    """Get available TTS providers."""
    return ProvidersResponse(
        providers=["google", "openai", "elevenlabs"],
        default="openai",
    )
