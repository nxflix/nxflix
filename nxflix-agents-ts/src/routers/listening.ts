import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { listeningRepository } from '../db/repositories/index.js';
import { TTSService } from '../services/tts.js';
import { ListeningItem, ListeningGenerateRequest, ListeningType, type ListeningItem as ListeningItemType } from '../models/listening.js';
import { LLMProvider } from '../providers/llm.js';
import type { Listening as DbListening } from '../db/schema.js';

const llm = new LLMProvider();
const listeningRouter = Router();

// Singleton services
const ttsService = new TTSService();

// Convert database record to model type
function dbToModel(db: DbListening): ListeningItemType {
  // Cast speakers to the correct type with gender enum
  const speakers = (db.speakers || []).map(s => ({
    ...s,
    gender: s.gender as 'male' | 'female' | 'neutral',
  }));

  return {
    id: db.id,
    listeningType: db.listeningType as ListeningItemType['listeningType'],
    title: db.title || undefined,
    transcript: db.transcript,
    dialogue: db.dialogue || [],
    speakers,
    durationSeconds: db.durationSeconds,
    questions: db.questions,
    situationContext: db.situationContext || undefined,
    level: db.level,
    contentType: 'listening',
    audioUrl: db.audioUrl || undefined,
    audioBase64: db.audioBase64 || undefined,
  };
}

// Request schemas
const ListeningSearchSchema = z.object({
  query: z.string().min(1),
});

const ListeningGenerateSchema = ListeningGenerateRequest;

// Response types
interface ListeningListResponse {
  listening: ListeningItem[];
  count: number;
}

interface ListeningSingleResponse {
  listening: ListeningItem;
}

// GET /api/listening - List all listening items
listeningRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const dbResults = await listeningRepository.findAll();
    const listening = dbResults.map(dbToModel);
    res.json({ listening, count: listening.length } as ListeningListResponse);
  } catch (error) {
    console.error('Error fetching listening:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/listening/search - Search listening items
listeningRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const { query } = ListeningSearchSchema.parse(req.query);
    const dbResults = await listeningRepository.search(query);
    const listening = dbResults.map(dbToModel);
    res.json({ listening, count: listening.length } as ListeningListResponse);
  } catch (error) {
    console.error('Error searching listening:', error);
    res.status(400).json({ error: String(error) });
  }
});

// GET /api/listening/by-type/:type - Get listening by type
listeningRouter.get('/by-type/:type', async (req: Request<{ type: string }>, res: Response) => {
  try {
    const listeningType = ListeningType.parse(req.params.type);
    const dbResults = await listeningRepository.findByListeningType(listeningType);
    const listening = dbResults.map(dbToModel);
    res.json({ listening, count: listening.length } as ListeningListResponse);
  } catch (error) {
    res.status(400).json({ error: 'Invalid listening type' });
  }
});

// GET /api/listening/:id - Get single listening by ID
listeningRouter.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const dbResult = await listeningRepository.findById(req.params.id);
    if (!dbResult) {
      res.status(404).json({ error: 'Listening item not found' });
      return;
    }
    res.json({ listening: dbToModel(dbResult) } as ListeningSingleResponse);
  } catch (error) {
    console.error('Error fetching listening:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/listening/:id/audio - Stream audio for listening item
listeningRouter.get('/:id/audio', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const dbResult = await listeningRepository.findById(req.params.id);
    if (!dbResult) {
      res.status(404).json({ error: 'Listening item not found' });
      return;
    }

    if (!dbResult.audioBase64) {
      res.status(404).json({ error: 'Audio not available' });
      return;
    }

    const audioBuffer = Buffer.from(dbResult.audioBase64, 'base64');
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('Error streaming audio:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/listening/generate - AI-generate listening exercise (does NOT save)
listeningRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const request = ListeningGenerateSchema.parse(req.body);

    const prompt = buildListeningGenerationPrompt(request);

    // Generate the script and questions
    const generatedScript = await llm.completeJson(
      [{ role: 'user', content: prompt }],
      z.object({
        listening: ListeningItem.omit({ audioUrl: true, audioBase64: true }),
      })
    );

    let listeningData = generatedScript.listening as ListeningItemType;

    // Generate TTS audio if requested
    if (request.generateAudio && listeningData.transcript) {
      const provider = request.ttsProvider || 'openai';
      console.log(`[Listening] Generating TTS audio for ${listeningData.transcript.length} characters with ${provider}...`);
      try {
        const ttsResult = await ttsService.synthesize(listeningData.transcript, {
          speed: 0.9, // Slightly slower for listening practice
          provider: provider as 'openai' | 'google' | 'elevenlabs',
        });

        listeningData = {
          ...listeningData,
          audioBase64: ttsResult.audioBase64,
          durationSeconds: ttsResult.durationSeconds,
        };
        console.log(`[Listening] TTS audio generated successfully (${ttsResult.audioBase64.length} bytes)`);
      } catch (ttsError) {
        console.error('[Listening] TTS generation failed:', ttsError);
        // Continue without audio - the UI will show "Audio not available"
      }
    } else {
      console.log(`[Listening] Skipping TTS: generateAudio=${request.generateAudio}, hasTranscript=${!!listeningData.transcript}`);
    }

    // Return generated content without saving
    res.json({ listening: listeningData } as ListeningSingleResponse);
  } catch (error) {
    console.error('Error generating listening:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/listening/save - Save listening exercise to database
listeningRouter.post('/save', async (req: Request, res: Response) => {
  try {
    const { listening, isPublic, userId } = req.body as {
      listening: ListeningItemType;
      isPublic?: boolean;
      userId?: string;
    };
    if (!listening) {
      res.status(400).json({ error: 'listening object is required' });
      return;
    }

    const saved = await listeningRepository.upsert({
      id: listening.id,
      listeningType: listening.listeningType,
      title: listening.title,
      transcript: listening.transcript,
      dialogue: listening.dialogue || [],
      speakers: listening.speakers || [],
      durationSeconds: listening.durationSeconds,
      questions: listening.questions,
      situationContext: listening.situationContext,
      level: listening.level || 'N1',
      audioUrl: listening.audioUrl,
      audioBase64: listening.audioBase64,
      isPublic: isPublic ?? false,
      createdBy: userId,
    });

    res.json({ listening: dbToModel(saved), saved: true } as ListeningSingleResponse & { saved: boolean });
  } catch (error) {
    console.error('Error saving listening:', error);
    res.status(500).json({ error: String(error) });
  }
});

function buildListeningGenerationPrompt(request: z.infer<typeof ListeningGenerateSchema>): string {
  const parts: string[] = [
    'Generate a JLPT N1 listening exercise in JSON format.',
    '',
    `Exercise type: ${request.listeningType}`,
    `Target duration: approximately ${request.durationSeconds} seconds`,
    `Number of speakers: ${request.speakerCount}`,
    `Number of questions: ${request.questionCount}`,
  ];

  if (request.topic) {
    parts.push(`Topic/situation: ${request.topic}`);
  }

  parts.push('');
  parts.push('Create a natural Japanese dialogue appropriate for JLPT N1 level.');
  parts.push('');
  parts.push('For the listening item, provide:');
  parts.push('- id: unique identifier (format: listening-XXX)');
  parts.push('- listeningType: the exercise type');
  parts.push('- title: optional title for the exercise');
  parts.push('- transcript: the full dialogue transcript');
  parts.push('- dialogue: array of dialogue lines with speakerId and text');
  parts.push('- speakers: array of speaker info with id, name, gender');
  parts.push('- durationSeconds: estimated duration');
  parts.push('- questions: array of multiple-choice questions (4 options each)');
  parts.push('- situationContext: brief context/setting description');
  parts.push('');
  parts.push('Each question should have:');
  parts.push('- id, questionText, questionTextJp (optional)');
  parts.push('- options: exactly 4 choices');
  parts.push('- correctOption: index 0-3');
  parts.push('- explanation: why the answer is correct');
  parts.push('');
  parts.push('Return a JSON object with a "listening" object.');

  return parts.join('\n');
}

export { listeningRouter };
