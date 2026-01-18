"""Kanji API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from nxflix_agents.models import KanjiItem, KanjiGenerateRequest
from nxflix_agents.services import KanjiService
from nxflix_agents.providers.llm import LLMProvider

router = APIRouter(prefix="/api/kanji", tags=["kanji"])

# Singleton kanji service
_kanji_service = KanjiService()
_llm = LLMProvider()


class KanjiListResponse(BaseModel):
    """Response for listing kanji."""

    kanji: list[KanjiItem]
    count: int


class KanjiSingleResponse(BaseModel):
    """Response for a single kanji."""

    kanji: KanjiItem


class KanjiGeneratedResponse(BaseModel):
    """Response schema for generated kanji."""

    kanji: list[KanjiItem]


@router.get("/", response_model=KanjiListResponse)
async def list_kanji():
    """List all kanji items."""
    kanji = _kanji_service.get_all_kanji_items()
    return KanjiListResponse(kanji=kanji, count=len(kanji))


@router.get("/search", response_model=KanjiListResponse)
async def search_kanji(query: str):
    """Search kanji by character, meaning, or readings."""
    kanji = _kanji_service.search_kanji(query)
    return KanjiListResponse(kanji=kanji, count=len(kanji))


@router.get("/by-character/{char}", response_model=KanjiSingleResponse)
async def get_kanji_by_character(char: str):
    """Get kanji by its character."""
    kanji = _kanji_service.get_kanji_by_character(char)
    if not kanji:
        raise HTTPException(status_code=404, detail="Kanji not found")
    return KanjiSingleResponse(kanji=kanji)


@router.get("/{kanji_id}", response_model=KanjiSingleResponse)
async def get_kanji(kanji_id: str):
    """Get a single kanji by ID."""
    kanji = _kanji_service.get_kanji_item(kanji_id)
    if not kanji:
        raise HTTPException(status_code=404, detail="Kanji not found")
    return KanjiSingleResponse(kanji=kanji)


@router.post("/generate", response_model=KanjiListResponse)
async def generate_kanji(request: KanjiGenerateRequest):
    """AI-generate a set of kanji items."""
    prompt = _build_kanji_generation_prompt(request)

    try:
        generated = await _llm.complete_json(
            messages=[{"role": "user", "content": prompt}],
            response_model=KanjiGeneratedResponse,
        )

        # Add generated kanji to service
        for kanji in generated.kanji:
            _kanji_service.add_kanji_item(kanji)

        return KanjiListResponse(kanji=generated.kanji, count=len(generated.kanji))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _build_kanji_generation_prompt(request: KanjiGenerateRequest) -> str:
    """Build the prompt for kanji generation."""
    parts: list[str] = [
        "Generate JLPT N1 kanji data in JSON format.",
        "",
    ]

    if request.characters and len(request.characters) > 0:
        parts.append(f"Generate data for these specific kanji: {', '.join(request.characters)}")
    elif request.topic:
        parts.append(f"Generate {request.count} kanji related to the topic: {request.topic}")
    else:
        parts.append(f"Generate {request.count} random JLPT N1 kanji.")

    parts.extend([
        "",
        "For each kanji, provide:",
        "- id: unique identifier (format: kanji-XXX)",
        "- character: the single kanji character",
        "- stroke_count: number of strokes",
        "- onyomi: array of on readings in katakana",
        "- kunyomi: array of kun readings in hiragana",
        "- meanings: array of English meanings",
        "- radicals: array of radical components",
    ])

    if request.include_compounds:
        parts.append("- compound_words: array of 2-3 compound words with word, reading, and meaning")

    parts.extend([
        "- mnemonics: a helpful memory aid (optional)",
        "",
        'Return a JSON object with a "kanji" array containing the kanji objects.',
    ])

    return "\n".join(parts)


# Export the service for state management
def get_kanji_service() -> KanjiService:
    """Get the kanji service singleton."""
    return _kanji_service
