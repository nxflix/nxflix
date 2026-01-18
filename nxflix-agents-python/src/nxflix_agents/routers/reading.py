"""Reading API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from nxflix_agents.models import ReadingPassage, ReadingGenerateRequest
from nxflix_agents.models.reading import ReadingPassageType
from nxflix_agents.services import ReadingService
from nxflix_agents.providers.llm import LLMProvider

router = APIRouter(prefix="/api/reading", tags=["reading"])

# Singleton reading service
_reading_service = ReadingService()
_llm = LLMProvider()


class ReadingListResponse(BaseModel):
    """Response for listing reading passages."""

    reading: list[ReadingPassage]
    count: int


class ReadingSingleResponse(BaseModel):
    """Response for a single reading passage."""

    reading: ReadingPassage


class ReadingGeneratedResponse(BaseModel):
    """Response schema for generated reading."""

    reading: ReadingPassage


@router.get("/", response_model=ReadingListResponse)
async def list_reading():
    """List all reading passages."""
    reading = _reading_service.get_all_reading_passages()
    return ReadingListResponse(reading=reading, count=len(reading))


@router.get("/search", response_model=ReadingListResponse)
async def search_reading(query: str):
    """Search reading passages by content, title, or topic."""
    reading = _reading_service.search_reading(query)
    return ReadingListResponse(reading=reading, count=len(reading))


@router.get("/by-type/{passage_type}", response_model=ReadingListResponse)
async def get_reading_by_type(passage_type: str):
    """Get reading passages by type."""
    try:
        pt = ReadingPassageType(passage_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid passage type")

    reading = _reading_service.get_reading_by_type(pt)
    return ReadingListResponse(reading=reading, count=len(reading))


@router.get("/by-topic/{topic}", response_model=ReadingListResponse)
async def get_reading_by_topic(topic: str):
    """Get reading passages by topic."""
    reading = _reading_service.get_reading_by_topic(topic)
    return ReadingListResponse(reading=reading, count=len(reading))


@router.get("/{passage_id}", response_model=ReadingSingleResponse)
async def get_reading(passage_id: str):
    """Get a single reading passage by ID."""
    reading = _reading_service.get_reading_passage(passage_id)
    if not reading:
        raise HTTPException(status_code=404, detail="Reading passage not found")
    return ReadingSingleResponse(reading=reading)


@router.post("/generate", response_model=ReadingSingleResponse)
async def generate_reading(request: ReadingGenerateRequest):
    """AI-generate a reading passage."""
    prompt = _build_reading_generation_prompt(request)

    try:
        generated = await _llm.complete_json(
            messages=[{"role": "user", "content": prompt}],
            response_model=ReadingGeneratedResponse,
        )

        # Calculate character count if not provided
        reading = ReadingPassage(
            **{
                **generated.reading.model_dump(),
                "character_count": len(generated.reading.content),
                "word_count": len(generated.reading.content.split()),
            }
        )

        # Add to service
        _reading_service.add_reading_passage(reading)

        return ReadingSingleResponse(reading=reading)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _build_reading_generation_prompt(request: ReadingGenerateRequest) -> str:
    """Build the prompt for reading generation."""
    length_guide = {
        ReadingPassageType.SHORT: "200-400 characters",
        ReadingPassageType.MEDIUM: "400-800 characters",
        ReadingPassageType.LONG: "800-1200 characters",
        ReadingPassageType.COMPARISON: "300-500 characters per text",
        ReadingPassageType.INFORMATION: "150-300 characters with structured data",
    }

    parts: list[str] = [
        "Generate a JLPT N1 reading passage in JSON format.",
        "",
        f"Passage type: {request.passage_type.value}",
        f"Target length: {length_guide[request.passage_type]}",
        f"Number of questions: {request.question_count}",
    ]

    if request.topic:
        parts.append(f"Topic: {request.topic}")

    if request.genre:
        parts.append(f"Genre: {request.genre.value}")

    parts.extend([
        "",
        "Create a natural Japanese passage appropriate for JLPT N1 level.",
        "The passage should use N1-level vocabulary and grammar.",
        "",
        "For the reading passage, provide:",
        "- id: unique identifier (format: reading-XXX)",
        "- passage_type: the passage type",
        "- title: optional title",
        "- content: the Japanese passage text",
        "- word_count: approximate word count",
        "- character_count: character count",
        "- questions: array of comprehension questions (4 options each)",
        "- estimated_minutes: estimated reading time in minutes",
    ])

    if request.include_vocabulary:
        parts.append(
            "- key_vocabulary: array of 3-5 key vocabulary items with word, reading, meaning"
        )

    if request.include_grammar:
        parts.append("- key_grammar: array of 2-3 key grammar patterns used")

    parts.extend([
        "",
        "Each question should have:",
        "- id, question_text, question_text_jp (optional)",
        "- options: exactly 4 choices",
        "- correct_option: index 0-3",
        "- explanation: why the answer is correct",
        "",
        'Return a JSON object with a "reading" object.',
    ])

    return "\n".join(parts)


# Export the service for state management
def get_reading_service() -> ReadingService:
    """Get the reading service singleton."""
    return _reading_service
