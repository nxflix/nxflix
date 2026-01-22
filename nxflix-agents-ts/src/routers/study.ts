import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { StudyOrchestratorAgent } from '../agents/study-orchestrator.js';
import type { SessionResult, UserProgress } from '../models/progress.js';
import { userProgress, grammarService, sm2Service, getUserProgressList } from '../state.js';

const studyRouter = Router();

// Use shared services from state
const studyAgent = new StudyOrchestratorAgent(grammarService, sm2Service);

// Request schemas
const RecommendationRequestSchema = z.object({
  userId: z.string(),
  availableGrammarIds: z.array(z.string()).default([]),
  maxItems: z.number().int().min(1).max(20).default(5),
  focusWeakAreas: z.boolean().default(true),
  includeNew: z.boolean().default(true),
  timeAvailableMinutes: z.number().int().nullish(),
});

const SessionRequestSchema = z.object({
  userId: z.string(),
  grammarIds: z.array(z.string()),
  questionCount: z.number().int().min(1).max(50).default(10),
  questionTypes: z.array(z.string()).default([]),
  difficulty: z.number().int().min(1).max(5).nullish(),
});

const SessionCompleteRequestSchema = z.object({
  sessionId: z.string(),
  results: z.array(z.object({
    itemId: z.string(),
    contentType: z.enum(['grammar', 'vocabulary', 'reading', 'kanji', 'listening']).default('grammar'),
    questionsAsked: z.number().int(),
    correctAnswers: z.number().int(),
    score: z.number(),
  })),
});

// POST /api/study/recommendations
studyRouter.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const request = RecommendationRequestSchema.parse(req.body);
    const progress = getUserProgressList(request.userId);

    const recommendation = await studyAgent.getRecommendations(request, progress);

    res.json({ recommendation });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(400).json({ error: String(error) });
  }
});

// POST /api/study/sessions
studyRouter.post('/sessions', async (req: Request, res: Response) => {
  try {
    const request = SessionRequestSchema.parse(req.body);
    const session = await studyAgent.startSession(request);

    res.json({ session });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(400).json({ error: String(error) });
  }
});

// PUT /api/study/sessions/:id/complete
studyRouter.put('/sessions/:id/complete', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const sessionId = req.params.id;
    const { results } = SessionCompleteRequestSchema.parse({
      ...req.body,
      sessionId,
    });

    const session = studyAgent.getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const userId = session.userId;
    const userProgressDict: Record<string, UserProgress> = userProgress[userId] ?? {};

    // Create progress entries for new items
    for (const result of results) {
      const progressKey = `${result.contentType}:${result.itemId}`;
      if (!(progressKey in userProgressDict)) {
        userProgressDict[progressKey] = {
          userId,
          itemId: result.itemId,
          contentType: result.contentType,
          sm2Data: { easeFactor: 2.5, interval: 0, repetitions: 0 },
          timesStudied: 0,
          timesCorrect: 0,
          lastScore: null,
          masteryLevel: 0,
        };
      }
    }

    const sessionResults: SessionResult[] = results.map(r => ({
      itemId: r.itemId,
      contentType: r.contentType,
      questionsAsked: r.questionsAsked,
      correctAnswers: r.correctAnswers,
      score: r.score,
    }));

    const { session: completedSession, updatedProgress } = await studyAgent.completeSession(
      sessionId,
      sessionResults,
      userProgressDict
    );

    // Update stored progress
    if (!userProgress[userId]) {
      userProgress[userId] = {};
    }
    Object.assign(userProgress[userId], updatedProgress);

    res.json({
      session: completedSession,
      updatedGrammarIds: Object.keys(updatedProgress),
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(400).json({ error: String(error) });
  }
});

// GET /api/study/sessions/:id
studyRouter.get('/sessions/:id', (req: Request<{ id: string }>, res: Response) => {
  const session = studyAgent.getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json({ session });
});

export { studyRouter };
