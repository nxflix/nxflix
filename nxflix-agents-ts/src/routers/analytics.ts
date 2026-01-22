import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  analyticsService,
  epochService,
  EVENT_WEIGHTS,
} from '../services/index.js';
import type {} from '../db/repositories/index.js';

const analyticsRouter = Router();

// Request schemas
const TrackEventSchema = z.object({
  contentId: z.string(),
  contentType: z.string(),
  userId: z.string().optional(),
  eventType: z.enum(['view', 'study', 'complete', 'save', 'share']),
  eventData: z.record(z.unknown()).optional(),
});

const LeaderboardQuerySchema = z.object({
  epochId: z.string().optional(),
  contentType: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// POST /api/analytics/event - Track a content engagement event
analyticsRouter.post('/event', async (req: Request, res: Response) => {
  try {
    const request = TrackEventSchema.parse(req.body);
    const event = await analyticsService.trackEvent(request);

    res.json({
      success: true,
      event: {
        id: event.id,
        contentId: event.contentId,
        eventType: event.eventType,
        createdAt: event.createdAt,
      },
    });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/analytics/content/:contentId/stats - Get stats for a content item
analyticsRouter.get('/content/:contentId/stats', async (req: Request<{ contentId: string }>, res: Response) => {
  try {
    const stats = await analyticsService.getContentStats(req.params.contentId);
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching content stats:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/analytics/content/:contentId/events - Get recent events for content
analyticsRouter.get('/content/:contentId/events', async (req: Request<{ contentId: string }>, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const events = await analyticsService.getContentEvents(req.params.contentId, limit);
    res.json({ events, count: events.length });
  } catch (error) {
    console.error('Error fetching content events:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/analytics/creator/:userId/performance - Get creator performance stats
analyticsRouter.get('/creator/:userId/performance', async (req: Request<{ userId: string }>, res: Response) => {
  try {
    const epochId = req.query.epochId as string | undefined;
    const performance = await analyticsService.getCreatorPerformance(req.params.userId, epochId);
    res.json({ performance });
  } catch (error) {
    console.error('Error fetching creator performance:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/analytics/user/:userId/events - Get recent events for a user
analyticsRouter.get('/user/:userId/events', async (req: Request<{ userId: string }>, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const events = await analyticsService.getUserEvents(req.params.userId, limit);
    res.json({ events, count: events.length });
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/analytics/leaderboard - Get content leaderboard
analyticsRouter.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const query = LeaderboardQuerySchema.parse(req.query);
    const leaderboard = await analyticsService.getLeaderboard(
      query.epochId,
      query.contentType,
      query.limit
    );

    res.json({ leaderboard, count: leaderboard.length });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/analytics/epochs - Get all epochs
analyticsRouter.get('/epochs', async (_req: Request, res: Response) => {
  try {
    const epochs = await epochService.getAllEpochs();
    res.json({ epochs, count: epochs.length });
  } catch (error) {
    console.error('Error fetching epochs:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/analytics/epochs/current - Get current active epochs
analyticsRouter.get('/epochs/current', async (_req: Request, res: Response) => {
  try {
    const activeEpochs = await epochService.getActiveEpochs();
    res.json({ epochs: activeEpochs });
  } catch (error) {
    console.error('Error fetching active epochs:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/analytics/epochs/:epochId/stats - Get stats for an epoch
analyticsRouter.get('/epochs/:epochId/stats', async (req: Request<{ epochId: string }>, res: Response) => {
  try {
    const stats = await analyticsService.getEpochStats(req.params.epochId);
    res.json({ stats, count: stats.length });
  } catch (error) {
    console.error('Error fetching epoch stats:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/analytics/weights - Get event weights
analyticsRouter.get('/weights', (_req: Request, res: Response) => {
  res.json({ weights: EVENT_WEIGHTS });
});

export { analyticsRouter };
