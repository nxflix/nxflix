import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { LLMProvider } from '../providers/llm.js';
import {
  grammarService,
  sm2Service,
  getUserProgressList,
  getUserProgress,
  updateUserProgress,
  makeProgressKey,
  startFocusSession,
  completeFocusSession,
  getFocusHistory,
  getRecentlyStudiedItems,
  getFocusStats,
} from '../state.js';
import { createTrace } from '../tracing/index.js';
import type { ContentType } from '../models/content-type.js';
import type { UserProgress } from '../models/progress.js';

const focusRouter = Router();

// Initialize LLM
const llm = new LLMProvider();

// Focus content response schema for LLM
const FocusSelectionSchema = z.object({
  contentType: z.enum(['grammar', 'vocabulary', 'kanji']),
  itemId: z.string(),
  reason: z.string(),
  studyTip: z.string(),
});

// Request schema
const FocusDailyRequestSchema = z.object({
  userId: z.string(),
  preferredTypes: z.array(z.enum(['grammar', 'vocabulary', 'kanji', 'reading', 'listening'])).optional(),
});

// Response type
interface FocusContent {
  id: string;
  type: ContentType;
  title: string;
  content: {
    main: string;
    sub?: string;
    detail?: string;
    example?: string;
  };
  reason: string;
  studyTip: string;
  generatedAt: string;
  itemId: string; // Track which item this is for progress
}

// In-memory storage for generated focus content (for quick items)
const focusContentCache: Record<string, FocusContent> = {};

// POST /api/focus/daily - Get personalized focus content for the day
focusRouter.post('/daily', async (req: Request, res: Response) => {
  const trace = createTrace('focus.daily', { body: req.body });

  try {
    const { userId, preferredTypes } = FocusDailyRequestSchema.parse(req.body);

    // Get user's progress
    const progress = getUserProgressList(userId);
    const dueItems = sm2Service.getDueItems(progress, 10);

    // Get recently studied items to avoid repetition
    const recentItems = getRecentlyStudiedItems(userId, 1);

    // Get focus stats for personalization
    const focusStats = getFocusStats(userId);

    // Get available grammar points
    const allGrammar = grammarService.getAllGrammarPoints();

    // Filter out recently studied items
    const availableGrammar = allGrammar.filter(g => !recentItems.includes(g.id));

    // Build context for LLM
    const progressSummary = buildProgressSummary(progress, focusStats);
    const dueSummary = dueItems.length > 0
      ? `Due for review: ${dueItems.slice(0, 5).map(p => p.itemId).join(', ')}`
      : 'No items currently due for review';

    const recentSummary = recentItems.length > 0
      ? `Recently studied (avoid these): ${recentItems.join(', ')}`
      : 'No recent study history';

    const grammarSample = availableGrammar.slice(0, 15).map(g => ({
      id: g.id,
      pattern: g.pattern,
      meaning: g.meaning,
      category: g.category,
    }));

    const prompt = `You are a JLPT N1 study advisor selecting ONE item for a focused study session.

## Student Context
${progressSummary}
${dueSummary}
${recentSummary}

## Student Stats
- Total focus sessions: ${focusStats.totalSessions}
- Current streak: ${focusStats.streakDays} days
- Average session time: ${Math.round(focusStats.averageTimeSeconds / 60)} minutes

## Available Grammar Points (not recently studied)
${JSON.stringify(grammarSample, null, 2)}

## Task
Select ONE item for today's focus session. Prioritize:
1. Items due for review (spaced repetition) - HIGHEST PRIORITY
2. Items with low mastery that need reinforcement
3. New items if no reviews are due
4. DO NOT select items from the "Recently studied" list
5. Consider the student's streak and motivate them

${preferredTypes?.length ? `Student prefers: ${preferredTypes.join(', ')}` : ''}

Respond with JSON:
- contentType: "grammar" (for now, we'll add more types later)
- itemId: the grammar point ID to study (must be from the available list)
- reason: ONE personalized sentence explaining why this item was chosen for THIS student
- studyTip: ONE practical tip for memorizing this specific pattern`;

    const selection = await llm.completeJson(
      [{ role: 'user', content: prompt }],
      FocusSelectionSchema
    );

    // Get the selected grammar point
    const grammar = grammarService.getGrammarPoint(selection.itemId);

    if (!grammar) {
      // Fallback to random available grammar if LLM selection invalid
      const fallbackGrammar = availableGrammar.length > 0
        ? availableGrammar[Math.floor(Math.random() * availableGrammar.length)]
        : allGrammar[Math.floor(Math.random() * allGrammar.length)];

      const focusContent: FocusContent = {
        id: uuidv4(),
        type: 'grammar',
        title: 'Grammar Pattern',
        content: {
          main: fallbackGrammar.pattern,
          sub: fallbackGrammar.meaning,
          detail: fallbackGrammar.meaningJp,
          example: fallbackGrammar.example,
        },
        reason: 'Selected for your daily study.',
        studyTip: 'Try creating your own example sentence using this pattern.',
        generatedAt: new Date().toISOString(),
        itemId: fallbackGrammar.id,
      };

      // Record focus session start
      startFocusSession({
        id: focusContent.id,
        userId,
        contentId: focusContent.id,
        contentType: 'grammar',
        itemId: fallbackGrammar.id,
        startedAt: new Date(),
        revealed: false,
      });

      focusContentCache[focusContent.id] = focusContent;
      res.json({ content: focusContent });
      return;
    }

    const focusContent: FocusContent = {
      id: uuidv4(),
      type: selection.contentType,
      title: getCategoryTitle(selection.contentType, grammar.category),
      content: {
        main: grammar.pattern,
        sub: grammar.meaning,
        detail: grammar.meaningJp,
        example: grammar.example,
      },
      reason: selection.reason,
      studyTip: selection.studyTip,
      generatedAt: new Date().toISOString(),
      itemId: grammar.id,
    };

    // Record focus session start
    startFocusSession({
      id: focusContent.id,
      userId,
      contentId: focusContent.id,
      contentType: selection.contentType,
      itemId: grammar.id,
      startedAt: new Date(),
      revealed: false,
    });

    // Cache for potential later reference
    focusContentCache[focusContent.id] = focusContent;

    trace?.update({ output: { contentId: focusContent.id, type: focusContent.type, itemId: grammar.id } });
    trace?.end();

    res.json({ content: focusContent });
  } catch (error) {
    console.error('Error generating focus content:', error);
    trace?.update({ output: { error: String(error) } });
    trace?.end();

    // Fallback to random grammar
    const allGrammar = grammarService.getAllGrammarPoints();
    if (allGrammar.length > 0) {
      const fallbackGrammar = allGrammar[Math.floor(Math.random() * allGrammar.length)];
      const focusContent: FocusContent = {
        id: uuidv4(),
        type: 'grammar',
        title: 'Grammar Pattern',
        content: {
          main: fallbackGrammar.pattern,
          sub: fallbackGrammar.meaning,
          detail: fallbackGrammar.meaningJp,
          example: fallbackGrammar.example,
        },
        reason: 'Selected for your daily study.',
        studyTip: 'Focus on understanding when to use this pattern.',
        generatedAt: new Date().toISOString(),
        itemId: fallbackGrammar.id,
      };

      focusContentCache[focusContent.id] = focusContent;
      res.json({ content: focusContent });
      return;
    }

    res.status(500).json({ error: 'Failed to generate focus content' });
  }
});

// GET /api/focus/:id - Get specific focus content by ID
focusRouter.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const content = focusContentCache[req.params.id];
  if (!content) {
    res.status(404).json({ error: 'Focus content not found' });
    return;
  }
  res.json({ content });
});

// POST /api/focus/:id/complete - Mark focus session as complete and update progress
focusRouter.post('/:id/complete', async (req: Request<{ id: string }>, res: Response) => {
  const trace = createTrace('focus.complete', { contentId: req.params.id });

  try {
    const content = focusContentCache[req.params.id];
    if (!content) {
      res.status(404).json({ error: 'Focus content not found' });
      return;
    }

    // Get userId from the focus session or request body
    const { userId, quality = 4 } = req.body as { userId?: string; quality?: number };

    if (!userId) {
      // Try to find the session to get userId
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    // Complete the focus session
    const session = completeFocusSession(userId, content.id, true);

    // Update user progress for this item
    const existingProgress = getUserProgress(userId, content.itemId, content.type);

    const newProgress: UserProgress = existingProgress
      ? {
          ...existingProgress,
          timesStudied: existingProgress.timesStudied + 1,
          lastScore: quality,
          updatedAt: new Date().toISOString(),
          // Update mastery based on consistent study
          masteryLevel: Math.min(5, existingProgress.masteryLevel + (quality >= 4 ? 1 : 0)),
        }
      : {
          userId,
          itemId: content.itemId,
          contentType: content.type,
          sm2Data: { easeFactor: 2.5, interval: 1, repetitions: 1 },
          timesStudied: 1,
          timesCorrect: quality >= 4 ? 1 : 0,
          lastScore: quality,
          masteryLevel: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

    // Apply SM2 algorithm for spaced repetition
    const updatedProgress = sm2Service.updateProgress(newProgress, quality);
    updateUserProgress(userId, content.itemId, content.type, updatedProgress);

    // Get updated stats
    const stats = getFocusStats(userId);

    trace?.update({
      output: {
        contentId: content.id,
        itemId: content.itemId,
        timeSpent: session?.timeSpentSeconds,
        newMastery: updatedProgress.masteryLevel,
      },
    });
    trace?.end();

    res.json({
      success: true,
      message: 'Focus session completed!',
      contentId: content.id,
      completedAt: new Date().toISOString(),
      progress: {
        itemId: content.itemId,
        masteryLevel: updatedProgress.masteryLevel,
        timesStudied: updatedProgress.timesStudied,
        nextReview: updatedProgress.sm2Data.nextReviewDate,
      },
      stats: {
        totalSessions: stats.totalSessions,
        completedSessions: stats.completedSessions,
        streakDays: stats.streakDays,
        averageTimeSeconds: stats.averageTimeSeconds,
      },
    });
  } catch (error) {
    console.error('Error completing focus session:', error);
    trace?.update({ output: { error: String(error) } });
    trace?.end();
    res.status(500).json({ error: 'Failed to complete focus session' });
  }
});

// GET /api/focus/stats/:userId - Get user's focus stats
focusRouter.get('/stats/:userId', (req: Request<{ userId: string }>, res: Response) => {
  const stats = getFocusStats(req.params.userId);
  const history = getFocusHistory(req.params.userId, 10);

  res.json({
    stats,
    recentSessions: history.map(s => ({
      id: s.id,
      contentType: s.contentType,
      itemId: s.itemId,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt?.toISOString(),
      timeSpentSeconds: s.timeSpentSeconds,
    })),
  });
});

// Helper functions
function buildProgressSummary(progress: UserProgress[], focusStats: any): string {
  if (progress.length === 0) {
    if (focusStats.totalSessions === 0) {
      return 'New student - this is their first focus session! Welcome them warmly.';
    }
    return `Student has completed ${focusStats.completedSessions} focus sessions but no quiz progress yet.`;
  }

  const total = progress.length;
  const avgMastery = progress.reduce((sum, p) => sum + (p.masteryLevel || 0), 0) / total;
  const weakItems = progress.filter(p => (p.masteryLevel || 0) < 3);
  const masteredItems = progress.filter(p => (p.masteryLevel || 0) >= 4);

  return `Student has studied ${total} items. Average mastery: ${avgMastery.toFixed(1)}/5. ${masteredItems.length} items mastered, ${weakItems.length} items need reinforcement.`;
}

function getCategoryTitle(type: ContentType, category?: string): string {
  const titles: Record<string, Record<string, string>> = {
    grammar: {
      formal: 'Formal Expression',
      conditional: 'Conditional Pattern',
      emphasis: 'Emphasis Pattern',
      temporal: 'Time Expression',
      conjunctive: 'Conjunctive Pattern',
      default: 'Grammar Pattern',
    },
    vocabulary: {
      default: 'Vocabulary Word',
    },
    kanji: {
      default: 'Kanji Character',
    },
  };

  return titles[type]?.[category || 'default'] || titles[type]?.default || 'Study Item';
}

export { focusRouter };
