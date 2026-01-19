import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { settings } from '../config.js';

/**
 * Character in a script.
 */
export interface ScriptCharacter {
  id: string;
  name: string;
  nameJapanese: string;
  role: string; // e.g., "protagonist", "supporting", "narrator"
  description: string;
  voiceType: string; // e.g., "female_young", "male_mature"
}

/**
 * A single line of dialogue or action in the script.
 */
export interface ScriptLine {
  type: 'dialogue' | 'action' | 'direction' | 'transition';
  characterId?: string; // For dialogue
  japanese: string;
  english: string;
  notes?: string; // Director's notes, emotion, etc.
  duration?: number; // Estimated duration in seconds
}

/**
 * A scene in the script.
 */
export interface ScriptScene {
  sceneNumber: number;
  location: string;
  locationJapanese: string;
  timeOfDay: string;
  description: string;
  lines: ScriptLine[];
  learningFocus?: string[]; // Grammar/vocab being taught in this scene
}

/**
 * Complete Hollywood-style script.
 */
export interface Script {
  title: string;
  titleJapanese: string;
  genre: string;
  targetLevel: string; // e.g., "JLPT N1"
  synopsis: string;
  synopsisJapanese: string;
  characters: ScriptCharacter[];
  scenes: ScriptScene[];
  totalDuration: number; // Estimated total duration in seconds
  learningObjectives: {
    grammar: string[];
    vocabulary: string[];
    kanji: string[];
    culturalNotes?: string[];
  };
}

/**
 * Request to generate a script.
 */
export interface GenerateScriptRequest {
  /** Grammar points to incorporate */
  grammar?: Array<{ pattern: string; meaning: string; example?: string }>;
  /** Vocabulary to incorporate */
  vocabulary?: Array<{ word: string; reading?: string; meaning: string }>;
  /** Kanji to feature */
  kanji?: Array<{ character: string; meaning: string; readings?: string[] }>;
  /** Scene genre/style */
  genre: string;
  /** Additional context or scene description */
  context?: string;
  /** Target duration in seconds */
  targetDuration?: number;
  /** Number of characters */
  characterCount?: number;
  /** JLPT level */
  level?: string;
}

const SCRIPT_SYSTEM_PROMPT = `You are a professional Japanese screenwriter creating educational content for language learners. Your scripts should be:

1. **Authentic**: Natural Japanese dialogue that native speakers would actually use
2. **Educational**: Naturally incorporate the specified grammar, vocabulary, and kanji
3. **Engaging**: Interesting scenarios that make learning enjoyable
4. **Clear**: Include helpful context for language learners

Format your scripts in a professional Hollywood screenplay style with:
- Scene headings (INT./EXT. LOCATION - TIME)
- Character introductions
- Action lines describing what characters do
- Dialogue with character names
- Parenthetical directions for emotion/delivery

Always provide both Japanese and English for dialogue and key descriptions.`;

/**
 * Script Generator Service using LLM.
 */
export class ScriptGeneratorService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;

  constructor() {
    if (settings.openaiApiKey) {
      this.openai = new OpenAI({ apiKey: settings.openaiApiKey });
    }
    if (settings.anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: settings.anthropicApiKey });
    }
  }

  /**
   * Generate a Hollywood-style script from learning content.
   */
  async generateScript(request: GenerateScriptRequest): Promise<Script> {
    const prompt = this.buildPrompt(request);

    console.log('[ScriptGenerator] Generating script with prompt length:', prompt.length);

    let scriptJson: string;

    // Prefer Claude for better Japanese handling, but fallback to OpenAI on error
    if (this.anthropic) {
      try {
        scriptJson = await this.generateWithClaude(prompt);
      } catch (error) {
        console.error('[ScriptGenerator] Claude failed, trying OpenAI fallback:', error);
        if (this.openai) {
          scriptJson = await this.generateWithOpenAI(prompt);
        } else {
          throw error;
        }
      }
    } else if (this.openai) {
      scriptJson = await this.generateWithOpenAI(prompt);
    } else {
      throw new Error('No LLM provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.');
    }

    // Parse and validate the script
    try {
      const script = JSON.parse(scriptJson) as Script;
      console.log('[ScriptGenerator] Generated script:', script.title);
      return script;
    } catch (error) {
      console.error('[ScriptGenerator] Failed to parse script JSON:', error);
      throw new Error('Failed to parse generated script');
    }
  }

  private buildPrompt(request: GenerateScriptRequest): string {
    const parts: string[] = [];

    parts.push(`Generate a Japanese language learning script in JSON format.`);
    parts.push(`\n## Requirements:`);
    parts.push(`- Genre: ${request.genre}`);
    parts.push(`- Target Level: ${request.level || 'JLPT N1'}`);
    parts.push(`- Target Duration: ${request.targetDuration || 60} seconds`);
    parts.push(`- Number of Characters: ${request.characterCount || 2}`);

    if (request.context) {
      parts.push(`- Scene Context: ${request.context}`);
    }

    if (request.grammar && request.grammar.length > 0) {
      parts.push(`\n## Grammar Points to Incorporate:`);
      request.grammar.forEach((g, i) => {
        parts.push(`${i + 1}. **${g.pattern}** - ${g.meaning}`);
        if (g.example) parts.push(`   Example: ${g.example}`);
      });
    }

    if (request.vocabulary && request.vocabulary.length > 0) {
      parts.push(`\n## Vocabulary to Include:`);
      request.vocabulary.forEach((v, i) => {
        parts.push(`${i + 1}. **${v.word}** (${v.reading || ''}) - ${v.meaning}`);
      });
    }

    if (request.kanji && request.kanji.length > 0) {
      parts.push(`\n## Kanji to Feature:`);
      request.kanji.forEach((k, i) => {
        parts.push(`${i + 1}. **${k.character}** - ${k.meaning}`);
      });
    }

    parts.push(`\n## Output Format:
Return a JSON object with this exact structure:
{
  "title": "English Title",
  "titleJapanese": "Japanese Title",
  "genre": "${request.genre}",
  "targetLevel": "${request.level || 'JLPT N1'}",
  "synopsis": "Brief English synopsis",
  "synopsisJapanese": "Brief Japanese synopsis",
  "characters": [
    {
      "id": "char1",
      "name": "English Name",
      "nameJapanese": "Japanese Name",
      "role": "protagonist/supporting/narrator",
      "description": "Character description",
      "voiceType": "female_young/male_mature/etc"
    }
  ],
  "scenes": [
    {
      "sceneNumber": 1,
      "location": "INT. COFFEE SHOP - DAY",
      "locationJapanese": "カフェの中 - 昼",
      "timeOfDay": "day",
      "description": "Scene description",
      "lines": [
        {
          "type": "direction",
          "japanese": "（カメラがゆっくりとカフェに入る）",
          "english": "(Camera slowly enters the cafe)",
          "notes": "Establishing shot"
        },
        {
          "type": "action",
          "japanese": "ユキはコーヒーを飲みながら窓の外を見ている。",
          "english": "Yuki gazes out the window while sipping her coffee.",
          "characterId": "char1"
        },
        {
          "type": "dialogue",
          "characterId": "char1",
          "japanese": "今日の天気にかかわらず、散歩に行こうかな。",
          "english": "Regardless of today's weather, I think I'll go for a walk.",
          "notes": "(thoughtful, looking outside)",
          "duration": 4
        }
      ],
      "learningFocus": ["〜にかかわらず grammar point"]
    }
  ],
  "totalDuration": 60,
  "learningObjectives": {
    "grammar": ["Pattern 1", "Pattern 2"],
    "vocabulary": ["word1", "word2"],
    "kanji": ["漢字1", "漢字2"],
    "culturalNotes": ["Optional cultural context"]
  }
}

Make sure all dialogue naturally incorporates the specified grammar and vocabulary. The script should feel like a real movie scene, not a textbook exercise.`);

    return parts.join('\n');
  }

  private async generateWithClaude(prompt: string): Promise<string> {
    if (!this.anthropic) throw new Error('Anthropic not configured');

    console.log('[ScriptGenerator] Using Claude for script generation...');

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SCRIPT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from the response (may be wrapped in markdown)
    let text = content.text;
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      text = jsonMatch[1];
    } else {
      // Try to find raw JSON
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        text = text.slice(startIdx, endIdx + 1);
      }
    }

    return text;
  }

  private async generateWithOpenAI(prompt: string): Promise<string> {
    if (!this.openai) throw new Error('OpenAI not configured');

    console.log('[ScriptGenerator] Using OpenAI for script generation...');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SCRIPT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return content;
  }

  /**
   * Extract dialogue text from a script for TTS.
   */
  extractDialogueText(script: Script, characterId?: string): string {
    const lines: string[] = [];

    for (const scene of script.scenes) {
      for (const line of scene.lines) {
        if (line.type === 'dialogue') {
          if (!characterId || line.characterId === characterId) {
            lines.push(line.japanese);
          }
        }
      }
    }

    return lines.join('\n\n');
  }

  /**
   * Get the first speaking character's dialogue for a quick video.
   */
  getFirstCharacterDialogue(script: Script): { characterId: string; text: string } | null {
    for (const scene of script.scenes) {
      for (const line of scene.lines) {
        if (line.type === 'dialogue' && line.characterId) {
          return {
            characterId: line.characterId,
            text: line.japanese,
          };
        }
      }
    }
    return null;
  }
}

// Export singleton instance
export const scriptGeneratorService = new ScriptGeneratorService();
