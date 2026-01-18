"""User progress API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from nxflix_agents.models import UserProgress, ContentType
from nxflix_agents.state import (
    user_progress as _user_progress,
    sm2_service as _sm2_service,
    get_user_progress_by_type,
    get_user_progress,
)

router = APIRouter(prefix="/api/progress", tags=["progress"])


class StatsResponse(BaseModel):
    """User statistics response."""

    total_items: int
    studied_count: int
    mastered_count: int
    average_mastery: float
    total_study_time_minutes: int
    by_content_type: dict[str, int]
    current_streak: int
    longest_streak: int


class DueItemsResponse(BaseModel):
    """Items due for review response."""

    due_count: int
    items: list[UserProgress]


@router.get("/{user_id}/stats", response_model=StatsResponse)
async def get_user_stats(user_id: str, content_type: str | None = None):
    """Get user study statistics."""
    progress_dict = _user_progress.get(user_id, {})
    progress_list = list(progress_dict.values())

    # Filter by content type if specified
    if content_type:
        try:
            ct = ContentType(content_type)
            progress_list = [p for p in progress_list if p.content_type == ct]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid content type")

    total = len(progress_list)
    studied = sum(1 for p in progress_list if p.times_studied > 0)
    mastered = sum(1 for p in progress_list if p.mastery_level >= 4)
    avg_mastery = sum(p.mastery_level for p in progress_list) / total if total else 0.0

    # Group by content type
    by_content_type: dict[str, int] = {}
    for p in progress_list:
        ct_val = p.content_type.value if hasattr(p.content_type, "value") else str(p.content_type)
        by_content_type[ct_val] = by_content_type.get(ct_val, 0) + 1

    return StatsResponse(
        total_items=total,
        studied_count=studied,
        mastered_count=mastered,
        average_mastery=avg_mastery,
        total_study_time_minutes=studied * 5,
        by_content_type=by_content_type,
        current_streak=0,
        longest_streak=0,
    )


@router.get("/{user_id}/due", response_model=DueItemsResponse)
async def get_due_items(user_id: str, limit: int = 20, content_type: str | None = None):
    """Get items due for review."""
    if content_type:
        try:
            ct = ContentType(content_type)
            progress_list = get_user_progress_by_type(user_id, ct)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid content type")
    else:
        progress_dict = _user_progress.get(user_id, {})
        progress_list = list(progress_dict.values())

    due_items = _sm2_service.get_due_items(progress_list, limit=limit)

    return DueItemsResponse(
        due_count=len(due_items),
        items=due_items,
    )


@router.get("/{user_id}/item/{content_type}/{item_id}", response_model=UserProgress)
async def get_item_progress(user_id: str, content_type: str, item_id: str):
    """Get progress for a specific item."""
    try:
        ct = ContentType(content_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid content type")

    progress = get_user_progress(user_id, item_id, ct)

    if not progress:
        return UserProgress(user_id=user_id, item_id=item_id, content_type=ct)

    return progress


# Backward compatibility
@router.get("/{user_id}/grammar/{grammar_id}", response_model=UserProgress)
async def get_grammar_progress(user_id: str, grammar_id: str):
    """Get progress for a specific grammar point (backward compatible)."""
    progress = get_user_progress(user_id, grammar_id, ContentType.GRAMMAR)

    if not progress:
        return UserProgress(user_id=user_id, item_id=grammar_id, content_type=ContentType.GRAMMAR)

    return progress
