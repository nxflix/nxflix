import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { VocabularyService } from '../services/vocabulary.js';
import { VocabularyItem, VocabularyGenerateRequest, PartOfSpeech } from '../models/vocabulary.js';
import { LLMProvider } from '../providers/llm.js';

const llm = new LLMProvider();
const vocabularyRouter = Router();

// Singleton vocabulary service
const vocabularyService = new VocabularyService();

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
vocabularyRouter.get('/', (_req: Request, res: Response) => {
  const vocabulary = vocabularyService.getAllVocabularyItems();
  res.json({ vocabulary, count: vocabulary.length } as VocabularyListResponse);
});

// GET /api/vocabulary/search - Search vocabulary
vocabularyRouter.get('/search', (req: Request, res: Response) => {
  try {
    const { query } = VocabularySearchSchema.parse(req.query);
    const vocabulary = vocabularyService.searchVocabulary(query);
    res.json({ vocabulary, count: vocabulary.length } as VocabularyListResponse);
  } catch (error) {
    console.error('Error searching vocabulary:', error);
    res.status(400).json({ error: String(error) });
  }
});

// GET /api/vocabulary/by-word/:word - Get vocabulary by word
vocabularyRouter.get('/by-word/:word', (req: Request<{ word: string }>, res: Response) => {
  const vocabulary = vocabularyService.getVocabularyByWord(req.params.word);
  if (!vocabulary) {
    res.status(404).json({ error: 'Vocabulary not found' });
    return;
  }
  res.json({ vocabulary } as VocabularySingleResponse);
});

// GET /api/vocabulary/by-pos/:pos - Get vocabulary by part of speech
vocabularyRouter.get('/by-pos/:pos', (req: Request<{ pos: string }>, res: Response) => {
  try {
    const partOfSpeech = PartOfSpeech.parse(req.params.pos);
    const vocabulary = vocabularyService.getVocabularyByPartOfSpeech(partOfSpeech);
    res.json({ vocabulary, count: vocabulary.length } as VocabularyListResponse);
  } catch (error) {
    res.status(400).json({ error: 'Invalid part of speech' });
  }
});

// GET /api/vocabulary/:id - Get single vocabulary by ID
vocabularyRouter.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const vocabulary = vocabularyService.getVocabularyItem(req.params.id);
  if (!vocabulary) {
    res.status(404).json({ error: 'Vocabulary not found' });
    return;
  }
  res.json({ vocabulary } as VocabularySingleResponse);
});

// POST /api/vocabulary/generate - AI-generate vocabulary set
vocabularyRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const request = VocabularyGenerateSchema.parse(req.body);

    const prompt = buildVocabularyGenerationPrompt(request);

    const generatedVocabulary = await llm.completeJson<{ vocabulary: VocabularyItem[] }>(
      [{ role: 'user', content: prompt }],
      z.object({
        vocabulary: z.array(VocabularyItem),
      })
    );

    // Add generated vocabulary to service
    for (const vocab of generatedVocabulary.vocabulary) {
      vocabularyService.addVocabularyItem(vocab);
    }

    res.json({
      vocabulary: generatedVocabulary.vocabulary,
      count: generatedVocabulary.vocabulary.length,
    } as VocabularyListResponse);
  } catch (error) {
    console.error('Error generating vocabulary:', error);
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

// Export the service for state management
export { vocabularyRouter, vocabularyService };
