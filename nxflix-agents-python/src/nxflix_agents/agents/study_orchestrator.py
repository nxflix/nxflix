"""Study Orchestrator Agent - Manages personalized study recommendations and sessions."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel

from nxflix_agents.models import (
    GrammarPoint,
    UserProgress,
    StudySession,
    SessionResult,
    StudyRecommendation,
    RecommendationRequest,
    SessionRequest,
)
from nxflix_agents.providers import LLMProvider
from nxflix_agents.services import SM2Service, GrammarService
from nxflix_agents.tracing.setup import track


class RecommendationResponse(BaseModel):
    """LLM response for study recommendations."""

    grammar_ids: list[str]
    reason: str
    focus_areas: list[str]
    suggested_question_types: list[str]


class StudyOrchestratorAgent:
    """Agent responsible for orchestrating study sessions and recommendations."""

    def __init__(
        self,
        grammar_service: GrammarService,
        sm2_service: SM2Service | None = None,
        llm_provider: LLMProvider | None = None,
    ):
        self.grammar_service = grammar_service
        self.sm2_service = sm2_service or SM2Service()
        self.llm = llm_provider or LLMProvider()
        self._sessions: dict[str, StudySession] = {}

    @track("study_orchestrator.get_recommendations")
    async def get_recommendations(
        self,
        request: RecommendationRequest,
        user_progress: list[UserProgress],
    ) -> StudyRecommendation:
        """Get personalized study recommendations based on user progress.

        Args:
            request: Recommendation request with user preferences
            user_progress: User's current progress on grammar points

        Returns:
            Personalized study recommendation
        """
        # Get due items
        due_items = self.sm2_service.get_due_items(user_progress, limit=request.max_items)

        # Build context for LLM
        available_grammar = self.grammar_service.get_grammar_points_by_ids(
            request.available_grammar_ids
        )

        progress_summary = self._build_progress_summary(user_progress)
        due_summary = self._build_due_summary(due_items)
        grammar_summary = self._build_grammar_summary(available_grammar[:20])

        prompt = f"""You are a JLPT N1 study advisor. Based on the student's progress, recommend grammar points to study.

## Student Progress Summary
{progress_summary}

## Items Due for Review
{due_summary}

## Available Grammar Points (sample)
{grammar_summary}

## Request
- Maximum items: {request.max_items}
- Focus on weak areas: {request.focus_weak_areas}
- Include new items: {request.include_new}
- Time available: {request.time_available_minutes or 'unlimited'} minutes

Select the most appropriate grammar points to study and explain why. Consider:
1. Items that are due for review (highest priority)
2. Items with low mastery levels
3. A mix of review and new content
4. Related grammar patterns that reinforce each other

Respond with a JSON object containing:
- grammar_ids: list of grammar IDs to study (up to {request.max_items})
- reason: brief explanation of your recommendation
- focus_areas: specific areas the student should focus on
- suggested_question_types: recommended question types for practice"""

        response = await self.llm.complete_json(
            messages=[{"role": "user", "content": prompt}],
            response_model=RecommendationResponse,
        )

        # Validate recommended grammar IDs exist
        valid_ids = [
            gid for gid in response.grammar_ids
            if self.grammar_service.get_grammar_point(gid) is not None
        ]

        # Fall back to due items if LLM recommendations are invalid
        if not valid_ids and due_items:
            valid_ids = [p.grammar_id for p in due_items[:request.max_items]]

        return StudyRecommendation(
            grammar_ids=valid_ids,
            reason=response.reason,
            priority=1 if due_items else 2,
            estimated_time_minutes=len(valid_ids) * 3,
            focus_areas=response.focus_areas,
            suggested_question_types=response.suggested_question_types,
        )

    @track("study_orchestrator.start_session")
    async def start_session(self, request: SessionRequest) -> StudySession:
        """Start a new study session.

        Args:
            request: Session request with grammar IDs and settings

        Returns:
            New study session
        """
        session_id = str(uuid.uuid4())

        session = StudySession(
            id=session_id,
            user_id=request.user_id,
            grammar_ids=request.grammar_ids,
            started_at=datetime.utcnow(),
            results=[],
            total_questions=request.question_count,
            total_correct=0,
        )

        self._sessions[session_id] = session
        return session

    @track("study_orchestrator.complete_session")
    async def complete_session(
        self,
        session_id: str,
        results: list[SessionResult],
        user_progress: dict[str, UserProgress],
    ) -> tuple[StudySession, dict[str, UserProgress]]:
        """Complete a study session and update user progress.

        Args:
            session_id: ID of the session to complete
            results: Results for each grammar point studied
            user_progress: Current progress for each grammar point

        Returns:
            Tuple of (completed session, updated progress)
        """
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")

        # Update session with results
        session.results = results
        session.completed_at = datetime.utcnow()
        session.total_correct = sum(r.correct_answers for r in results)
        session.total_questions = sum(r.questions_asked for r in results)

        # Update user progress using SM-2
        updated_progress = {}
        for result in results:
            if result.grammar_id in user_progress:
                progress = user_progress[result.grammar_id]
                quality = self.sm2_service.quality_from_score(
                    result.score, max_score=5.0
                )
                updated_progress[result.grammar_id] = self.sm2_service.update_progress(
                    progress, quality
                )

        return session, updated_progress

    def get_session(self, session_id: str) -> StudySession | None:
        """Get a session by ID."""
        return self._sessions.get(session_id)

    def _build_progress_summary(self, progress: list[UserProgress]) -> str:
        """Build a text summary of user progress."""
        if not progress:
            return "No previous study history."

        total = len(progress)
        studied = sum(1 for p in progress if p.times_studied > 0)
        avg_mastery = sum(p.mastery_level for p in progress) / total if total else 0

        weak_items = [p for p in progress if p.mastery_level < 3 and p.times_studied > 0]

        summary = f"""- Total grammar points: {total}
- Previously studied: {studied}
- Average mastery level: {avg_mastery:.1f}/5
- Items needing review: {len(weak_items)}"""

        if weak_items:
            weak_ids = [p.grammar_id for p in weak_items[:5]]
            summary += f"\n- Weakest items: {', '.join(weak_ids)}"

        return summary

    def _build_due_summary(self, due_items: list[UserProgress]) -> str:
        """Build a text summary of items due for review."""
        if not due_items:
            return "No items currently due for review."

        return f"""- {len(due_items)} items due for review
- Item IDs: {', '.join(p.grammar_id for p in due_items[:10])}"""

    def _build_grammar_summary(self, grammar: list[GrammarPoint]) -> str:
        """Build a text summary of available grammar points."""
        if not grammar:
            return "No grammar points available."

        lines = []
        for g in grammar[:10]:
            lines.append(f"- {g.id}: {g.pattern} ({g.meaning})")

        return "\n".join(lines)
