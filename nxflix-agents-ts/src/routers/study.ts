import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { StudyOrchestratorAgent } from '../agents/study-orchestrator.js';
import { GrammarService } from '../services/grammar.js';
import { SM2Service } from '../services/spaced-repetition.js';
import type { UserProgress, SessionResult } from '../models/progress.js';

const studyRouter = Router();

// In-memory storage for demo
const userProgress: Record<string, Record<string, UserProgress>> = {};

// Singleton services
const grammarService = new GrammarService();
const sm2Service = new SM2Service();
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
    grammarId: z.string(),
    questionsAsked: z.number().int(),
    correctAnswers: z.number().int(),
    score: z.number(),
  })),
});

// Get user progress helper
function getUserProgress(userId: string): UserProgress[] {
  return Object.values(userProgress[userId] ?? {});
}

// POST /api/study/recommendations
studyRouter.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const request = RecommendationRequestSchema.parse(req.body);
    const progress = getUserProgress(request.userId);

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
studyRouter.put('/sessions/:id/complete', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    const { results } = SessionCompleteRequestSchema.parse({
      ...req.body,
      sessionId,
    });

    const session = studyAgent.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const userId = session.userId;
    const userProgressDict = userProgress[userId] ?? {};

    // Create progress entries for new grammar points
    for (const result of results) {
      if (!(result.grammarId in userProgressDict)) {
        userProgressDict[result.grammarId] = {
          userId,
          grammarId: result.grammarId,
          sm2Data: { easeFactor: 2.5, interval: 0, repetitions: 0 },
          timesStudied: 0,
          timesCorrect: 0,
          lastScore: null,
          masteryLevel: 0,
        };
      }
    }

    const sessionResults: SessionResult[] = results.map(r => ({
      grammarId: r.grammarId,
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
studyRouter.get('/sessions/:id', (req: Request, res: Response) => {
  const session = studyAgent.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ session });
});

export { studyRouter };
