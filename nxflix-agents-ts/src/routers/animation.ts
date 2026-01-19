import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { didService } from '../services/did.js';
import { hedraService } from '../services/hedra.js';
import { runwayService } from '../services/runway.js';
import { TTSService } from '../services/tts.js';
import { scriptGeneratorService } from '../services/script-generator.js';

const animationRouter = Router();
const ttsService = new TTSService();

// Request schemas
const GenerateTalkingVideoSchema = z.object({
  /** Base64-encoded portrait image or image URL */
  image: z.string(),
  /** Whether image is base64 (default true) */
  imageIsBase64: z.boolean().default(true),
  /** Audio source - either base64 audio or URL */
  audio: z.string().optional(),
  /** Text to speak (if audio not provided, will use provider's TTS or our TTS) */
  text: z.string().optional(),
  /** Provider: 'd-id' (default) or 'hedra' */
  provider: z.enum(['d-id', 'hedra']).default('d-id'),
  /** TTS provider to use for text (when using our TTS) */
  ttsProvider: z.enum(['microsoft', 'elevenlabs', 'google', 'amazon']).default('microsoft'),
  /** Voice ID for TTS */
  voiceId: z.string().optional(),
  /** Whether to wait for completion */
  waitForCompletion: z.boolean().default(false),
  /** Timeout for waiting (ms) */
  timeout: z.number().default(5 * 60 * 1000),
});

// AI Video generation schema
const GenerateAIVideoSchema = z.object({
  /** Text prompt describing the video */
  prompt: z.string(),
  /** Optional reference image (base64 or URL) */
  image: z.string().optional(),
  /** Whether image is a URL (default: false = base64) */
  imageIsUrl: z.boolean().default(false),
  /** Provider: 'runway' */
  provider: z.enum(['runway']).default('runway'),
  /** Duration in seconds (5 or 10) */
  duration: z.enum(['5', '10']).transform(Number).default('5'),
  /** Aspect ratio */
  ratio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
  /** Whether to wait for completion */
  waitForCompletion: z.boolean().default(false),
  /** Timeout for waiting (ms) */
  timeout: z.number().default(10 * 60 * 1000),
});

// GET /api/animation/config - Get animation service configuration
animationRouter.get('/config', (_req: Request, res: Response) => {
  res.json({
    providers: {
      'did': {
        name: 'D-ID',
        configured: didService.isConfigured(),
        features: ['talking-head', 'lip-sync', 'text-to-speech'],
        recommended: true,
      },
      'hedra': {
        name: 'Hedra',
        configured: hedraService.isConfigured(),
        features: ['talking-head', 'lip-sync'],
        recommended: false,
      },
      'runway': {
        name: 'Runway ML',
        configured: runwayService.isConfigured(),
        features: ['ai-video', 'text-to-video', 'image-to-video'],
        recommended: true,
      },
    },
    defaultProvider: 'd-id',
    defaultVideoProvider: 'runway',
    ttsProviders: ['microsoft', 'elevenlabs', 'google', 'amazon'],
    maxDuration: 60, // seconds
  });
});

// GET /api/animation/voices - Get available voices
animationRouter.get('/voices', async (req: Request, res: Response) => {
  try {
    const provider = (req.query.provider as string) || 'microsoft';
    const voices = await didService.getVoices(provider as any);
    res.json({ voices, provider });
  } catch (error) {
    console.error('[Animation] Failed to get voices:', error);
    res.status(500).json({ error: 'Failed to get voices', message: String(error) });
  }
});

// GET /api/animation/credits - Get available credits
animationRouter.get('/credits', async (_req: Request, res: Response) => {
  try {
    if (didService.isConfigured()) {
      const credits = await didService.getCredits();
      res.json({ provider: 'd-id', ...credits });
      return;
    }

    res.status(503).json({
      error: 'No video provider configured',
      message: 'Set DID_API_KEY in environment',
    });
  } catch (error) {
    console.error('[Animation] Credits check error:', error);
    res.status(500).json({ error: 'Credits check failed', message: String(error) });
  }
});

// POST /api/animation/generate - Generate a talking head video
animationRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const request = GenerateTalkingVideoSchema.parse(req.body);

    // Check which provider to use
    const useProvider = request.provider;

    if (useProvider === 'd-id') {
      if (!didService.isConfigured()) {
        res.status(503).json({
          error: 'D-ID API not configured',
          message: 'Set DID_API_KEY in environment to enable video generation',
        });
        return;
      }

      // D-ID can use its own TTS, so we just pass the text
      if (!request.text && !request.audio) {
        res.status(400).json({
          error: 'Missing content',
          message: 'Provide either "text" for TTS or "audio" URL',
        });
        return;
      }

      console.log(`[Animation] Generating with D-ID...`);

      const result = await didService.generateTalkingVideo({
        image: request.image,
        imageIsBase64: request.imageIsBase64,
        text: request.text || '',
        voiceId: request.voiceId,
        provider: request.ttsProvider as any,
        waitForCompletion: request.waitForCompletion,
        timeout: request.timeout,
      });

      res.json({
        success: result.status !== 'failed',
        jobId: result.jobId,
        status: result.status,
        videoUrl: result.videoUrl,
        error: result.error,
        provider: 'd-id',
      });
      return;
    }

    // Hedra provider (fallback)
    if (useProvider === 'hedra') {
      if (!hedraService.isConfigured()) {
        res.status(503).json({
          error: 'Hedra API not configured',
          message: 'Set HEDRA_API_KEY in environment',
        });
        return;
      }

      // Hedra requires audio, so generate if only text provided
      let audioBase64 = request.audio;

      if (!audioBase64 && request.text) {
        console.log(`[Animation] Generating TTS audio for Hedra...`);
        const ttsResult = await ttsService.synthesize(request.text, {
          provider: 'elevenlabs',
          speed: 0.95,
        });
        audioBase64 = ttsResult.audioBase64;
      }

      if (!audioBase64) {
        res.status(400).json({
          error: 'Missing audio',
          message: 'Provide either "audio" or "text" for TTS generation',
        });
        return;
      }

      const result = await hedraService.generateTalkingVideo({
        image: request.image,
        audio: audioBase64,
        imageIsBase64: request.imageIsBase64,
        audioIsBase64: true,
      });

      res.json({
        success: result.status !== 'failed',
        jobId: result.jobId,
        status: result.status,
        videoUrl: result.videoUrl,
        error: result.error,
        provider: 'hedra',
      });
      return;
    }

    res.status(400).json({ error: 'Invalid provider' });
  } catch (error) {
    console.error('[Animation] Generation error:', error);
    res.status(500).json({ error: 'Generation failed', message: String(error) });
  }
});

// GET /api/animation/status/:jobId - Get generation status
animationRouter.get('/status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const provider = (req.query.provider as string) || 'd-id';

    if (!jobId) {
      res.status(400).json({ error: 'Missing jobId parameter' });
      return;
    }

    if (provider === 'd-id') {
      const talk = await didService.getTalk(jobId);

      // Map D-ID status to our status
      let status: 'pending' | 'processing' | 'completed' | 'failed' = 'processing';
      if (talk.status === 'done') status = 'completed';
      else if (talk.status === 'error' || talk.status === 'rejected') status = 'failed';
      else if (talk.status === 'created') status = 'pending';

      res.json({
        jobId: talk.id,
        status,
        videoUrl: talk.resultUrl,
        error: talk.error?.description,
        provider: 'd-id',
      });
      return;
    }

    // Hedra
    const status = await hedraService.getGenerationStatus(jobId);
    res.json({ ...status, provider: 'hedra' });
  } catch (error) {
    console.error('[Animation] Status check error:', error);
    res.status(500).json({ error: 'Status check failed', message: String(error) });
  }
});

// POST /api/animation/wait/:jobId - Wait for generation to complete
animationRouter.post('/wait/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const timeout = parseInt(req.query.timeout as string) || 5 * 60 * 1000;
    const provider = (req.query.provider as string) || 'd-id';

    if (!jobId) {
      res.status(400).json({ error: 'Missing jobId parameter' });
      return;
    }

    console.log(`[Animation] Waiting for job ${jobId} (provider: ${provider}, timeout: ${timeout}ms)...`);

    if (provider === 'd-id') {
      const result = await didService.waitForCompletion(jobId, { timeout });
      res.json({ ...result, provider: 'd-id' });
      return;
    }

    // Hedra
    const result = await hedraService.waitForCompletion(jobId, { timeout, interval: 5000 });
    res.json({ ...result, provider: 'hedra' });
  } catch (error) {
    console.error('[Animation] Wait error:', error);
    res.status(500).json({ error: 'Wait failed', message: String(error) });
  }
});

// ============================================================================
// AI Video Generation Endpoints (Runway ML)
// ============================================================================

// POST /api/animation/ai-video/generate - Generate an AI video
animationRouter.post('/ai-video/generate', async (req: Request, res: Response) => {
  try {
    const request = GenerateAIVideoSchema.parse(req.body);

    if (!runwayService.isConfigured()) {
      res.status(503).json({
        error: 'Runway API not configured',
        message: 'Set RUNWAY_API_KEY in environment to enable AI video generation',
      });
      return;
    }

    console.log(`[Animation] Generating AI video with Runway...`);
    console.log(`[Animation] Prompt: "${request.prompt.substring(0, 100)}..."`);

    let result;

    if (request.image) {
      // Image-to-video generation
      result = await runwayService.generateFromImage({
        prompt: request.prompt,
        image: request.image,
        imageIsUrl: request.imageIsUrl,
        duration: request.duration as 5 | 10,
        ratio: request.ratio,
        waitForCompletion: request.waitForCompletion,
        timeout: request.timeout,
      });
    } else {
      // Text-to-video generation
      result = await runwayService.generateFromText({
        prompt: request.prompt,
        duration: request.duration as 5 | 10,
        ratio: request.ratio,
        waitForCompletion: request.waitForCompletion,
        timeout: request.timeout,
      });
    }

    res.json({
      success: result.status !== 'failed',
      jobId: result.jobId,
      status: result.status,
      videoUrl: result.videoUrl,
      error: result.error,
      provider: 'runway',
    });
  } catch (error) {
    console.error('[Animation] AI video generation error:', error);
    res.status(500).json({
      error: 'AI video generation failed',
      message: String(error),
    });
  }
});

// GET /api/animation/ai-video/status/:jobId - Get AI video generation status
animationRouter.get('/ai-video/status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      res.status(400).json({ error: 'Missing jobId parameter' });
      return;
    }

    if (!runwayService.isConfigured()) {
      res.status(503).json({
        error: 'Runway API not configured',
        message: 'Set RUNWAY_API_KEY in environment',
      });
      return;
    }

    const task = await runwayService.getTask(jobId);

    // Map Runway status to our status
    let status: 'pending' | 'processing' | 'completed' | 'failed' = 'processing';
    if (task.status === 'SUCCEEDED') status = 'completed';
    else if (task.status === 'FAILED' || task.status === 'CANCELLED') status = 'failed';
    else if (task.status === 'PENDING') status = 'pending';

    res.json({
      jobId: task.id,
      status,
      videoUrl: task.output?.[0],
      error: task.failure || task.failureCode,
      progress: task.progress,
      provider: 'runway',
    });
  } catch (error) {
    console.error('[Animation] AI video status check error:', error);
    res.status(500).json({
      error: 'Status check failed',
      message: String(error),
    });
  }
});

// POST /api/animation/ai-video/wait/:jobId - Wait for AI video generation to complete
animationRouter.post('/ai-video/wait/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const timeout = parseInt(req.query.timeout as string) || 10 * 60 * 1000;

    if (!jobId) {
      res.status(400).json({ error: 'Missing jobId parameter' });
      return;
    }

    if (!runwayService.isConfigured()) {
      res.status(503).json({
        error: 'Runway API not configured',
        message: 'Set RUNWAY_API_KEY in environment',
      });
      return;
    }

    console.log(`[Animation] Waiting for AI video job ${jobId} (timeout: ${timeout}ms)...`);

    const result = await runwayService.waitForCompletion(jobId, { timeout });

    res.json({
      ...result,
      provider: 'runway',
    });
  } catch (error) {
    console.error('[Animation] AI video wait error:', error);
    res.status(500).json({
      error: 'Wait failed',
      message: String(error),
    });
  }
});

// ============================================================================
// Script Generation Endpoints
// ============================================================================

// Schema for script generation
const GenerateScriptSchema = z.object({
  grammar: z.array(z.object({
    pattern: z.string(),
    meaning: z.string(),
    example: z.string().optional(),
  })).optional(),
  vocabulary: z.array(z.object({
    word: z.string(),
    reading: z.string().optional(),
    meaning: z.string(),
  })).optional(),
  kanji: z.array(z.object({
    character: z.string(),
    meaning: z.string(),
    readings: z.array(z.string()).optional(),
  })).optional(),
  genre: z.string(),
  context: z.string().optional(),
  targetDuration: z.number().optional(),
  characterCount: z.number().optional(),
  level: z.string().optional(),
});

// POST /api/animation/script/generate - Generate a Hollywood-style script
animationRouter.post('/script/generate', async (req: Request, res: Response) => {
  try {
    const request = GenerateScriptSchema.parse(req.body);

    console.log(`[Animation] Generating script for genre: ${request.genre}`);

    const script = await scriptGeneratorService.generateScript(request);

    res.json({
      success: true,
      script,
    });
  } catch (error) {
    console.error('[Animation] Script generation error:', error);
    res.status(500).json({
      error: 'Script generation failed',
      message: String(error),
    });
  }
});

// POST /api/animation/script/extract-dialogue - Extract dialogue from a script
animationRouter.post('/script/extract-dialogue', async (req: Request, res: Response) => {
  try {
    const { script, characterId } = req.body;

    if (!script) {
      res.status(400).json({ error: 'Missing script' });
      return;
    }

    const dialogue = scriptGeneratorService.extractDialogueText(script, characterId);

    res.json({
      success: true,
      dialogue,
      characterId,
    });
  } catch (error) {
    console.error('[Animation] Dialogue extraction error:', error);
    res.status(500).json({
      error: 'Dialogue extraction failed',
      message: String(error),
    });
  }
});

export { animationRouter };
