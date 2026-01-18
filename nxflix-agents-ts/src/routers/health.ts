import { Router, Request, Response } from 'express';
import { settings } from '../config.js';

const healthRouter = Router();

// GET /api/health
healthRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: '0.1.0',
    provider: settings.defaultProvider,
    model: settings.defaultModel,
    opikEnabled: settings.opikEnabled,
  });
});

export { healthRouter };
