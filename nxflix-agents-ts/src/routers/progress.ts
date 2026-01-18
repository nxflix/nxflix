import { Router, Request, Response } from 'express';
import { SM2Service } from '../services/spaced-repetition.js';
import type { UserProgress } from '../models/progress.js';

const progressRouter = Router();

// In-memory storage (shared with study router in real app)
const userProgress: Record<string, Record<string, UserProgress>> = {};
const sm2Service = new SM2Service();

// GET /api/progress/:userId/stats
progressRouter.get('/:userId/stats', (req: Request, res: Response) => {
  const userId = req.params.userId;
  const progressDict = userProgress[userId] ?? {};
  const progressList = Object.values(progressDict);

  const total = progressList.length;
  const studied = progressList.filter(p => p.timesStudied > 0).length;
  const mastered = progressList.filter(p => p.masteryLevel >= 4).length;
  const avgMastery = total > 0
    ? progressList.reduce((sum, p) => sum + p.masteryLevel, 0) / total
    : 0;

  res.json({
    totalGrammarPoints: total,
    studiedCount: studied,
    masteredCount: mastered,
    averageMastery: avgMastery,
    totalStudyTimeMinutes: studied * 5, // Estimate
    currentStreak: 0, // Would come from streaks table
    longestStreak: 0,
  });
});

// GET /api/progress/:userId/due
progressRouter.get('/:userId/due', (req: Request, res: Response) => {
  const userId = req.params.userId;
  const limit = parseInt(req.query.limit as string) || 20;

  const progressDict = userProgress[userId] ?? {};
  const progressList = Object.values(progressDict);

  const dueItems = sm2Service.getDueItems(progressList, limit);

  res.json({
    dueCount: dueItems.length,
    items: dueItems,
  });
});

// GET /api/progress/:userId/grammar/:grammarId
progressRouter.get('/:userId/grammar/:grammarId', (req: Request, res: Response) => {
  const { userId, grammarId } = req.params;
  const progressDict = userProgress[userId] ?? {};
  const progress = progressDict[grammarId];

  if (!progress) {
    // Return empty progress for new grammar
    return res.json({
      userId,
      grammarId,
      sm2Data: { easeFactor: 2.5, interval: 0, repetitions: 0 },
      timesStudied: 0,
      timesCorrect: 0,
      lastScore: null,
      masteryLevel: 0,
    });
  }

  res.json(progress);
});

export { progressRouter };
