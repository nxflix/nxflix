"""Listening API routes."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import base64

from nxflix_agents.models import ListeningItem, ListeningGenerateRequest
from nxflix_agents.models.listening import ListeningType
from nxflix_agents.services import ListeningService, TTSService
from nxflix_agents.providers.llm import LLMProvider

router = APIRouter(prefix="/api/listening", tags=["listening"])

# Singleton services
_listening_service = ListeningService()
_tts_service = TTSService()
_llm = LLMProvider()


class ListeningListResponse(BaseModel):
    """Response for listing listening items."""

    listening: list[ListeningItem]
    count: int


class ListeningSingleResponse(BaseModel):
    """Response for a single listening item."""

    listening: ListeningItem


class ListeningGeneratedResponse(BaseModel):
    """Response schema for generated listening."""

    listening: ListeningItem


@router.get("/", response_model=ListeningListResponse)
async def list_listening():
    """List all listening items."""
    listening = _listening_service.get_all_listening_items()
    return ListeningListResponse(listening=listening, count=len(listening))


@router.get("/search", response_model=ListeningListResponse)
async def search_listening(query: str):
    """Search listening items by transcript, title, or context."""
    listening = _listening_service.search_listening(query)
    return ListeningListResponse(listening=listening, count=len(listening))


@router.get("/by-type/{listening_type}", response_model=ListeningListResponse)
async def get_listening_by_type(listening_type: str):
    """Get listening items by type."""
    try:
        lt = ListeningType(listening_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid listening type")

    listening = _listening_service.get_listening_by_type(lt)
    return ListeningListResponse(listening=listening, count=len(listening))


@router.get("/{item_id}", response_model=ListeningSingleResponse)
async def get_listening(item_id: str):
    """Get a single listening item by ID."""
    listening = _listening_service.get_listening_item(item_id)
    if not listening:
        raise HTTPException(status_code=404, detail="Listening item not found")
    return ListeningSingleResponse(listening=listening)


@router.get("/{item_id}/audio")
async def get_listening_audio(item_id: str):
    """Stream audio for a listening item."""
    listening = _listening_service.get_listening_item(item_id)
    if not listening:
        raise HTTPException(status_code=404, detail="Listening item not found")

    if not listening.audio_base64:
        raise HTTPException(status_code=404, detail="Audio not available")

    audio_bytes = base64.b64decode(listening.audio_base64)
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Content-Length": str(len(audio_bytes))},
    )


@router.post("/generate", response_model=ListeningSingleResponse)
async def generate_listening(request: ListeningGenerateRequest):
    """AI-generate a listening exercise."""
    prompt = _build_listening_generation_prompt(request)

    try:
        # Generate the script and questions
        generated = await _llm.complete_json(
            messages=[{"role": "user", "content": prompt}],
            response_model=ListeningGeneratedResponse,
        )

        listening = generated.listening

        # Generate TTS audio if requested
        if request.generate_audio and listening.transcript:
            try:
                from nxflix_agents.services.tts import TTSSynthesizeOptions

                tts_result = await _tts_service.synthesize(
                    listening.transcript,
                    TTSSynthesizeOptions(speed=0.9),  # Slightly slower for practice
                )

                listening = ListeningItem(
                    **{
                        **listening.model_dump(),
                        "audio_base64": tts_result.audio_base64,
                        "duration_seconds": tts_result.duration_seconds,
                    }
                )
            except Exception as tts_error:
                print(f"TTS generation failed: {tts_error}")
                # Continue without audio

        # Add to service
        _listening_service.add_listening_item(listening)

        return ListeningSingleResponse(listening=listening)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _build_listening_generation_prompt(request: ListeningGenerateRequest) -> str:
    """Build the prompt for listening generation."""
    parts: list[str] = [
        "Generate a JLPT N1 listening exercise in JSON format.",
        "",
        f"Exercise type: {request.listening_type.value}",
        f"Target duration: approximately {request.duration_seconds} seconds",
        f"Number of speakers: {request.speaker_count}",
        f"Number of questions: {request.question_count}",
    ]

    if request.topic:
        parts.append(f"Topic/situation: {request.topic}")

    parts.extend([
        "",
        "Create a natural Japanese dialogue appropriate for JLPT N1 level.",
        "",
        "For the listening item, provide:",
        "- id: unique identifier (format: listening-XXX)",
        "- listening_type: the exercise type",
        "- title: optional title for the exercise",
        "- transcript: the full dialogue transcript",
        "- dialogue: array of dialogue lines with speaker_id and text",
        "- speakers: array of speaker info with id, name, gender",
        "- duration_seconds: estimated duration",
        "- questions: array of multiple-choice questions (4 options each)",
        "- situation_context: brief context/setting description",
        "",
        "Each question should have:",
        "- id, question_text, question_text_jp (optional)",
        "- options: exactly 4 choices",
        "- correct_option: index 0-3",
        "- explanation: why the answer is correct",
        "",
        'Return a JSON object with a "listening" object.',
    ])

    return "\n".join(parts)


# Export the service for state management
def get_listening_service() -> ListeningService:
    """Get the listening service singleton."""
    return _listening_service
