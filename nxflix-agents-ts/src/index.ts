import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { settings } from './config.js';
import { initTracing } from './tracing/index.js';
import { checkDatabaseConnection, closeDatabaseConnection } from './db/index.js';
import {
  studyRouter,
  quizRouter,
  progressRouter,
  healthRouter,
  grammarRouter,
  kanjiRouter,
  vocabularyRouter,
  listeningRouter,
  readingRouter,
  ttsRouter,
  sideshiftRouter,
  focusRouter,
  videoRouter,
  analyticsRouter,
  rewardsRouter,
  adminRouter,
} from './routers/index.js';

// Initialize tracing
await initTracing();

// Check database connection
const dbConnected = await checkDatabaseConnection();
if (!dbConnected) {
  console.warn('Warning: Database connection failed. Some features may not work correctly.');
}

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

// Routes
app.use('/api', healthRouter);
app.use('/api/study', studyRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/progress', progressRouter);
app.use('/api/grammar', grammarRouter);
app.use('/api/kanji', kanjiRouter);
app.use('/api/vocabulary', vocabularyRouter);
app.use('/api/listening', listeningRouter);
app.use('/api/reading', readingRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/sideshift', sideshiftRouter);
app.use('/api/focus', focusRouter);
app.use('/api/video', videoRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/admin', adminRouter);

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(settings.port, settings.host, () => {
  console.log(`Starting NXFlix Agents (TypeScript)`);
  console.log(`  Provider: ${settings.defaultProvider}`);
  console.log(`  Model: ${settings.defaultModel}`);
  console.log(`  Database: ${dbConnected ? 'connected' : 'disconnected'}`);
  console.log(`  Opik: ${settings.opikEnabled ? 'enabled' : 'disabled'}`);
  console.log(`  Listening on http://${settings.host}:${settings.port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await closeDatabaseConnection();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app };
