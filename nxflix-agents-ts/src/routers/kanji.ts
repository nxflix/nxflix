import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { KanjiService } from '../services/kanji.js';
import { KanjiItem, KanjiGenerateRequest } from '../models/kanji.js';
import { LLMProvider } from '../providers/llm.js';

const llm = new LLMProvider();

const kanjiRouter = Router();

// Singleton kanji service
const kanjiService = new KanjiService();

// Request schemas
const KanjiSearchSchema = z.object({
  query: z.string().min(1),
});

const KanjiGenerateSchema = KanjiGenerateRequest;

// Response types
interface KanjiListResponse {
  kanji: KanjiItem[];
  count: number;
}

interface KanjiSingleResponse {
  kanji: KanjiItem;
}

// GET /api/kanji - List all kanji items
kanjiRouter.get('/', (_req: Request, res: Response) => {
  const kanji = kanjiService.getAllKanjiItems();
  res.json({ kanji, count: kanji.length } as KanjiListResponse);
});

// GET /api/kanji/search - Search kanji
kanjiRouter.get('/search', (req: Request, res: Response) => {
  try {
    const { query } = KanjiSearchSchema.parse(req.query);
    const kanji = kanjiService.searchKanji(query);
    res.json({ kanji, count: kanji.length } as KanjiListResponse);
  } catch (error) {
    console.error('Error searching kanji:', error);
    res.status(400).json({ error: String(error) });
  }
});

// GET /api/kanji/by-character/:char - Get kanji by character
kanjiRouter.get('/by-character/:char', (req: Request<{ char: string }>, res: Response) => {
  const kanji = kanjiService.getKanjiByCharacter(req.params.char);
  if (!kanji) {
    res.status(404).json({ error: 'Kanji not found' });
    return;
  }
  res.json({ kanji } as KanjiSingleResponse);
});

// GET /api/kanji/:id - Get single kanji by ID
kanjiRouter.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const kanji = kanjiService.getKanjiItem(req.params.id);
  if (!kanji) {
    res.status(404).json({ error: 'Kanji not found' });
    return;
  }
  res.json({ kanji } as KanjiSingleResponse);
});

// POST /api/kanji/generate - AI-generate kanji set
kanjiRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const request = KanjiGenerateSchema.parse(req.body);

    const prompt = buildKanjiGenerationPrompt(request);

    const generatedKanji = await llm.completeJson<{ kanji: KanjiItem[] }>(
      [{ role: 'user', content: prompt }],
      z.object({
        kanji: z.array(KanjiItem),
      })
    );

    // Add generated kanji to service
    for (const kanji of generatedKanji.kanji) {
      kanjiService.addKanjiItem(kanji);
    }

    res.json({ kanji: generatedKanji.kanji, count: generatedKanji.kanji.length } as KanjiListResponse);
  } catch (error) {
    console.error('Error generating kanji:', error);
    res.status(500).json({ error: String(error) });
  }
});

function buildKanjiGenerationPrompt(request: z.infer<typeof KanjiGenerateSchema>): string {
  const parts: string[] = [
    'Generate JLPT N1 kanji data in JSON format.',
    '',
  ];

  if (request.characters && request.characters.length > 0) {
    parts.push(`Generate data for these specific kanji: ${request.characters.join(', ')}`);
  } else if (request.topic) {
    parts.push(`Generate ${request.count} kanji related to the topic: ${request.topic}`);
  } else {
    parts.push(`Generate ${request.count} random JLPT N1 kanji.`);
  }

  parts.push('');
  parts.push('For each kanji, provide:');
  parts.push('- id: unique identifier (format: kanji-XXX)');
  parts.push('- character: the single kanji character');
  parts.push('- strokeCount: number of strokes');
  parts.push('- onyomi: array of on readings in katakana');
  parts.push('- kunyomi: array of kun readings in hiragana');
  parts.push('- meanings: array of English meanings');
  parts.push('- radicals: array of radical components');

  if (request.includeCompounds) {
    parts.push('- compoundWords: array of 2-3 compound words with word, reading, and meaning');
  }

  parts.push('- mnemonics: a helpful memory aid (optional)');
  parts.push('');
  parts.push('Return a JSON object with a "kanji" array containing the kanji objects.');

  return parts.join('\n');
}

// Export the service for state management
export { kanjiRouter, kanjiService };
