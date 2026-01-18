"""Study session API routes."""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from nxflix_agents.models import (
    RecommendationRequest,
    SessionRequest,
    SessionCompleteRequest,
    StudyRecommendation,
    StudySession,
    SessionResult,
    UserProgress,
)
from nxflix_agents.agents import StudyOrchestratorAgent
from nxflix_agents.services import GrammarService, SM2Service

router = APIRouter(prefix="/api/study", tags=["study"])

# In-memory storage for demo (replace with database)
_user_progress: dict[str, dict[str, UserProgress]] = {}

# Singleton services (would be injected in production)
_grammar_service = GrammarService()
_sm2_service = SM2Service()
_study_agent = StudyOrchestratorAgent(_grammar_service, _sm2_service)


def get_study_agent() -> StudyOrchestratorAgent:
    """Dependency to get the study orchestrator agent."""
    return _study_agent


def get_user_progress(user_id: str) -> list[UserProgress]:
    """Get user progress for all grammar points."""
    return list(_user_progress.get(user_id, {}).values())


class RecommendationsResponse(BaseModel):
    """Response for study recommendations."""

    recommendation: StudyRecommendation


class SessionResponse(BaseModel):
    """Response for session operations."""

    session: StudySession


class SessionCompleteResponse(BaseModel):
    """Response for completing a session."""

    session: StudySession
    updated_grammar_ids: list[str]


@router.post("/recommendations", response_model=RecommendationsResponse)
async def get_recommendations(
    request: RecommendationRequest,
    agent: StudyOrchestratorAgent = Depends(get_study_agent),
):
    """Get personalized study recommendations."""
    user_progress = get_user_progress(request.user_id)

    recommendation = await agent.get_recommendations(request, user_progress)

    return RecommendationsResponse(recommendation=recommendation)


@router.post("/sessions", response_model=SessionResponse)
async def start_session(
    request: SessionRequest,
    agent: StudyOrchestratorAgent = Depends(get_study_agent),
):
    """Start a new study session."""
    session = await agent.start_session(request)
    return SessionResponse(session=session)


@router.put("/sessions/{session_id}/complete", response_model=SessionCompleteResponse)
async def complete_session(
    session_id: str,
    request: SessionCompleteRequest,
    agent: StudyOrchestratorAgent = Depends(get_study_agent),
):
    """Complete a study session and update progress."""
    # Parse results
    results = [
        SessionResult(
            grammar_id=r.get("grammar_id", ""),
            questions_asked=r.get("questions_asked", 0),
            correct_answers=r.get("correct_answers", 0),
            score=r.get("score", 0.0),
        )
        for r in request.results
    ]

    # Get current user progress
    session = agent.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    user_id = session.user_id
    user_progress_dict = _user_progress.get(user_id, {})

    # Create progress entries for new grammar points
    for result in results:
        if result.grammar_id not in user_progress_dict:
            user_progress_dict[result.grammar_id] = UserProgress(
                user_id=user_id,
                grammar_id=result.grammar_id,
            )

    # Complete the session
    completed_session, updated_progress = await agent.complete_session(
        session_id, results, user_progress_dict
    )

    # Update stored progress
    if user_id not in _user_progress:
        _user_progress[user_id] = {}
    _user_progress[user_id].update(updated_progress)

    return SessionCompleteResponse(
        session=completed_session,
        updated_grammar_ids=list(updated_progress.keys()),
    )


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    agent: StudyOrchestratorAgent = Depends(get_study_agent),
):
    """Get a study session by ID."""
    session = agent.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionResponse(session=session)
