"""Quiz API routes."""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from nxflix_agents.models import (
    Quiz,
    QuizQuestion,
    QuestionType,
    QuizAnswer,
    GradedAnswer,
)
from nxflix_agents.agents import KnowledgeAssessorAgent
from nxflix_agents.state import grammar_service

router = APIRouter(prefix="/api/quiz", tags=["quiz"])

# Use shared grammar service from state
_quiz_agent = KnowledgeAssessorAgent(grammar_service)


def get_quiz_agent() -> KnowledgeAssessorAgent:
    """Dependency to get the knowledge assessor agent."""
    return _quiz_agent


class GenerateQuizRequest(BaseModel):
    """Request to generate a quiz."""

    user_id: str
    grammar_ids: list[str]
    question_count: int = Field(default=10, ge=1, le=50)
    question_types: list[str] = []
    difficulty: int = Field(default=3, ge=1, le=5)


class QuizResponse(BaseModel):
    """Response containing a quiz."""

    quiz: Quiz


class AnswerRequest(BaseModel):
    """Request to submit an answer."""

    user_answer: str


class GradedAnswerResponse(BaseModel):
    """Response for a graded answer."""

    result: GradedAnswer


class ExplainRequest(BaseModel):
    """Request for mistake explanation."""

    grammar_id: str
    user_answer: str
    correct_answer: str


class ExplanationResponse(BaseModel):
    """Response for mistake explanation."""

    grammar_id: str
    grammar_pattern: str
    user_answer: str
    correct_answer: str
    explanation: str
    correct_usage: str
    common_mistakes: list[str]
    practice_suggestions: list[str]


@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(
    request: GenerateQuizRequest,
    agent: KnowledgeAssessorAgent = Depends(get_quiz_agent),
):
    """Generate a new quiz."""
    # Parse question types
    question_types = None
    if request.question_types:
        try:
            question_types = [QuestionType(t) for t in request.question_types]
        except ValueError:
            pass

    quiz = await agent.generate_quiz(
        user_id=request.user_id,
        grammar_ids=request.grammar_ids,
        question_count=request.question_count,
        question_types=question_types,
        difficulty=request.difficulty,
    )

    return QuizResponse(quiz=quiz)


@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: str,
    agent: KnowledgeAssessorAgent = Depends(get_quiz_agent),
):
    """Get a quiz by ID."""
    quiz = agent.get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return QuizResponse(quiz=quiz)


@router.post("/{quiz_id}/answer/{question_id}", response_model=GradedAnswerResponse)
async def submit_answer(
    quiz_id: str,
    question_id: str,
    request: AnswerRequest,
    agent: KnowledgeAssessorAgent = Depends(get_quiz_agent),
):
    """Submit an answer for a single question."""
    quiz = agent.get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    question = next((q for q in quiz.questions if q.id == question_id), None)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    result = await agent.grade_answer(question, request.user_answer)

    return GradedAnswerResponse(result=result)


class SubmitAllRequest(BaseModel):
    """Request to submit all answers."""

    answers: list[QuizAnswer]


class SubmitAllResponse(BaseModel):
    """Response for all graded answers."""

    results: list[GradedAnswer]
    total_score: float
    correct_count: int
    total_count: int


@router.post("/{quiz_id}/submit", response_model=SubmitAllResponse)
async def submit_all_answers(
    quiz_id: str,
    request: SubmitAllRequest,
    agent: KnowledgeAssessorAgent = Depends(get_quiz_agent),
):
    """Submit all answers for a quiz."""
    quiz = agent.get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    results = []
    for answer in request.answers:
        question = next((q for q in quiz.questions if q.id == answer.question_id), None)
        if question:
            result = await agent.grade_answer(question, answer.user_answer)
            results.append(result)

    correct_count = sum(1 for r in results if r.is_correct)
    total_score = sum(r.score for r in results) / len(results) if results else 0.0

    return SubmitAllResponse(
        results=results,
        total_score=total_score,
        correct_count=correct_count,
        total_count=len(results),
    )


@router.post("/explain", response_model=ExplanationResponse)
async def explain_mistake(
    request: ExplainRequest,
    agent: KnowledgeAssessorAgent = Depends(get_quiz_agent),
):
    """Get detailed explanation of a mistake."""
    explanation = await agent.explain_mistake(
        grammar_id=request.grammar_id,
        user_answer=request.user_answer,
        correct_answer=request.correct_answer,
    )

    return ExplanationResponse(**explanation)
