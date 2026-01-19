import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { grammarRepository } from '../db/repositories/index.js';
import { GrammarPoint, GrammarCategory, type GrammarPoint as GrammarPointType } from '../models/grammar.js';
import { LLMProvider } from '../providers/llm.js';
import type { Grammar as DbGrammar } from '../db/schema.js';

const llm = new LLMProvider();
const grammarRouter = Router();

// Request schemas
const GrammarGenerateSchema = z.object({
  topic: z.string().optional(),
  category: GrammarCategory.optional(),
  count: z.number().int().min(1).max(20).default(5),
});

// Response types
interface GrammarListResponse {
  grammar: GrammarPointType[];
  count: number;
}

interface GrammarSingleResponse {
  grammar: GrammarPointType;
}

// Convert database record to model type
function dbToModel(db: DbGrammar): GrammarPointType {
  return {
    id: db.id,
    pattern: db.pattern,
    meaning: db.meaning,
    meaningJp: db.meaningJp,
    example: db.example,
    exampleTranslation: db.exampleTranslation || '',
    category: (db.category as GrammarPointType['category']) || 'other',
    level: db.level,
    notes: db.usageNotes,
    relatedPatterns: db.relatedPatterns || [],
  };
}

// GET /api/grammar - List all grammar points
grammarRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const dbResults = await grammarRepository.findAll();
    const grammar = dbResults.map(dbToModel);
    res.json({ grammar, count: grammar.length } as GrammarListResponse);
  } catch (error) {
    console.error('Error fetching grammar:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/grammar/search - Search grammar points
grammarRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.query as string) || '';
    if (!query) {
      res.status(400).json({ error: 'Query parameter required' });
      return;
    }
    const dbResults = await grammarRepository.search(query);
    const grammar = dbResults.map(dbToModel);
    res.json({ grammar, count: grammar.length } as GrammarListResponse);
  } catch (error) {
    console.error('Error searching grammar:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/grammar/by-category/:category - Get grammar by category
grammarRouter.get('/by-category/:category', async (req: Request<{ category: string }>, res: Response) => {
  try {
    const dbResults = await grammarRepository.findByCategory(req.params.category);
    const grammar = dbResults.map(dbToModel);
    res.json({ grammar, count: grammar.length } as GrammarListResponse);
  } catch (error) {
    console.error('Error fetching grammar by category:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/grammar/:id - Get single grammar by ID
grammarRouter.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const dbResult = await grammarRepository.findById(req.params.id);
    if (!dbResult) {
      res.status(404).json({ error: 'Grammar point not found' });
      return;
    }
    const grammar = dbToModel(dbResult);
    res.json({ grammar } as GrammarSingleResponse);
  } catch (error) {
    console.error('Error fetching grammar:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/grammar/generate - AI-generate grammar points (does NOT save)
grammarRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const request = GrammarGenerateSchema.parse(req.body);
    const prompt = buildGrammarGenerationPrompt(request);

    const generated = await llm.completeJson<{ grammar: GrammarPointType[] }>(
      [{ role: 'user', content: prompt }],
      z.object({
        grammar: z.array(GrammarPoint),
      })
    );

    // Return generated content without saving
    res.json({ grammar: generated.grammar, count: generated.grammar.length } as GrammarListResponse);
  } catch (error) {
    console.error('Error generating grammar:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/grammar/save - Save grammar points to database
grammarRouter.post('/save', async (req: Request, res: Response) => {
  try {
    const { grammar, isPublic, userId } = req.body as {
      grammar: GrammarPointType[];
      isPublic?: boolean;
      userId?: string;
    };
    if (!grammar || !Array.isArray(grammar)) {
      res.status(400).json({ error: 'grammar array is required' });
      return;
    }

    const savedGrammar: GrammarPointType[] = [];
    for (const item of grammar) {
      const saved = await grammarRepository.upsert({
        id: item.id,
        pattern: item.pattern,
        meaning: item.meaning,
        meaningJp: item.meaningJp,
        example: item.example,
        exampleTranslation: item.exampleTranslation,
        category: item.category,
        level: item.level,
        usageNotes: item.notes,
        relatedPatterns: item.relatedPatterns,
        isPublic: isPublic ?? false,
        createdBy: userId,
      });
      savedGrammar.push(dbToModel(saved));
    }

    res.json({ grammar: savedGrammar, count: savedGrammar.length, saved: true } as GrammarListResponse & { saved: boolean });
  } catch (error) {
    console.error('Error saving grammar:', error);
    res.status(500).json({ error: String(error) });
  }
});

function buildGrammarGenerationPrompt(request: z.infer<typeof GrammarGenerateSchema>): string {
  const parts: string[] = [
    'Generate JLPT N1 grammar data in JSON format.',
    '',
  ];

  if (request.topic) {
    parts.push(`Generate ${request.count} grammar points related to the topic: ${request.topic}`);
  } else {
    parts.push(`Generate ${request.count} random JLPT N1 grammar points.`);
  }

  if (request.category) {
    parts.push(`Focus on ${request.category} grammar patterns.`);
  }

  parts.push('');
  parts.push('For each grammar point, provide:');
  parts.push('- id: unique identifier (format: grammar-XXX)');
  parts.push('- pattern: the grammar pattern');
  parts.push('- meaning: English meaning');
  parts.push('- meaningJp: Japanese explanation (optional)');
  parts.push('- example: example sentence in Japanese');
  parts.push('- exampleTranslation: English translation of example');
  parts.push('- category: one of: formal, classical, conjunctive, conditional, comparative, emphasis, negative, temporal, causative, other');
  parts.push('- level: "N1"');
  parts.push('- notes: usage notes (optional)');
  parts.push('- relatedPatterns: array of related grammar patterns (optional)');
  parts.push('');
  parts.push('Return a JSON object with a "grammar" array containing the grammar objects.');

  return parts.join('\n');
}

export { grammarRouter };
