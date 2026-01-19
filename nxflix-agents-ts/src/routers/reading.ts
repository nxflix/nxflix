import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { readingRepository } from '../db/repositories/index.js';
import { ReadingPassage, ReadingGenerateRequest, ReadingPassageType } from '../models/reading.js';
import { LLMProvider } from '../providers/llm.js';
import type { Reading as DbReading } from '../db/schema.js';

type ReadingPassageModel = z.infer<typeof ReadingPassage>;

const llm = new LLMProvider();
const readingRouter = Router();

// Convert database record to model type
function dbToModel(db: DbReading): ReadingPassageModel {
  // Normalize keyVocabulary to always be an array of objects
  const keyVocabulary = (db.keyVocabulary || []).map(item => {
    if (typeof item === 'string') {
      return { word: item, reading: '', meaning: '' };
    }
    return item as { word: string; reading: string; meaning: string };
  });

  return {
    id: db.id,
    passageType: db.passageType as ReadingPassageModel['passageType'],
    title: db.title || undefined,
    content: db.content,
    wordCount: db.wordCount,
    characterCount: db.content.length,
    questions: db.questions,
    keyVocabulary,
    keyGrammar: [],
    level: db.level,
    contentType: 'reading',
    estimatedMinutes: db.estimatedMinutes || 5,
  };
}

// Request schemas
const ReadingSearchSchema = z.object({
  query: z.string().min(1),
});

const ReadingGenerateSchema = ReadingGenerateRequest;

// Response types
interface ReadingListResponse {
  reading: ReadingPassageModel[];
  count: number;
}

interface ReadingSingleResponse {
  reading: ReadingPassageModel;
}

// GET /api/reading - List all reading passages
readingRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const dbResults = await readingRepository.findAll();
    const reading = dbResults.map(dbToModel);
    res.json({ reading, count: reading.length } as ReadingListResponse);
  } catch (error) {
    console.error('Error fetching reading:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/reading/search - Search reading passages
readingRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const { query } = ReadingSearchSchema.parse(req.query);
    const dbResults = await readingRepository.search(query);
    const reading = dbResults.map(dbToModel);
    res.json({ reading, count: reading.length } as ReadingListResponse);
  } catch (error) {
    console.error('Error searching reading:', error);
    res.status(400).json({ error: String(error) });
  }
});

// GET /api/reading/by-type/:type - Get reading by passage type
readingRouter.get('/by-type/:type', async (req: Request<{ type: string }>, res: Response) => {
  try {
    const passageType = ReadingPassageType.parse(req.params.type);
    const dbResults = await readingRepository.findByPassageType(passageType);
    const reading = dbResults.map(dbToModel);
    res.json({ reading, count: reading.length } as ReadingListResponse);
  } catch (error) {
    res.status(400).json({ error: 'Invalid passage type' });
  }
});

// GET /api/reading/by-topic/:topic - Get reading by topic
readingRouter.get('/by-topic/:topic', async (req: Request<{ topic: string }>, res: Response) => {
  try {
    const dbResults = await readingRepository.search(req.params.topic);
    const reading = dbResults.map(dbToModel);
    res.json({ reading, count: reading.length } as ReadingListResponse);
  } catch (error) {
    console.error('Error fetching reading by topic:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/reading/:id - Get single reading passage by ID
readingRouter.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const dbResult = await readingRepository.findById(req.params.id);
    if (!dbResult) {
      res.status(404).json({ error: 'Reading passage not found' });
      return;
    }
    res.json({ reading: dbToModel(dbResult) } as ReadingSingleResponse);
  } catch (error) {
    console.error('Error fetching reading:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/reading/generate - AI-generate reading passage (does NOT save)
readingRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const request = ReadingGenerateSchema.parse(req.body);

    const prompt = buildReadingGenerationPrompt(request);

    const generatedReading = await llm.completeJson<{ reading: ReadingPassageModel }>(
      [{ role: 'user', content: prompt }],
      z.object({
        reading: ReadingPassage,
      })
    );

    // Calculate word and character counts if not provided
    const readingData = {
      ...generatedReading.reading,
      characterCount: generatedReading.reading.content.length,
      wordCount: generatedReading.reading.content.split(/\s+/).length,
    };

    // Return generated content without saving
    res.json({ reading: readingData } as ReadingSingleResponse);
  } catch (error) {
    console.error('Error generating reading:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/reading/save - Save reading passage to database
readingRouter.post('/save', async (req: Request, res: Response) => {
  try {
    const { reading, isPublic, userId } = req.body as {
      reading: ReadingPassageModel;
      isPublic?: boolean;
      userId?: string;
    };
    if (!reading) {
      res.status(400).json({ error: 'reading object is required' });
      return;
    }

    const saved = await readingRepository.upsert({
      id: reading.id,
      passageType: reading.passageType,
      title: reading.title,
      content: reading.content,
      wordCount: reading.wordCount,
      questions: reading.questions,
      keyVocabulary: reading.keyVocabulary || [],
      level: reading.level || 'N1',
      estimatedMinutes: reading.estimatedMinutes || 5,
      isPublic: isPublic ?? false,
      createdBy: userId,
    });

    res.json({ reading: dbToModel(saved), saved: true } as ReadingSingleResponse & { saved: boolean });
  } catch (error) {
    console.error('Error saving reading:', error);
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

export { readingRouter };
