import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { vocabularyRepository } from '../db/repositories/index.js';
import { VocabularyItem, VocabularyGenerateRequest, PartOfSpeech, type VocabularyItem as VocabularyItemType } from '../models/vocabulary.js';
import { LLMProvider } from '../providers/llm.js';
import type { Vocabulary as DbVocabulary } from '../db/schema.js';

const llm = new LLMProvider();
const vocabularyRouter = Router();

// Convert database record to model type
function dbToModel(db: DbVocabulary): VocabularyItemType {
  return {
    id: db.id,
    word: db.word,
    reading: db.reading,
    meanings: db.meanings,
    partOfSpeech: db.partOfSpeech as VocabularyItemType['partOfSpeech'],
    examples: db.examples || [],
    synonyms: db.synonyms || [],
    antonyms: [],
    level: db.level,
    audioUrl: db.audioUrl || undefined,
    contentType: 'vocabulary',
  };
}

// Request schemas
const VocabularySearchSchema = z.object({
  query: z.string().min(1),
});

const VocabularyGenerateSchema = VocabularyGenerateRequest;

// Response types
interface VocabularyListResponse {
  vocabulary: VocabularyItem[];
  count: number;
}

interface VocabularySingleResponse {
  vocabulary: VocabularyItem;
}

// GET /api/vocabulary - List all vocabulary items
vocabularyRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const dbResults = await vocabularyRepository.findAll();
    const vocabulary = dbResults.map(dbToModel);
    res.json({ vocabulary, count: vocabulary.length } as VocabularyListResponse);
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/vocabulary/search - Search vocabulary
vocabularyRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const { query } = VocabularySearchSchema.parse(req.query);
    const dbResults = await vocabularyRepository.search(query);
    const vocabulary = dbResults.map(dbToModel);
    res.json({ vocabulary, count: vocabulary.length } as VocabularyListResponse);
  } catch (error) {
    console.error('Error searching vocabulary:', error);
    res.status(400).json({ error: String(error) });
  }
});

// GET /api/vocabulary/by-word/:word - Get vocabulary by word
vocabularyRouter.get('/by-word/:word', async (req: Request<{ word: string }>, res: Response) => {
  try {
    const dbResults = await vocabularyRepository.search(req.params.word);
    const match = dbResults.find(v => v.word === req.params.word);
    if (!match) {
      res.status(404).json({ error: 'Vocabulary not found' });
      return;
    }
    res.json({ vocabulary: dbToModel(match) } as VocabularySingleResponse);
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/vocabulary/by-pos/:pos - Get vocabulary by part of speech
vocabularyRouter.get('/by-pos/:pos', async (req: Request<{ pos: string }>, res: Response) => {
  try {
    const partOfSpeech = PartOfSpeech.parse(req.params.pos);
    const dbResults = await vocabularyRepository.findByPartOfSpeech(partOfSpeech);
    const vocabulary = dbResults.map(dbToModel);
    res.json({ vocabulary, count: vocabulary.length } as VocabularyListResponse);
  } catch (error) {
    res.status(400).json({ error: 'Invalid part of speech' });
  }
});

// GET /api/vocabulary/:id - Get single vocabulary by ID
vocabularyRouter.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const dbResult = await vocabularyRepository.findById(req.params.id);
    if (!dbResult) {
      res.status(404).json({ error: 'Vocabulary not found' });
      return;
    }
    res.json({ vocabulary: dbToModel(dbResult) } as VocabularySingleResponse);
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/vocabulary/generate - AI-generate vocabulary set (does NOT save)
vocabularyRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const request = VocabularyGenerateSchema.parse(req.body);

    const prompt = buildVocabularyGenerationPrompt(request);

    const generatedVocabulary = await llm.completeJson<{ vocabulary: VocabularyItemType[] }>(
      [{ role: 'user', content: prompt }],
      z.object({
        vocabulary: z.array(VocabularyItem),
      })
    );

    // Return generated content without saving
    res.json({
      vocabulary: generatedVocabulary.vocabulary,
      count: generatedVocabulary.vocabulary.length,
    } as VocabularyListResponse);
  } catch (error) {
    console.error('Error generating vocabulary:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/vocabulary/save - Save vocabulary to database
vocabularyRouter.post('/save', async (req: Request, res: Response) => {
  try {
    const { vocabulary, isPublic, userId } = req.body as {
      vocabulary: VocabularyItemType[];
      isPublic?: boolean;
      userId?: string;
    };
    if (!vocabulary || !Array.isArray(vocabulary)) {
      res.status(400).json({ error: 'vocabulary array is required' });
      return;
    }

    const savedVocabulary: VocabularyItemType[] = [];
    for (const vocab of vocabulary) {
      const saved = await vocabularyRepository.upsert({
        id: vocab.id,
        word: vocab.word,
        reading: vocab.reading,
        meanings: vocab.meanings,
        partOfSpeech: vocab.partOfSpeech,
        examples: vocab.examples || [],
        synonyms: vocab.synonyms || [],
        level: vocab.level || 'N1',
        audioUrl: vocab.audioUrl,
        isPublic: isPublic ?? false,
        createdBy: userId,
      });
      savedVocabulary.push(dbToModel(saved));
    }

    res.json({
      vocabulary: savedVocabulary,
      count: savedVocabulary.length,
      saved: true,
    } as VocabularyListResponse & { saved: boolean });
  } catch (error) {
    console.error('Error saving vocabulary:', error);
    res.status(500).json({ error: String(error) });
  }
});

function buildVocabularyGenerationPrompt(request: z.infer<typeof VocabularyGenerateSchema>): string {
  const parts: string[] = [
    'Generate JLPT N1 vocabulary data in JSON format.',
    '',
  ];

  if (request.topic) {
    parts.push(`Generate ${request.count} vocabulary items related to the topic: ${request.topic}`);
  } else {
    parts.push(`Generate ${request.count} random JLPT N1 vocabulary items.`);
  }

  if (request.partOfSpeech) {
    parts.push(`Focus on ${request.partOfSpeech} words.`);
  }

  parts.push('');
  parts.push('For each vocabulary item, provide:');
  parts.push('- id: unique identifier (format: vocab-XXX)');
  parts.push('- word: the word in kanji (if applicable)');
  parts.push('- reading: the reading in hiragana');
  parts.push('- meanings: array of English meanings');
  parts.push('- partOfSpeech: one of: noun, verb, adjective_i, adjective_na, adverb, particle, conjunction, expression');

  if (request.includeExamples) {
    parts.push('- examples: array of 1-2 example sentences with sentence and translation');
  }

  parts.push('- synonyms: array of synonymous words (optional)');
  parts.push('- antonyms: array of antonymous words (optional)');
  parts.push('- notes: any additional notes about usage (optional)');
  parts.push('');
  parts.push('Return a JSON object with a "vocabulary" array containing the vocabulary objects.');

  return parts.join('\n');
}

export { vocabularyRouter };
