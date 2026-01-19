import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ListeningService } from '../services/listening.js';
import { TTSService } from '../services/tts.js';
import { ListeningItem, ListeningGenerateRequest, ListeningType } from '../models/listening.js';
import { LLMProvider } from '../providers/llm.js';

const llm = new LLMProvider();
const listeningRouter = Router();

// Singleton services
const listeningService = new ListeningService();
const ttsService = new TTSService();

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
listeningRouter.get('/', (_req: Request, res: Response) => {
  const listening = listeningService.getAllListeningItems();
  res.json({ listening, count: listening.length } as ListeningListResponse);
});

// GET /api/listening/search - Search listening items
listeningRouter.get('/search', (req: Request, res: Response) => {
  try {
    const { query } = ListeningSearchSchema.parse(req.query);
    const listening = listeningService.searchListening(query);
    res.json({ listening, count: listening.length } as ListeningListResponse);
  } catch (error) {
    console.error('Error searching listening:', error);
    res.status(400).json({ error: String(error) });
  }
});

// GET /api/listening/by-type/:type - Get listening by type
listeningRouter.get('/by-type/:type', (req: Request<{ type: string }>, res: Response) => {
  try {
    const listeningType = ListeningType.parse(req.params.type);
    const listening = listeningService.getListeningByType(listeningType);
    res.json({ listening, count: listening.length } as ListeningListResponse);
  } catch (error) {
    res.status(400).json({ error: 'Invalid listening type' });
  }
});

// GET /api/listening/:id - Get single listening by ID
listeningRouter.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const listening = listeningService.getListeningItem(req.params.id);
  if (!listening) {
    res.status(404).json({ error: 'Listening item not found' });
    return;
  }
  res.json({ listening } as ListeningSingleResponse);
});

// GET /api/listening/:id/audio - Stream audio for listening item
listeningRouter.get('/:id/audio', (req: Request<{ id: string }>, res: Response) => {
  const listening = listeningService.getListeningItem(req.params.id);
  if (!listening) {
    res.status(404).json({ error: 'Listening item not found' });
    return;
  }

  if (!listening.audioBase64) {
    res.status(404).json({ error: 'Audio not available' });
    return;
  }

  const audioBuffer = Buffer.from(listening.audioBase64, 'base64');
  res.set({
    'Content-Type': 'audio/mpeg',
    'Content-Length': audioBuffer.length,
  });
  res.send(audioBuffer);
});

// POST /api/listening/generate - AI-generate listening exercise
listeningRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const request = ListeningGenerateSchema.parse(req.body);

    const prompt = buildListeningGenerationPrompt(request);

    // Generate the script and questions
    const generatedScript = await llm.completeJson<{
      listening: Omit<ListeningItem, 'audioUrl' | 'audioBase64'>;
    }>(
      [{ role: 'user', content: prompt }],
      z.object({
        listening: ListeningItem.omit({ audioUrl: true, audioBase64: true }),
      })
    );

    let listening = generatedScript.listening as ListeningItem;

    // Generate TTS audio if requested
    if (request.generateAudio && listening.transcript) {
      try {
        const ttsResult = await ttsService.synthesize(listening.transcript, {
          speed: 0.9, // Slightly slower for listening practice
        });

        listening = {
          ...listening,
          audioBase64: ttsResult.audioBase64,
          durationSeconds: ttsResult.durationSeconds,
        };
      } catch (ttsError) {
        console.error('TTS generation failed:', ttsError);
        // Continue without audio
      }
    }

    // Add to service
    listeningService.addListeningItem(listening);

    res.json({ listening } as ListeningSingleResponse);
  } catch (error) {
    console.error('Error generating listening:', error);
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

// Export the service for state management
export { listeningRouter, listeningService };
