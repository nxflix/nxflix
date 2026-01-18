"""Vocabulary API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from nxflix_agents.models import VocabularyItem, VocabularyGenerateRequest
from nxflix_agents.models.vocabulary import PartOfSpeech
from nxflix_agents.services import VocabularyService
from nxflix_agents.providers.llm import LLMProvider

router = APIRouter(prefix="/api/vocabulary", tags=["vocabulary"])

# Singleton vocabulary service
_vocabulary_service = VocabularyService()
_llm = LLMProvider()


class VocabularyListResponse(BaseModel):
    """Response for listing vocabulary."""

    vocabulary: list[VocabularyItem]
    count: int


class VocabularySingleResponse(BaseModel):
    """Response for a single vocabulary item."""

    vocabulary: VocabularyItem


class VocabularyGeneratedResponse(BaseModel):
    """Response schema for generated vocabulary."""

    vocabulary: list[VocabularyItem]


@router.get("/", response_model=VocabularyListResponse)
async def list_vocabulary():
    """List all vocabulary items."""
    vocabulary = _vocabulary_service.get_all_vocabulary_items()
    return VocabularyListResponse(vocabulary=vocabulary, count=len(vocabulary))


@router.get("/search", response_model=VocabularyListResponse)
async def search_vocabulary(query: str):
    """Search vocabulary by word, reading, or meanings."""
    vocabulary = _vocabulary_service.search_vocabulary(query)
    return VocabularyListResponse(vocabulary=vocabulary, count=len(vocabulary))


@router.get("/by-word/{word}", response_model=VocabularySingleResponse)
async def get_vocabulary_by_word(word: str):
    """Get vocabulary by its word."""
    vocabulary = _vocabulary_service.get_vocabulary_by_word(word)
    if not vocabulary:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    return VocabularySingleResponse(vocabulary=vocabulary)


@router.get("/by-pos/{pos}", response_model=VocabularyListResponse)
async def get_vocabulary_by_pos(pos: str):
    """Get vocabulary items by part of speech."""
    try:
        part_of_speech = PartOfSpeech(pos)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid part of speech")

    vocabulary = _vocabulary_service.get_vocabulary_by_part_of_speech(part_of_speech)
    return VocabularyListResponse(vocabulary=vocabulary, count=len(vocabulary))


@router.get("/{vocab_id}", response_model=VocabularySingleResponse)
async def get_vocabulary(vocab_id: str):
    """Get a single vocabulary item by ID."""
    vocabulary = _vocabulary_service.get_vocabulary_item(vocab_id)
    if not vocabulary:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    return VocabularySingleResponse(vocabulary=vocabulary)


@router.post("/generate", response_model=VocabularyListResponse)
async def generate_vocabulary(request: VocabularyGenerateRequest):
    """AI-generate a set of vocabulary items."""
    prompt = _build_vocabulary_generation_prompt(request)

    try:
        generated = await _llm.complete_json(
            messages=[{"role": "user", "content": prompt}],
            response_model=VocabularyGeneratedResponse,
        )

        # Add generated vocabulary to service
        for vocab in generated.vocabulary:
            _vocabulary_service.add_vocabulary_item(vocab)

        return VocabularyListResponse(
            vocabulary=generated.vocabulary, count=len(generated.vocabulary)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _build_vocabulary_generation_prompt(request: VocabularyGenerateRequest) -> str:
    """Build the prompt for vocabulary generation."""
    parts: list[str] = [
        "Generate JLPT N1 vocabulary data in JSON format.",
        "",
    ]

    if request.topic:
        parts.append(
            f"Generate {request.count} vocabulary items related to the topic: {request.topic}"
        )
    else:
        parts.append(f"Generate {request.count} random JLPT N1 vocabulary items.")

    if request.part_of_speech:
        parts.append(f"Focus on {request.part_of_speech.value} words.")

    parts.extend([
        "",
        "For each vocabulary item, provide:",
        "- id: unique identifier (format: vocab-XXX)",
        "- word: the word in kanji (if applicable)",
        "- reading: the reading in hiragana",
        "- meanings: array of English meanings",
        "- part_of_speech: one of: noun, verb, adjective_i, adjective_na, adverb, particle, conjunction, expression",
    ])

    if request.include_examples:
        parts.append(
            "- examples: array of 1-2 example sentences with sentence and translation"
        )

    parts.extend([
        "- synonyms: array of synonymous words (optional)",
        "- antonyms: array of antonymous words (optional)",
        "- notes: any additional notes about usage (optional)",
        "",
        'Return a JSON object with a "vocabulary" array containing the vocabulary objects.',
    ])

    return "\n".join(parts)


# Export the service for state management
def get_vocabulary_service() -> VocabularyService:
    """Get the vocabulary service singleton."""
    return _vocabulary_service
