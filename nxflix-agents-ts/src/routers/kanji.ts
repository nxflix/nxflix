import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { kanjiRepository } from '../db/repositories/index.js';
import { KanjiItem, KanjiGenerateRequest, type KanjiItem as KanjiItemType } from '../models/kanji.js';
import { LLMProvider } from '../providers/llm.js';
import type { Kanji as DbKanji } from '../db/schema.js';

const llm = new LLMProvider();
const kanjiRouter = Router();

// Convert database record to model type
function dbToModel(db: DbKanji): KanjiItemType {
  return {
    id: db.id,
    character: db.character,
    strokeCount: db.strokeCount,
    onyomi: db.onyomi,
    kunyomi: db.kunyomi,
    meanings: db.meanings,
    radicals: db.radicals || [],
    compoundWords: db.compoundWords || [],
    mnemonics: db.mnemonics || undefined,
    level: db.level,
    contentType: 'kanji',
  };
}

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
kanjiRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const dbResults = await kanjiRepository.findAll();
    const kanji = dbResults.map(dbToModel);
    res.json({ kanji, count: kanji.length } as KanjiListResponse);
  } catch (error) {
    console.error('Error fetching kanji:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/kanji/search - Search kanji
kanjiRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const { query } = KanjiSearchSchema.parse(req.query);
    const dbResults = await kanjiRepository.search(query);
    const kanji = dbResults.map(dbToModel);
    res.json({ kanji, count: kanji.length } as KanjiListResponse);
  } catch (error) {
    console.error('Error searching kanji:', error);
    res.status(400).json({ error: String(error) });
  }
});

// GET /api/kanji/by-character/:char - Get kanji by character
kanjiRouter.get('/by-character/:char', async (req: Request<{ char: string }>, res: Response) => {
  try {
    const dbResult = await kanjiRepository.findByCharacter(req.params.char);
    if (!dbResult) {
      res.status(404).json({ error: 'Kanji not found' });
      return;
    }
    res.json({ kanji: dbToModel(dbResult) } as KanjiSingleResponse);
  } catch (error) {
    console.error('Error fetching kanji:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/kanji/:id - Get single kanji by ID
kanjiRouter.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const dbResult = await kanjiRepository.findById(req.params.id);
    if (!dbResult) {
      res.status(404).json({ error: 'Kanji not found' });
      return;
    }
    res.json({ kanji: dbToModel(dbResult) } as KanjiSingleResponse);
  } catch (error) {
    console.error('Error fetching kanji:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/kanji/generate - AI-generate kanji set (does NOT save)
kanjiRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const request = KanjiGenerateSchema.parse(req.body);

    const prompt = buildKanjiGenerationPrompt(request);

    const generatedKanji = await llm.completeJson(
      [{ role: 'user', content: prompt }],
      z.object({
        kanji: z.array(KanjiItem),
      })
    );

    // Return generated content without saving
    res.json({ kanji: generatedKanji.kanji, count: generatedKanji.kanji.length } as KanjiListResponse);
  } catch (error) {
    console.error('Error generating kanji:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/kanji/save - Save kanji to database
kanjiRouter.post('/save', async (req: Request, res: Response) => {
  try {
    const { kanji, isPublic, userId } = req.body as {
      kanji: KanjiItemType[];
      isPublic?: boolean;
      userId?: string;
    };
    if (!kanji || !Array.isArray(kanji)) {
      res.status(400).json({ error: 'kanji array is required' });
      return;
    }

    const savedKanji: KanjiItemType[] = [];
    for (const item of kanji) {
      const saved = await kanjiRepository.upsert({
        id: item.id,
        character: item.character,
        strokeCount: item.strokeCount,
        onyomi: item.onyomi,
        kunyomi: item.kunyomi,
        meanings: item.meanings,
        radicals: item.radicals || [],
        compoundWords: item.compoundWords || [],
        mnemonics: item.mnemonics,
        level: item.level || 'N1',
        isPublic: isPublic ?? false,
        createdBy: userId,
      });
      savedKanji.push(dbToModel(saved));
    }

    res.json({ kanji: savedKanji, count: savedKanji.length, saved: true } as KanjiListResponse & { saved: boolean });
  } catch (error) {
    console.error('Error saving kanji:', error);
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

export { kanjiRouter };
