import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ReadingService } from '../services/reading.js';
import { ReadingPassage, ReadingGenerateRequest, ReadingPassageType } from '../models/reading.js';
import { llm } from '../providers/llm.js';

const readingRouter = Router();

// Singleton reading service
const readingService = new ReadingService();

// Request schemas
const ReadingSearchSchema = z.object({
  query: z.string().min(1),
});

const ReadingGenerateSchema = ReadingGenerateRequest;

// Response types
interface ReadingListResponse {
  reading: ReadingPassage[];
  count: number;
}

interface ReadingSingleResponse {
  reading: ReadingPassage;
}

// GET /api/reading - List all reading passages
readingRouter.get('/', (_req: Request, res: Response) => {
  const reading = readingService.getAllReadingPassages();
  res.json({ reading, count: reading.length } as ReadingListResponse);
});

// GET /api/reading/search - Search reading passages
readingRouter.get('/search', (req: Request, res: Response) => {
  try {
    const { query } = ReadingSearchSchema.parse(req.query);
    const reading = readingService.searchReading(query);
    res.json({ reading, count: reading.length } as ReadingListResponse);
  } catch (error) {
    console.error('Error searching reading:', error);
    res.status(400).json({ error: String(error) });
  }
});

// GET /api/reading/by-type/:type - Get reading by passage type
readingRouter.get('/by-type/:type', (req: Request<{ type: string }>, res: Response) => {
  try {
    const passageType = ReadingPassageType.parse(req.params.type);
    const reading = readingService.getReadingByType(passageType);
    res.json({ reading, count: reading.length } as ReadingListResponse);
  } catch (error) {
    res.status(400).json({ error: 'Invalid passage type' });
  }
});

// GET /api/reading/by-topic/:topic - Get reading by topic
readingRouter.get('/by-topic/:topic', (req: Request<{ topic: string }>, res: Response) => {
  const reading = readingService.getReadingByTopic(req.params.topic);
  res.json({ reading, count: reading.length } as ReadingListResponse);
});

// GET /api/reading/:id - Get single reading passage by ID
readingRouter.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const reading = readingService.getReadingPassage(req.params.id);
  if (!reading) {
    res.status(404).json({ error: 'Reading passage not found' });
    return;
  }
  res.json({ reading } as ReadingSingleResponse);
});

// POST /api/reading/generate - AI-generate reading passage
readingRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const request = ReadingGenerateSchema.parse(req.body);

    const prompt = buildReadingGenerationPrompt(request);

    const generatedReading = await llm.completeJson<{ reading: ReadingPassage }>(
      [{ role: 'user', content: prompt }],
      z.object({
        reading: ReadingPassage,
      })
    );

    // Calculate word and character counts if not provided
    const reading = {
      ...generatedReading.reading,
      characterCount: generatedReading.reading.content.length,
      wordCount: generatedReading.reading.content.split(/\s+/).length,
    };

    // Add to service
    readingService.addReadingPassage(reading);

    res.json({ reading } as ReadingSingleResponse);
  } catch (error) {
    console.error('Error generating reading:', error);
    res.status(500).json({ error: String(error) });
  }
});

function buildReadingGenerationPrompt(request: z.infer<typeof ReadingGenerateSchema>): string {
  const lengthGuide = {
    short: '200-400 characters',
    medium: '400-800 characters',
    long: '800-1200 characters',
    comparison: '300-500 characters per text',
    information: '150-300 characters with structured data',
  };

  const parts: string[] = [
    'Generate a JLPT N1 reading passage in JSON format.',
    '',
    `Passage type: ${request.passageType}`,
    `Target length: ${lengthGuide[request.passageType]}`,
    `Number of questions: ${request.questionCount}`,
  ];

  if (request.topic) {
    parts.push(`Topic: ${request.topic}`);
  }

  if (request.genre) {
    parts.push(`Genre: ${request.genre}`);
  }

  parts.push('');
  parts.push('Create a natural Japanese passage appropriate for JLPT N1 level.');
  parts.push('The passage should use N1-level vocabulary and grammar.');
  parts.push('');
  parts.push('For the reading passage, provide:');
  parts.push('- id: unique identifier (format: reading-XXX)');
  parts.push('- passageType: the passage type');
  parts.push('- title: optional title');
  parts.push('- content: the Japanese passage text');
  parts.push('- wordCount: approximate word count');
  parts.push('- characterCount: character count');
  parts.push('- questions: array of comprehension questions (4 options each)');
  parts.push('- estimatedMinutes: estimated reading time in minutes');

  if (request.includeVocabulary) {
    parts.push('- keyVocabulary: array of 3-5 key vocabulary items with word, reading, meaning');
  }

  if (request.includeGrammar) {
    parts.push('- keyGrammar: array of 2-3 key grammar patterns used');
  }

  parts.push('');
  parts.push('Each question should have:');
  parts.push('- id, questionText, questionTextJp (optional)');
  parts.push('- options: exactly 4 choices');
  parts.push('- correctOption: index 0-3');
  parts.push('- explanation: why the answer is correct');
  parts.push('');
  parts.push('Return a JSON object with a "reading" object.');

  return parts.join('\n');
}

// Export the service for state management
export { readingRouter, readingService };
