"""SM-2 Spaced Repetition Algorithm implementation.

The SM-2 algorithm was created by Piotr Wozniak and is widely used in
spaced repetition software. This implementation follows the original
algorithm with minor modifications for our use case.

Quality ratings (0-5):
- 0: Complete blackout, no recall
- 1: Incorrect, but remembered upon seeing answer
- 2: Incorrect, but easy recall of answer
- 3: Correct with serious difficulty
- 4: Correct with some hesitation
- 5: Perfect response
"""

from dataclasses import dataclass
from datetime import datetime, timedelta

from nxflix_agents.models import SM2Data, UserProgress


@dataclass
class SM2Result:
    """Result of SM-2 calculation."""

    ease_factor: float
    interval: int  # Days
    repetitions: int
    next_review_date: datetime


def calculate_next_review(
    quality: int,
    current_ease_factor: float = 2.5,
    current_interval: int = 0,
    current_repetitions: int = 0,
) -> SM2Result:
    """Calculate next review parameters using SM-2 algorithm.

    Args:
        quality: User's quality rating (0-5)
        current_ease_factor: Current ease factor (>= 1.3)
        current_interval: Current interval in days
        current_repetitions: Current number of successful repetitions

    Returns:
        SM2Result with new parameters
    """
    # Clamp quality to valid range
    quality = max(0, min(5, quality))

    # If quality < 3, restart repetitions (failed recall)
    if quality < 3:
        new_repetitions = 0
        new_interval = 1
    else:
        new_repetitions = current_repetitions + 1

        # Calculate new interval
        if new_repetitions == 1:
            new_interval = 1
        elif new_repetitions == 2:
            new_interval = 6
        else:
            new_interval = round(current_interval * current_ease_factor)

    # Calculate new ease factor
    # EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    new_ease_factor = current_ease_factor + (
        0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    )

    # Ease factor must be at least 1.3
    new_ease_factor = max(1.3, new_ease_factor)

    # Calculate next review date
    next_review = datetime.utcnow() + timedelta(days=new_interval)

    return SM2Result(
        ease_factor=round(new_ease_factor, 2),
        interval=new_interval,
        repetitions=new_repetitions,
        next_review_date=next_review,
    )


class SM2Service:
    """Service for managing spaced repetition using SM-2 algorithm."""

    def update_progress(self, progress: UserProgress, quality: int) -> UserProgress:
        """Update user progress after a study session.

        Args:
            progress: Current user progress
            quality: Quality rating (0-5)

        Returns:
            Updated user progress
        """
        result = calculate_next_review(
            quality=quality,
            current_ease_factor=progress.sm2_data.ease_factor,
            current_interval=progress.sm2_data.interval,
            current_repetitions=progress.sm2_data.repetitions,
        )

        # Update SM2 data
        progress.sm2_data = SM2Data(
            ease_factor=result.ease_factor,
            interval=result.interval,
            repetitions=result.repetitions,
            next_review_date=result.next_review_date,
            last_review_date=datetime.utcnow(),
        )

        # Update study stats
        progress.times_studied += 1
        if quality >= 3:
            progress.times_correct += 1
        progress.last_score = quality
        progress.updated_at = datetime.utcnow()

        # Update mastery level based on repetitions and accuracy
        progress.mastery_level = self._calculate_mastery(progress)

        return progress

    def _calculate_mastery(self, progress: UserProgress) -> int:
        """Calculate mastery level (0-5) based on progress."""
        if progress.times_studied == 0:
            return 0

        accuracy = progress.accuracy
        repetitions = progress.sm2_data.repetitions

        # Mastery is based on both accuracy and successful repetitions
        if repetitions >= 5 and accuracy >= 90:
            return 5
        elif repetitions >= 4 and accuracy >= 80:
            return 4
        elif repetitions >= 3 and accuracy >= 70:
            return 3
        elif repetitions >= 2 and accuracy >= 60:
            return 2
        elif repetitions >= 1:
            return 1
        return 0

    def get_due_items(
        self,
        progress_list: list[UserProgress],
        limit: int | None = None,
    ) -> list[UserProgress]:
        """Get items due for review.

        Args:
            progress_list: List of user progress records
            limit: Maximum number of items to return

        Returns:
            List of progress records due for review
        """
        now = datetime.utcnow()
        due = []

        for progress in progress_list:
            # New items (never studied) are always due
            if progress.sm2_data.next_review_date is None:
                due.append(progress)
            # Items past their review date are due
            elif progress.sm2_data.next_review_date <= now:
                due.append(progress)

        # Sort by next review date (oldest first), then by mastery (lowest first)
        due.sort(
            key=lambda p: (
                p.sm2_data.next_review_date or datetime.min,
                p.mastery_level,
            )
        )

        if limit:
            return due[:limit]
        return due

    def quality_from_score(self, score: float, max_score: float = 1.0) -> int:
        """Convert a score to SM-2 quality rating.

        Args:
            score: User's score (e.g., 0.8 for 80%)
            max_score: Maximum possible score

        Returns:
            Quality rating (0-5)
        """
        if max_score <= 0:
            return 0

        percentage = (score / max_score) * 100

        if percentage >= 95:
            return 5
        elif percentage >= 80:
            return 4
        elif percentage >= 60:
            return 3
        elif percentage >= 40:
            return 2
        elif percentage >= 20:
            return 1
        return 0
