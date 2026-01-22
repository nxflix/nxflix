import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { TTSService, TTSProvider, JapaneseVoices } from '../services/tts.js';

const ttsRouter = Router();

// Singleton TTS service
const ttsService = new TTSService();

// Request schemas
const SynthesizeRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  voice: z.string().optional(),
  speed: z.number().min(0.25).max(4.0).default(1.0),
  pitch: z.number().min(-20).max(20).default(0),
  provider: TTSProvider.optional(),
});

const DialogueSynthesizeRequestSchema = z.object({
  dialogue: z.array(
    z.object({
      speaker: z.string(),
      text: z.string(),
    })
  ),
  voiceMap: z.record(z.string()),
  speed: z.number().min(0.25).max(4.0).default(1.0),
  provider: TTSProvider.optional(),
});

// POST /api/tts/synthesize - Synthesize text to speech
ttsRouter.post('/synthesize', async (req: Request, res: Response) => {
  try {
    const request = SynthesizeRequestSchema.parse(req.body);

    const result = await ttsService.synthesize(request.text, {
      voice: request.voice,
      speed: request.speed,
      pitch: request.pitch,
      provider: request.provider,
    });

    res.json({
      audioBase64: result.audioBase64,
      audioUrl: result.audioUrl,
      durationSeconds: result.durationSeconds,
      format: result.format,
    });
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/tts/synthesize-dialogue - Synthesize dialogue with multiple speakers
ttsRouter.post('/synthesize-dialogue', async (req: Request, res: Response) => {
  try {
    const request = DialogueSynthesizeRequestSchema.parse(req.body);

    const result = await ttsService.synthesizeDialogue(
      request.dialogue,
      request.voiceMap,
      {
        speed: request.speed,
        provider: request.provider,
      }
    );

    res.json({
      audioBase64: result.audioBase64,
      audioUrl: result.audioUrl,
      durationSeconds: result.durationSeconds,
      format: result.format,
    });
  } catch (error) {
    console.error('Error synthesizing dialogue:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/tts/voices - Get available voices
ttsRouter.get('/voices', async (req: Request, res: Response) => {
  const provider = req.query.provider as TTSProvider | undefined;

  try {
    if (provider) {
      const voices = await ttsService.getAvailableVoicesAsync(provider);
      res.json({ provider, voices });
    } else {
      // Return all providers' voices (fetch ElevenLabs async)
      const elevenLabsVoices = await ttsService.getAvailableVoicesAsync('elevenlabs');
      res.json({
        providers: {
          google: JapaneseVoices.google,
          openai: JapaneseVoices.openai,
          elevenlabs: elevenLabsVoices,
        },
      });
    }
  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/tts/providers - Get available TTS providers
ttsRouter.get('/providers', (_req: Request, res: Response) => {
  res.json({
    providers: ['google', 'openai', 'elevenlabs'],
    default: 'openai',
  });
});

export { ttsRouter };
