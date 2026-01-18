import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { userProgress, sm2Service, getUserProgressByType, getUserProgress, makeProgressKey } from '../state.js';
import type { UserProgress } from '../models/progress.js';
import { ContentType } from '../models/content-type.js';

const progressRouter = Router();

// GET /api/progress/:userId/stats
progressRouter.get('/:userId/stats', (req: Request<{ userId: string }>, res: Response) => {
  const userId = req.params.userId;
  const contentType = req.query.contentType as ContentType | undefined;

  const progressDict = userProgress[userId] ?? {};
  let progressList = Object.values(progressDict) as UserProgress[];

  // Filter by content type if specified
  if (contentType) {
    progressList = progressList.filter((p) => p.contentType === contentType);
  }

  const total = progressList.length;
  const studied = progressList.filter((p) => p.timesStudied > 0).length;
  const mastered = progressList.filter((p) => p.masteryLevel >= 4).length;
  const avgMastery = total > 0
    ? progressList.reduce((sum, p) => sum + p.masteryLevel, 0) / total
    : 0;

  // Group by content type
  const byContentType: Record<string, number> = {};
  for (const p of progressList) {
    byContentType[p.contentType] = (byContentType[p.contentType] || 0) + 1;
  }

  res.json({
    totalItems: total,
    studiedCount: studied,
    masteredCount: mastered,
    averageMastery: avgMastery,
    totalStudyTimeMinutes: studied * 5,
    byContentType,
    currentStreak: 0,
    longestStreak: 0,
  });
});

// GET /api/progress/:userId/due
progressRouter.get('/:userId/due', (req: Request<{ userId: string }>, res: Response) => {
  const userId = req.params.userId;
  const limit = parseInt(req.query.limit as string) || 20;
  const contentType = req.query.contentType as ContentType | undefined;

  let progressList: UserProgress[];

  if (contentType) {
    progressList = getUserProgressByType(userId, contentType);
  } else {
    const progressDict = userProgress[userId] ?? {};
    progressList = Object.values(progressDict) as UserProgress[];
  }

  const dueItems = sm2Service.getDueItems(progressList, limit);

  res.json({
    dueCount: dueItems.length,
    items: dueItems,
  });
});

// GET /api/progress/:userId/item/:contentType/:itemId
progressRouter.get('/:userId/item/:contentType/:itemId', (req: Request<{ userId: string; contentType: string; itemId: string }>, res: Response) => {
  const { userId, contentType: ct, itemId } = req.params;

  // Validate content type
  const parseResult = ContentType.safeParse(ct);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid content type' });
    return;
  }
  const contentType = parseResult.data;

  const progress = getUserProgress(userId, itemId, contentType);

  if (!progress) {
    // Return empty progress for new item
    res.json({
      userId,
      itemId,
      contentType,
      sm2Data: { easeFactor: 2.5, interval: 0, repetitions: 0 },
      timesStudied: 0,
      timesCorrect: 0,
      lastScore: null,
      masteryLevel: 0,
    });
    return;
  }

  res.json(progress);
});

// Backward compatibility: GET /api/progress/:userId/grammar/:grammarId
progressRouter.get('/:userId/grammar/:grammarId', (req: Request<{ userId: string; grammarId: string }>, res: Response) => {
  const { userId, grammarId } = req.params;

  const progress = getUserProgress(userId, grammarId, 'grammar');

  if (!progress) {
    res.json({
      userId,
      itemId: grammarId,
      contentType: 'grammar',
      sm2Data: { easeFactor: 2.5, interval: 0, repetitions: 0 },
      timesStudied: 0,
      timesCorrect: 0,
      lastScore: null,
      masteryLevel: 0,
    });
    return;
  }

  res.json(progress);
});

export { progressRouter };
