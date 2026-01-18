"""User progress API routes."""

from fastapi import APIRouter
from pydantic import BaseModel

from nxflix_agents.models import UserProgress
from nxflix_agents.services import SM2Service

router = APIRouter(prefix="/api/progress", tags=["progress"])

# In-memory storage (shared with study router in real app)
_user_progress: dict[str, dict[str, UserProgress]] = {}
_sm2_service = SM2Service()


class StatsResponse(BaseModel):
    """User statistics response."""

    total_grammar_points: int
    studied_count: int
    mastered_count: int
    average_mastery: float
    total_study_time_minutes: int
    current_streak: int
    longest_streak: int


class DueItemsResponse(BaseModel):
    """Items due for review response."""

    due_count: int
    items: list[UserProgress]


@router.get("/{user_id}/stats", response_model=StatsResponse)
async def get_user_stats(user_id: str):
    """Get user study statistics."""
    progress_dict = _user_progress.get(user_id, {})
    progress_list = list(progress_dict.values())

    total = len(progress_list)
    studied = sum(1 for p in progress_list if p.times_studied > 0)
    mastered = sum(1 for p in progress_list if p.mastery_level >= 4)
    avg_mastery = sum(p.mastery_level for p in progress_list) / total if total else 0.0

    return StatsResponse(
        total_grammar_points=total,
        studied_count=studied,
        mastered_count=mastered,
        average_mastery=avg_mastery,
        total_study_time_minutes=studied * 5,  # Estimate
        current_streak=0,  # Would come from streaks table
        longest_streak=0,
    )


@router.get("/{user_id}/due", response_model=DueItemsResponse)
async def get_due_items(user_id: str, limit: int = 20):
    """Get items due for review."""
    progress_dict = _user_progress.get(user_id, {})
    progress_list = list(progress_dict.values())

    due_items = _sm2_service.get_due_items(progress_list, limit=limit)

    return DueItemsResponse(
        due_count=len(due_items),
        items=due_items,
    )


@router.get("/{user_id}/grammar/{grammar_id}", response_model=UserProgress)
async def get_grammar_progress(user_id: str, grammar_id: str):
    """Get progress for a specific grammar point."""
    progress_dict = _user_progress.get(user_id, {})
    progress = progress_dict.get(grammar_id)

    if not progress:
        # Return empty progress for new grammar
        return UserProgress(user_id=user_id, grammar_id=grammar_id)

    return progress
