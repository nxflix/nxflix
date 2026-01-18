"""Knowledge Assessor Agent - Generates quizzes and grades answers."""

import uuid
from typing import Any

from pydantic import BaseModel

from nxflix_agents.models import (
    GrammarPoint,
    Quiz,
    QuizQuestion,
    QuestionType,
    QuizAnswer,
    GradedAnswer,
)
from nxflix_agents.providers import LLMProvider
from nxflix_agents.services import GrammarService
from nxflix_agents.tracing.setup import track


class GeneratedQuestions(BaseModel):
    """LLM response for quiz generation."""

    questions: list[dict[str, Any]]


class GradingResult(BaseModel):
    """LLM response for answer grading."""

    is_correct: bool
    score: float
    feedback: str
    grammar_explanation: str | None = None


class MistakeExplanation(BaseModel):
    """LLM response for mistake explanation."""

    explanation: str
    correct_usage: str
    common_mistakes: list[str]
    practice_suggestions: list[str]


class KnowledgeAssessorAgent:
    """Agent responsible for generating quizzes and grading answers."""

    def __init__(
        self,
        grammar_service: GrammarService,
        llm_provider: LLMProvider | None = None,
    ):
        self.grammar_service = grammar_service
        self.llm = llm_provider or LLMProvider()
        self._quizzes: dict[str, Quiz] = {}

    @track("knowledge_assessor.generate_quiz")
    async def generate_quiz(
        self,
        user_id: str,
        grammar_ids: list[str],
        question_count: int = 10,
        question_types: list[QuestionType] | None = None,
        difficulty: int = 3,
    ) -> Quiz:
        """Generate a quiz for the given grammar points.

        Args:
            user_id: User ID for the quiz
            grammar_ids: Grammar point IDs to include
            question_count: Number of questions to generate
            question_types: Types of questions to include
            difficulty: Target difficulty (1-5)

        Returns:
            Generated quiz
        """
        grammar_points = self.grammar_service.get_grammar_points_by_ids(grammar_ids)
        if not grammar_points:
            raise ValueError("No valid grammar points found")

        if question_types is None:
            question_types = [QuestionType.MULTIPLE_CHOICE, QuestionType.FILL_IN_BLANK]

        grammar_info = self._format_grammar_for_prompt(grammar_points)
        types_str = ", ".join(t.value for t in question_types)

        prompt = f"""You are a JLPT N1 exam question creator. Generate {question_count} quiz questions for these grammar patterns:

{grammar_info}

## Requirements
- Question types to use: {types_str}
- Target difficulty: {difficulty}/5
- Questions should test understanding, not just memorization
- Include context-appropriate example sentences
- For multiple choice, provide 4 plausible options

## Question Type Guidelines
- multiple_choice: Provide 4 options with one correct answer
- fill_in_blank: Create a sentence with a blank for the grammar pattern
- translation: Provide a Japanese sentence to translate to English
- sentence_construction: Give words/phrases to construct a sentence using the grammar
- error_correction: Present a sentence with an error to identify and fix

Generate a JSON object with a "questions" array. Each question should have:
- id: unique identifier (e.g., "q1", "q2")
- grammar_id: the grammar pattern being tested
- question_type: one of {types_str}
- question_text: the question in English
- question_text_jp: the question in Japanese (if applicable)
- options: array of 4 choices (for multiple_choice only)
- correct_answer: the correct answer
- explanation: why this is correct
- difficulty: 1-5 rating
- hints: array of helpful hints (optional)"""

        response = await self.llm.complete_json(
            messages=[{"role": "user", "content": prompt}],
            response_model=GeneratedQuestions,
        )

        # Parse questions
        questions = []
        for i, q_data in enumerate(response.questions[:question_count]):
            try:
                question = QuizQuestion(
                    id=q_data.get("id", f"q{i+1}"),
                    grammar_id=q_data.get("grammar_id", grammar_ids[0]),
                    question_type=QuestionType(q_data.get("question_type", "multiple_choice")),
                    question_text=q_data.get("question_text", ""),
                    question_text_jp=q_data.get("question_text_jp"),
                    options=q_data.get("options"),
                    correct_answer=q_data.get("correct_answer", ""),
                    explanation=q_data.get("explanation", ""),
                    difficulty=q_data.get("difficulty", difficulty),
                    hints=q_data.get("hints", []),
                )
                questions.append(question)
            except Exception:
                continue

        quiz_id = str(uuid.uuid4())
        quiz = Quiz(
            id=quiz_id,
            user_id=user_id,
            grammar_ids=grammar_ids,
            questions=questions,
            difficulty=difficulty,
        )

        self._quizzes[quiz_id] = quiz
        return quiz

    @track("knowledge_assessor.grade_answer")
    async def grade_answer(
        self,
        question: QuizQuestion,
        user_answer: str,
    ) -> GradedAnswer:
        """Grade a user's answer to a quiz question.

        Args:
            question: The quiz question
            user_answer: User's answer

        Returns:
            Graded answer with feedback
        """
        grammar = self.grammar_service.get_grammar_point(question.grammar_id)
        grammar_info = f"Pattern: {grammar.pattern}\nMeaning: {grammar.meaning}" if grammar else ""

        prompt = f"""You are a JLPT N1 exam grader. Grade this answer:

## Question
Type: {question.question_type.value}
Question: {question.question_text}
{f'Japanese: {question.question_text_jp}' if question.question_text_jp else ''}
Correct Answer: {question.correct_answer}

## Grammar Being Tested
{grammar_info}

## User's Answer
{user_answer}

Grade the answer and provide:
1. is_correct: true if the answer is correct or acceptably close
2. score: 0.0 to 1.0 (allow partial credit for partially correct answers)
3. feedback: brief, encouraging feedback
4. grammar_explanation: explain the grammar point if the answer was wrong

Be fair in grading - accept reasonable alternative answers that demonstrate understanding."""

        response = await self.llm.complete_json(
            messages=[{"role": "user", "content": prompt}],
            response_model=GradingResult,
        )

        return GradedAnswer(
            question_id=question.id,
            user_answer=user_answer,
            correct_answer=question.correct_answer,
            is_correct=response.is_correct,
            score=response.score,
            feedback=response.feedback,
            grammar_explanation=response.grammar_explanation,
        )

    @track("knowledge_assessor.explain_mistake")
    async def explain_mistake(
        self,
        grammar_id: str,
        user_answer: str,
        correct_answer: str,
    ) -> dict[str, Any]:
        """Provide a detailed explanation of a mistake.

        Args:
            grammar_id: ID of the grammar point
            user_answer: User's incorrect answer
            correct_answer: The correct answer

        Returns:
            Detailed explanation with suggestions
        """
        grammar = self.grammar_service.get_grammar_point(grammar_id)
        if not grammar:
            raise ValueError(f"Grammar point not found: {grammar_id}")

        prompt = f"""You are a JLPT N1 tutor helping a student understand their mistake.

## Grammar Point
Pattern: {grammar.pattern}
Meaning: {grammar.meaning}
Example: {grammar.example}
Translation: {grammar.example_translation}

## The Mistake
User's answer: {user_answer}
Correct answer: {correct_answer}

Provide a helpful explanation including:
1. explanation: Why the user's answer was incorrect
2. correct_usage: How to correctly use this grammar pattern
3. common_mistakes: List of common mistakes students make with this pattern
4. practice_suggestions: Specific practice recommendations

Be encouraging and focus on learning, not criticism."""

        response = await self.llm.complete_json(
            messages=[{"role": "user", "content": prompt}],
            response_model=MistakeExplanation,
        )

        return {
            "grammar_id": grammar_id,
            "grammar_pattern": grammar.pattern,
            "user_answer": user_answer,
            "correct_answer": correct_answer,
            "explanation": response.explanation,
            "correct_usage": response.correct_usage,
            "common_mistakes": response.common_mistakes,
            "practice_suggestions": response.practice_suggestions,
        }

    def get_quiz(self, quiz_id: str) -> Quiz | None:
        """Get a quiz by ID."""
        return self._quizzes.get(quiz_id)

    def _format_grammar_for_prompt(self, grammar_points: list[GrammarPoint]) -> str:
        """Format grammar points for LLM prompt."""
        lines = []
        for g in grammar_points:
            lines.append(f"""### {g.pattern}
- ID: {g.id}
- Meaning: {g.meaning}
- Category: {g.category.value}
- Example: {g.example}
- Translation: {g.example_translation}
""")
        return "\n".join(lines)
