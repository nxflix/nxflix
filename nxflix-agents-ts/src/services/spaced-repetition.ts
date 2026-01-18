/**
 * SM-2 Spaced Repetition Algorithm implementation.
 *
 * The SM-2 algorithm was created by Piotr Wozniak and is widely used in
 * spaced repetition software. This implementation follows the original
 * algorithm with minor modifications for our use case.
 *
 * Quality ratings (0-5):
 * - 0: Complete blackout, no recall
 * - 1: Incorrect, but remembered upon seeing answer
 * - 2: Incorrect, but easy recall of answer
 * - 3: Correct with serious difficulty
 * - 4: Correct with some hesitation
 * - 5: Perfect response
 */

import type { UserProgress, SM2Data } from '../models/progress.js';

export interface SM2Result {
  easeFactor: number;
  interval: number; // Days
  repetitions: number;
  nextReviewDate: Date;
}

export function calculateNextReview(
  quality: number,
  currentEaseFactor: number = 2.5,
  currentInterval: number = 0,
  currentRepetitions: number = 0
): SM2Result {
  // Clamp quality to valid range
  quality = Math.max(0, Math.min(5, quality));

  let newRepetitions: number;
  let newInterval: number;

  // If quality < 3, restart repetitions (failed recall)
  if (quality < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions = currentRepetitions + 1;

    // Calculate new interval
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * currentEaseFactor);
    }
  }

  // Calculate new ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  let newEaseFactor =
    currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ease factor must be at least 1.3
  newEaseFactor = Math.max(1.3, newEaseFactor);

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate,
  };
}

export function qualityFromScore(score: number, maxScore: number = 1.0): number {
  if (maxScore <= 0) return 0;

  const percentage = (score / maxScore) * 100;

  if (percentage >= 95) return 5;
  if (percentage >= 80) return 4;
  if (percentage >= 60) return 3;
  if (percentage >= 40) return 2;
  if (percentage >= 20) return 1;
  return 0;
}

function calculateMastery(progress: UserProgress): number {
  if (progress.timesStudied === 0) return 0;

  const accuracy =
    progress.timesStudied > 0
      ? (progress.timesCorrect / progress.timesStudied) * 100
      : 0;
  const repetitions = progress.sm2Data.repetitions;

  if (repetitions >= 5 && accuracy >= 90) return 5;
  if (repetitions >= 4 && accuracy >= 80) return 4;
  if (repetitions >= 3 && accuracy >= 70) return 3;
  if (repetitions >= 2 && accuracy >= 60) return 2;
  if (repetitions >= 1) return 1;
  return 0;
}

export class SM2Service {
  updateProgress(progress: UserProgress, quality: number): UserProgress {
    const result = calculateNextReview(
      quality,
      progress.sm2Data.easeFactor,
      progress.sm2Data.interval,
      progress.sm2Data.repetitions
    );

    const now = new Date().toISOString();

    // Update SM2 data
    const newSm2Data: SM2Data = {
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      nextReviewDate: result.nextReviewDate.toISOString(),
      lastReviewDate: now,
    };

    // Update study stats
    const newProgress: UserProgress = {
      ...progress,
      sm2Data: newSm2Data,
      timesStudied: progress.timesStudied + 1,
      timesCorrect: quality >= 3 ? progress.timesCorrect + 1 : progress.timesCorrect,
      lastScore: quality,
      updatedAt: now,
    };

    // Update mastery level
    newProgress.masteryLevel = calculateMastery(newProgress);

    return newProgress;
  }

  getDueItems(progressList: UserProgress[], limit?: number): UserProgress[] {
    const now = new Date();
    const due: UserProgress[] = [];

    for (const progress of progressList) {
      // New items (never studied) are always due
      if (!progress.sm2Data.nextReviewDate) {
        due.push(progress);
      } else {
        // Items past their review date are due
        const nextReview = new Date(progress.sm2Data.nextReviewDate);
        if (nextReview <= now) {
          due.push(progress);
        }
      }
    }

    // Sort by next review date (oldest first), then by mastery (lowest first)
    due.sort((a, b) => {
      const dateA = a.sm2Data.nextReviewDate
        ? new Date(a.sm2Data.nextReviewDate).getTime()
        : 0;
      const dateB = b.sm2Data.nextReviewDate
        ? new Date(b.sm2Data.nextReviewDate).getTime()
        : 0;

      if (dateA !== dateB) return dateA - dateB;
      return a.masteryLevel - b.masteryLevel;
    });

    return limit ? due.slice(0, limit) : due;
  }
}
