"""Content Creator Agent for generating JLPT N1 study content."""

import re
import uuid
from typing import Literal
from pydantic import BaseModel

from nxflix_agents.providers.llm import LLMProvider
from nxflix_agents.services.tts import TTSService, TTSSynthesizeOptions
from nxflix_agents.models import (
    VocabularyItem,
    KanjiItem,
    ReadingPassage,
    ListeningItem,
)
from nxflix_agents.models.reading import ReadingPassageType
from nxflix_agents.models.listening import ListeningType


class GeneratedVocabulary(BaseModel):
    """Response schema for generated vocabulary."""

    vocabulary: list[dict]


class GeneratedKanji(BaseModel):
    """Response schema for generated kanji."""

    kanji: list[dict]


class GeneratedReading(BaseModel):
    """Response schema for generated reading."""

    reading: dict


class GeneratedListening(BaseModel):
    """Response schema for generated listening."""

    listening: dict


class ContentCreatorAgent:
    """Agent for AI-powered generation of JLPT N1 study content."""

    def __init__(
        self, llm_provider: LLMProvider | None = None, tts_service: TTSService | None = None
    ) -> None:
        self._llm = llm_provider or LLMProvider()
        self._tts = tts_service or TTSService()

    async def create_vocabulary_set(
        self,
        topic: str,
        count: int = 10,
        part_of_speech: str | None = None,
        include_examples: bool = True,
        include_audio: bool = False,
    ) -> list[VocabularyItem]:
        """Generate a set of vocabulary items."""
        prompt = self._build_vocabulary_prompt(topic, count, part_of_speech, include_examples)

        result = await self._llm.complete_json(
            messages=[{"role": "user", "content": prompt}],
            response_model=GeneratedVocabulary,
        )

        vocabulary = []
        for v in result.vocabulary:
            item = VocabularyItem(
                id=v.get("id") or f"vocab-{uuid.uuid4().hex[:8]}",
                word=v.get("word", ""),
                reading=v.get("reading", ""),
                meanings=v.get("meanings", []),
                part_of_speech=v.get("part_of_speech", v.get("partOfSpeech", "noun")),
                examples=v.get("examples", []),
                synonyms=v.get("synonyms", []),
                level="N1",
            )
            vocabulary.append(item)

        return vocabulary

    async def create_kanji_set(
        self,
        target_kanji: list[str],
        include_compounds: bool = True,
        include_mnemonics: bool = True,
    ) -> list[KanjiItem]:
        """Generate kanji data for specified characters."""
        prompt = self._build_kanji_prompt(target_kanji, include_compounds, include_mnemonics)

        result = await self._llm.complete_json(
            messages=[{"role": "user", "content": prompt}],
            response_model=GeneratedKanji,
        )

        kanji = []
        for k in result.kanji:
            item = KanjiItem(
                id=k.get("id") or f"kanji-{uuid.uuid4().hex[:8]}",
                character=k.get("character", ""),
                stroke_count=k.get("stroke_count", k.get("strokeCount", 1)),
                onyomi=k.get("onyomi", []),
                kunyomi=k.get("kunyomi", []),
                meanings=k.get("meanings", []),
                radicals=k.get("radicals", []),
                compound_words=k.get("compound_words", k.get("compoundWords", [])),
                mnemonics=k.get("mnemonics"),
                level="N1",
            )
            kanji.append(item)

        return kanji

    async def create_reading_exercise(
        self,
        topic: str,
        passage_type: ReadingPassageType = ReadingPassageType.SHORT,
        genre: str | None = None,
        question_count: int = 3,
        include_vocabulary: bool = True,
    ) -> ReadingPassage:
        """Generate a reading exercise with comprehension questions."""
        prompt = self._build_reading_prompt(
            topic, passage_type, genre, question_count, include_vocabulary
        )

        result = await self._llm.complete_json(
            messages=[{"role": "user", "content": prompt}],
            response_model=GeneratedReading,
        )

        r = result.reading
        content = r.get("content", "")

        return ReadingPassage(
            id=r.get("id") or f"reading-{uuid.uuid4().hex[:8]}",
            passage_type=passage_type,
            title=r.get("title"),
            content=content,
            word_count=len(content.split()),
            character_count=len(content),
            questions=r.get("questions", []),
            key_vocabulary=r.get("key_vocabulary", r.get("keyVocabulary", [])),
            key_grammar=r.get("key_grammar", r.get("keyGrammar", [])),
            topic=topic,
            level="N1",
            estimated_minutes=r.get("estimated_minutes", r.get("estimatedMinutes", 5)),
        )

    async def create_listening_exercise(
        self,
        topic: str,
        listening_type: ListeningType = ListeningType.TASK_BASED,
        duration_seconds: int = 60,
        speaker_count: int = 2,
        question_count: int = 2,
        generate_audio: bool = True,
    ) -> ListeningItem:
        """Generate a listening exercise with TTS audio."""
        prompt = self._build_listening_prompt(
            topic, listening_type, duration_seconds, speaker_count, question_count
        )

        result = await self._llm.complete_json(
            messages=[{"role": "user", "content": prompt}],
            response_model=GeneratedListening,
        )

        l = result.listening
        transcript = l.get("transcript", "")

        listening = ListeningItem(
            id=l.get("id") or f"listening-{uuid.uuid4().hex[:8]}",
            listening_type=listening_type,
            title=l.get("title"),
            transcript=transcript,
            dialogue=l.get("dialogue", []),
            speakers=l.get("speakers", []),
            duration_seconds=duration_seconds,
            questions=l.get("questions", []),
            situation_context=l.get("situation_context", l.get("situationContext")),
            level="N1",
        )

        # Generate TTS audio if requested
        if generate_audio and transcript:
            try:
                tts_result = await self._tts.synthesize(
                    transcript,
                    TTSSynthesizeOptions(speed=0.9),
                )
                listening = ListeningItem(
                    **{
                        **listening.model_dump(),
                        "audio_base64": tts_result.audio_base64,
                        "duration_seconds": tts_result.duration_seconds,
                    }
                )
            except Exception as e:
                print(f"TTS generation failed: {e}")

        return listening

    async def create_mixed_content_set(
        self,
        topic: str,
        content_types: list[Literal["vocabulary", "kanji", "reading", "listening"]],
        vocabulary_count: int = 5,
        kanji_count: int = 5,
        reading_type: ReadingPassageType = ReadingPassageType.SHORT,
        listening_type: ListeningType = ListeningType.TASK_BASED,
    ) -> dict:
        """Generate a mixed content set across multiple types."""
        results: dict = {}

        # Generate content (could be parallelized with asyncio.gather)
        if "vocabulary" in content_types:
            results["vocabulary"] = await self.create_vocabulary_set(topic, vocabulary_count)

        if "reading" in content_types:
            results["reading"] = await self.create_reading_exercise(topic, reading_type)

        if "listening" in content_types:
            results["listening"] = await self.create_listening_exercise(
                topic, listening_type
            )

        # Extract kanji from generated content
        if "kanji" in content_types:
            kanji_chars = self._extract_kanji_from_content(results)
            if kanji_chars:
                results["kanji"] = await self.create_kanji_set(kanji_chars[:kanji_count])

        return results

    def _build_vocabulary_prompt(
        self,
        topic: str,
        count: int,
        part_of_speech: str | None,
        include_examples: bool,
    ) -> str:
        parts = [
            f"Generate {count} JLPT N1 vocabulary items related to: {topic}",
            "",
            "Requirements:",
            "- All words should be N1 level difficulty",
            "- Include varied parts of speech unless specified",
        ]

        if part_of_speech:
            parts.append(f"- Focus on {part_of_speech} words")

        parts.extend([
            "",
            "For each word provide:",
            "- id: unique identifier (vocab-XXX)",
            "- word: the word in kanji",
            "- reading: hiragana reading",
            "- meanings: array of meanings",
            "- part_of_speech: noun/verb/adjective_i/adjective_na/adverb/etc.",
        ])

        if include_examples:
            parts.append("- examples: array of {sentence, translation}")

        parts.extend(["", 'Return JSON with a "vocabulary" array.'])

        return "\n".join(parts)

    def _build_kanji_prompt(
        self,
        target_kanji: list[str],
        include_compounds: bool,
        include_mnemonics: bool,
    ) -> str:
        parts = [
            f"Generate detailed kanji data for: {', '.join(target_kanji)}",
            "",
            "For each kanji provide:",
            "- id: unique identifier (kanji-XXX)",
            "- character: the kanji character",
            "- stroke_count: number of strokes",
            "- onyomi: array of on readings (katakana)",
            "- kunyomi: array of kun readings (hiragana)",
            "- meanings: array of English meanings",
            "- radicals: array of radical components",
        ]

        if include_compounds:
            parts.append("- compound_words: array of {word, reading, meaning}")

        if include_mnemonics:
            parts.append("- mnemonics: memory aid for the kanji")

        parts.extend(["", 'Return JSON with a "kanji" array.'])

        return "\n".join(parts)

    def _build_reading_prompt(
        self,
        topic: str,
        passage_type: ReadingPassageType,
        genre: str | None,
        question_count: int,
        include_vocabulary: bool,
    ) -> str:
        length_guide = {
            ReadingPassageType.SHORT: "200-400 characters",
            ReadingPassageType.MEDIUM: "400-800 characters",
            ReadingPassageType.LONG: "800-1200 characters",
            ReadingPassageType.COMPARISON: "300-500 characters per text",
            ReadingPassageType.INFORMATION: "150-300 characters with structured data",
        }

        parts = [
            f"Generate a JLPT N1 {passage_type.value} reading passage about: {topic}",
            "",
            f"Target length: {length_guide[passage_type]}",
            f"Number of questions: {question_count}",
        ]

        if genre:
            parts.append(f"Genre: {genre}")

        parts.extend([
            "",
            "Provide:",
            "- id: unique identifier (reading-XXX)",
            "- passage_type: the type",
            "- content: the Japanese passage",
            "- questions: array of multiple-choice questions",
            "  - Each with id, question_text, options (4), correct_option (0-3), explanation",
        ])

        if include_vocabulary:
            parts.append("- key_vocabulary: array of {word, reading, meaning}")

        parts.extend(["", 'Return JSON with a "reading" object.'])

        return "\n".join(parts)

    def _build_listening_prompt(
        self,
        topic: str,
        listening_type: ListeningType,
        duration_seconds: int,
        speaker_count: int,
        question_count: int,
    ) -> str:
        return "\n".join([
            f"Generate a JLPT N1 {listening_type.value} listening exercise about: {topic}",
            "",
            f"Target duration: ~{duration_seconds} seconds",
            f"Number of speakers: {speaker_count}",
            f"Number of questions: {question_count}",
            "",
            "Create a natural Japanese dialogue appropriate for N1 level.",
            "",
            "Provide:",
            "- id: unique identifier (listening-XXX)",
            "- listening_type: the type",
            "- transcript: the full dialogue text",
            "- dialogue: array of {speaker_id, text}",
            "- speakers: array of {id, name, gender}",
            "- questions: array of multiple-choice questions",
            "  - Each with id, question_text, options (4), correct_option (0-3), explanation",
            "- situation_context: brief context description",
            "",
            'Return JSON with a "listening" object.',
        ])

    def _extract_kanji_from_content(self, content: dict) -> list[str]:
        """Extract unique kanji characters from generated content."""
        kanji_set: set[str] = set()
        kanji_pattern = re.compile(r"[\u4e00-\u9faf]")

        # Extract from vocabulary
        if "vocabulary" in content:
            for vocab in content["vocabulary"]:
                matches = kanji_pattern.findall(vocab.word)
                kanji_set.update(matches)

        # Extract from reading
        if "reading" in content:
            matches = kanji_pattern.findall(content["reading"].content)
            kanji_set.update(matches)

        # Extract from listening
        if "listening" in content:
            matches = kanji_pattern.findall(content["listening"].transcript)
            kanji_set.update(matches)

        return list(kanji_set)
