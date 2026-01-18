"""Text-to-Speech service for generating audio from Japanese text."""

import base64
from enum import Enum
from typing import Literal
import httpx
from pydantic import BaseModel, Field

from nxflix_agents.config import settings


class TTSProvider(str, Enum):
    """TTS provider type."""

    GOOGLE = "google"
    OPENAI = "openai"
    ELEVENLABS = "elevenlabs"


# Available Japanese voices by provider
JAPANESE_VOICES = {
    TTSProvider.GOOGLE: {
        "ja-JP-Neural2-B": {"name": "ja-JP-Neural2-B", "gender": "female", "description": "Natural female voice"},
        "ja-JP-Neural2-C": {"name": "ja-JP-Neural2-C", "gender": "male", "description": "Natural male voice"},
        "ja-JP-Neural2-D": {"name": "ja-JP-Neural2-D", "gender": "male", "description": "Natural male voice 2"},
        "ja-JP-Wavenet-A": {"name": "ja-JP-Wavenet-A", "gender": "female", "description": "Wavenet female"},
        "ja-JP-Wavenet-B": {"name": "ja-JP-Wavenet-B", "gender": "female", "description": "Wavenet female 2"},
    },
    TTSProvider.OPENAI: {
        "shimmer": {"name": "shimmer", "gender": "female", "description": "Clear female voice"},
        "alloy": {"name": "alloy", "gender": "neutral", "description": "Neutral expressive voice"},
        "echo": {"name": "echo", "gender": "male", "description": "Male voice"},
        "fable": {"name": "fable", "gender": "male", "description": "British male voice"},
        "onyx": {"name": "onyx", "gender": "male", "description": "Deep male voice"},
        "nova": {"name": "nova", "gender": "female", "description": "Friendly female voice"},
    },
    TTSProvider.ELEVENLABS: {
        "yuki": {"name": "yuki", "gender": "female", "description": "Japanese female"},
    },
}


class TTSSynthesizeOptions(BaseModel):
    """TTS synthesis options."""

    voice: str | None = None
    speed: float = Field(default=1.0, ge=0.25, le=4.0)
    pitch: float = Field(default=0, ge=-20, le=20)
    provider: TTSProvider | None = None


class TTSSynthesizeResult(BaseModel):
    """TTS synthesis result."""

    audio_base64: str
    audio_url: str | None = None
    duration_seconds: float
    format: str


class DialogueLine(BaseModel):
    """Dialogue line for multi-speaker synthesis."""

    speaker: str
    text: str


class TTSService:
    """Text-to-Speech Service for generating audio from Japanese text."""

    def __init__(self, provider: TTSProvider | None = None) -> None:
        self._provider = provider or TTSProvider(settings.tts_provider)
        self._google_api_key = settings.google_api_key
        self._openai_api_key = settings.openai_api_key
        self._elevenlabs_api_key = settings.elevenlabs_api_key

    async def synthesize(
        self,
        text: str,
        options: TTSSynthesizeOptions | None = None,
    ) -> TTSSynthesizeResult:
        """Synthesize speech from text."""
        opts = options or TTSSynthesizeOptions()
        provider = opts.provider or self._provider
        voice = opts.voice or self._get_default_voice(provider)
        speed = opts.speed

        if provider == TTSProvider.OPENAI:
            return await self._synthesize_with_openai(text, voice, speed)
        elif provider == TTSProvider.GOOGLE:
            return await self._synthesize_with_google(text, voice, speed, opts.pitch)
        elif provider == TTSProvider.ELEVENLABS:
            return await self._synthesize_with_elevenlabs(text, voice, speed)
        else:
            raise ValueError(f"Unsupported TTS provider: {provider}")

    async def synthesize_dialogue(
        self,
        dialogue: list[DialogueLine],
        voice_map: dict[str, str],
        provider: TTSProvider | None = None,
        speed: float = 1.0,
    ) -> TTSSynthesizeResult:
        """Synthesize dialogue with multiple speakers."""
        # For simplicity, concatenate all dialogue into one audio
        combined_text = "。".join(line.text for line in dialogue)

        voice = list(voice_map.values())[0] if voice_map else None
        return await self.synthesize(
            combined_text,
            TTSSynthesizeOptions(
                voice=voice,
                speed=speed,
                provider=provider,
            ),
        )

    def get_available_voices(
        self, provider: TTSProvider | None = None
    ) -> dict[str, dict[str, str]]:
        """Get available voices for a provider."""
        p = provider or self._provider
        return JAPANESE_VOICES.get(p, {})

    def _get_default_voice(self, provider: TTSProvider) -> str:
        """Get the default voice for a provider."""
        if provider == TTSProvider.GOOGLE:
            return "ja-JP-Neural2-B"
        elif provider == TTSProvider.OPENAI:
            return "shimmer"
        elif provider == TTSProvider.ELEVENLABS:
            return "yuki"
        return "shimmer"

    async def _synthesize_with_openai(
        self,
        text: str,
        voice: str,
        speed: float,
    ) -> TTSSynthesizeResult:
        """Synthesize with OpenAI TTS."""
        if not self._openai_api_key:
            raise ValueError("OpenAI API key not configured")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers={
                    "Authorization": f"Bearer {self._openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "tts-1",
                    "input": text,
                    "voice": voice,
                    "speed": speed,
                    "response_format": "mp3",
                },
                timeout=60.0,
            )

            if response.status_code != 200:
                raise ValueError(f"OpenAI TTS error: {response.text}")

            audio_base64 = base64.b64encode(response.content).decode("utf-8")
            estimated_duration = (len(text) * 0.15) / speed

            return TTSSynthesizeResult(
                audio_base64=audio_base64,
                duration_seconds=estimated_duration,
                format="mp3",
            )

    async def _synthesize_with_google(
        self,
        text: str,
        voice: str,
        speed: float,
        pitch: float,
    ) -> TTSSynthesizeResult:
        """Synthesize with Google Cloud TTS."""
        if not self._google_api_key:
            raise ValueError("Google API key not configured")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://texttospeech.googleapis.com/v1/text:synthesize?key={self._google_api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "input": {"text": text},
                    "voice": {
                        "languageCode": "ja-JP",
                        "name": voice,
                    },
                    "audioConfig": {
                        "audioEncoding": "MP3",
                        "speakingRate": speed,
                        "pitch": pitch,
                    },
                },
                timeout=60.0,
            )

            if response.status_code != 200:
                raise ValueError(f"Google TTS error: {response.text}")

            data = response.json()
            estimated_duration = (len(text) * 0.15) / speed

            return TTSSynthesizeResult(
                audio_base64=data["audioContent"],
                duration_seconds=estimated_duration,
                format="mp3",
            )

    async def _synthesize_with_elevenlabs(
        self,
        text: str,
        voice: str,
        speed: float,
    ) -> TTSSynthesizeResult:
        """Synthesize with ElevenLabs."""
        if not self._elevenlabs_api_key:
            raise ValueError("ElevenLabs API key not configured")

        voice_id = voice

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers={
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": self._elevenlabs_api_key,
                },
                json={
                    "text": text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75,
                        "style": 0.0,
                        "use_speaker_boost": True,
                    },
                },
                timeout=60.0,
            )

            if response.status_code != 200:
                raise ValueError(f"ElevenLabs TTS error: {response.text}")

            audio_base64 = base64.b64encode(response.content).decode("utf-8")
            estimated_duration = (len(text) * 0.15) / speed

            return TTSSynthesizeResult(
                audio_base64=audio_base64,
                duration_seconds=estimated_duration,
                format="mp3",
            )
