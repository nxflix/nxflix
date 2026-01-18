import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { LLMProvider } from '../providers/llm.js';
import { TTSService } from '../services/tts.js';
import { createTrace } from '../tracing/index.js';
import type { VocabularyItem, VocabularyGenerateRequest } from '../models/vocabulary.js';
import type { KanjiItem, KanjiGenerateRequest } from '../models/kanji.js';
import type { ReadingPassage, ReadingPassageType, ReadingGenerateRequest } from '../models/reading.js';
import type { ListeningItem, ListeningType, ListeningGenerateRequest } from '../models/listening.js';

/**
 * Response schemas for LLM-generated content.
 */
const GeneratedVocabulary = z.object({
  vocabulary: z.array(z.record(z.unknown())),
});

const GeneratedKanji = z.object({
  kanji: z.array(z.record(z.unknown())),
});

const GeneratedReading = z.object({
  reading: z.record(z.unknown()),
});

const GeneratedListening = z.object({
  listening: z.record(z.unknown()),
});

/**
 * ContentCreatorAgent handles AI-powered generation of JLPT N1 study content.
 * It can generate vocabulary sets, kanji data, reading passages, and listening exercises.
 */
export class ContentCreatorAgent {
  private llm: LLMProvider;
  private tts: TTSService;

  constructor(llmProvider?: LLMProvider, ttsService?: TTSService) {
    this.llm = llmProvider ?? new LLMProvider();
    this.tts = ttsService ?? new TTSService();
  }

  /**
   * Generate a set of vocabulary items.
   */
  async createVocabularySet(
    topic: string,
    count: number = 10,
    options?: {
      partOfSpeech?: string;
      includeExamples?: boolean;
      includeAudio?: boolean;
    }
  ): Promise<VocabularyItem[]> {
    const trace = createTrace('content_creator.create_vocabulary', {
      topic,
      count,
      options,
    });

    try {
      const prompt = this.buildVocabularyPrompt(topic, count, options);

      const result = await this.llm.completeJson<{ vocabulary: any[] }>(
        [{ role: 'user', content: prompt }],
        GeneratedVocabulary
      );

      const vocabulary = result.vocabulary.map((v) => ({
        ...v,
        id: v.id || `vocab-${uuidv4().slice(0, 8)}`,
        contentType: 'vocabulary' as const,
        level: 'N1',
      })) as VocabularyItem[];

      trace.output = { generatedCount: vocabulary.length };
      return vocabulary;
    } catch (error) {
      trace.error = String(error);
      throw error;
    }
  }

  /**
   * Generate kanji data for specified characters.
   */
  async createKanjiSet(
    targetKanji: string[],
    options?: {
      includeCompounds?: boolean;
      includeMnemonics?: boolean;
    }
  ): Promise<KanjiItem[]> {
    const trace = createTrace('content_creator.create_kanji', {
      targetKanji,
      options,
    });

    try {
      const prompt = this.buildKanjiPrompt(targetKanji, options);

      const result = await this.llm.completeJson<{ kanji: any[] }>(
        [{ role: 'user', content: prompt }],
        GeneratedKanji
      );

      const kanji = result.kanji.map((k) => ({
        ...k,
        id: k.id || `kanji-${uuidv4().slice(0, 8)}`,
        contentType: 'kanji' as const,
        level: 'N1',
      })) as KanjiItem[];

      trace.output = { generatedCount: kanji.length };
      return kanji;
    } catch (error) {
      trace.error = String(error);
      throw error;
    }
  }

  /**
   * Generate a reading exercise with comprehension questions.
   */
  async createReadingExercise(
    topic: string,
    passageType: ReadingPassageType = 'short',
    options?: {
      genre?: string;
      questionCount?: number;
      includeVocabulary?: boolean;
    }
  ): Promise<ReadingPassage> {
    const trace = createTrace('content_creator.create_reading', {
      topic,
      passageType,
      options,
    });

    try {
      const prompt = this.buildReadingPrompt(topic, passageType, options);

      const result = await this.llm.completeJson<{ reading: any }>(
        [{ role: 'user', content: prompt }],
        GeneratedReading
      );

      const reading = {
        ...result.reading,
        id: result.reading.id || `reading-${uuidv4().slice(0, 8)}`,
        contentType: 'reading' as const,
        level: 'N1',
        characterCount: result.reading.content?.length || 0,
        wordCount: result.reading.content?.split(/\s+/).length || 0,
      } as ReadingPassage;

      trace.output = { generatedId: reading.id };
      return reading;
    } catch (error) {
      trace.error = String(error);
      throw error;
    }
  }

  /**
   * Generate a listening exercise with TTS audio.
   */
  async createListeningExercise(
    topic: string,
    listeningType: ListeningType = 'task_based',
    durationSeconds: number = 60,
    options?: {
      speakerCount?: number;
      questionCount?: number;
      generateAudio?: boolean;
    }
  ): Promise<ListeningItem> {
    const trace = createTrace('content_creator.create_listening', {
      topic,
      listeningType,
      durationSeconds,
      options,
    });

    try {
      const prompt = this.buildListeningPrompt(topic, listeningType, durationSeconds, options);

      const result = await this.llm.completeJson<{ listening: any }>(
        [{ role: 'user', content: prompt }],
        GeneratedListening
      );

      let listening = {
        ...result.listening,
        id: result.listening.id || `listening-${uuidv4().slice(0, 8)}`,
        contentType: 'listening' as const,
        level: 'N1',
        durationSeconds: durationSeconds,
      } as ListeningItem;

      // Generate TTS audio if requested
      if (options?.generateAudio !== false && listening.transcript) {
        try {
          const ttsResult = await this.tts.synthesize(listening.transcript, {
            speed: 0.9,
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

      trace.output = { generatedId: listening.id, hasAudio: !!listening.audioBase64 };
      return listening;
    } catch (error) {
      trace.error = String(error);
      throw error;
    }
  }

  /**
   * Generate a mixed content set across multiple types.
   */
  async createMixedContentSet(
    topic: string,
    contentTypes: Array<'vocabulary' | 'kanji' | 'reading' | 'listening'>,
    options?: {
      vocabularyCount?: number;
      kanjiCount?: number;
      readingType?: ReadingPassageType;
      listeningType?: ListeningType;
    }
  ): Promise<{
    vocabulary?: VocabularyItem[];
    kanji?: KanjiItem[];
    reading?: ReadingPassage;
    listening?: ListeningItem;
  }> {
    const trace = createTrace('content_creator.create_mixed', {
      topic,
      contentTypes,
    });

    try {
      const results: {
        vocabulary?: VocabularyItem[];
        kanji?: KanjiItem[];
        reading?: ReadingPassage;
        listening?: ListeningItem;
      } = {};

      // Generate content in parallel where possible
      const promises: Promise<void>[] = [];

      if (contentTypes.includes('vocabulary')) {
        promises.push(
          this.createVocabularySet(topic, options?.vocabularyCount || 5).then(
            (v) => {
              results.vocabulary = v;
            }
          )
        );
      }

      if (contentTypes.includes('reading')) {
        promises.push(
          this.createReadingExercise(topic, options?.readingType || 'short').then(
            (r) => {
              results.reading = r;
            }
          )
        );
      }

      if (contentTypes.includes('listening')) {
        promises.push(
          this.createListeningExercise(topic, options?.listeningType || 'task_based', 60).then(
            (l) => {
              results.listening = l;
            }
          )
        );
      }

      await Promise.all(promises);

      // Kanji generation often depends on content, so do it last
      if (contentTypes.includes('kanji')) {
        // Extract kanji from generated content
        const kanjiChars = this.extractKanjiFromContent(results);
        if (kanjiChars.length > 0) {
          results.kanji = await this.createKanjiSet(
            kanjiChars.slice(0, options?.kanjiCount || 5)
          );
        }
      }

      trace.output = {
        generatedTypes: Object.keys(results),
      };

      return results;
    } catch (error) {
      trace.error = String(error);
      throw error;
    }
  }

  private buildVocabularyPrompt(
    topic: string,
    count: number,
    options?: { partOfSpeech?: string; includeExamples?: boolean }
  ): string {
    const parts = [
      `Generate ${count} JLPT N1 vocabulary items related to: ${topic}`,
      '',
      'Requirements:',
      '- All words should be N1 level difficulty',
      '- Include varied parts of speech unless specified',
    ];

    if (options?.partOfSpeech) {
      parts.push(`- Focus on ${options.partOfSpeech} words`);
    }

    parts.push(
      '',
      'For each word provide:',
      '- id: unique identifier (vocab-XXX)',
      '- word: the word in kanji',
      '- reading: hiragana reading',
      '- meanings: array of meanings',
      '- partOfSpeech: noun/verb/adjective_i/adjective_na/adverb/etc.'
    );

    if (options?.includeExamples !== false) {
      parts.push('- examples: array of {sentence, translation}');
    }

    parts.push('', 'Return JSON with a "vocabulary" array.');

    return parts.join('\n');
  }

  private buildKanjiPrompt(
    targetKanji: string[],
    options?: { includeCompounds?: boolean; includeMnemonics?: boolean }
  ): string {
    const parts = [
      `Generate detailed kanji data for: ${targetKanji.join(', ')}`,
      '',
      'For each kanji provide:',
      '- id: unique identifier (kanji-XXX)',
      '- character: the kanji character',
      '- strokeCount: number of strokes',
      '- onyomi: array of on readings (katakana)',
      '- kunyomi: array of kun readings (hiragana)',
      '- meanings: array of English meanings',
      '- radicals: array of radical components',
    ];

    if (options?.includeCompounds !== false) {
      parts.push('- compoundWords: array of {word, reading, meaning}');
    }

    if (options?.includeMnemonics !== false) {
      parts.push('- mnemonics: memory aid for the kanji');
    }

    parts.push('', 'Return JSON with a "kanji" array.');

    return parts.join('\n');
  }

  private buildReadingPrompt(
    topic: string,
    passageType: ReadingPassageType,
    options?: { genre?: string; questionCount?: number; includeVocabulary?: boolean }
  ): string {
    const lengthGuide: Record<ReadingPassageType, string> = {
      short: '200-400 characters',
      medium: '400-800 characters',
      long: '800-1200 characters',
      comparison: '300-500 characters per text',
      information: '150-300 characters with structured data',
    };

    const parts = [
      `Generate a JLPT N1 ${passageType} reading passage about: ${topic}`,
      '',
      `Target length: ${lengthGuide[passageType]}`,
      `Number of questions: ${options?.questionCount || 3}`,
    ];

    if (options?.genre) {
      parts.push(`Genre: ${options.genre}`);
    }

    parts.push(
      '',
      'Provide:',
      '- id: unique identifier (reading-XXX)',
      '- passageType: the type',
      '- content: the Japanese passage',
      '- questions: array of multiple-choice questions',
      '  - Each with id, questionText, options (4), correctOption (0-3), explanation'
    );

    if (options?.includeVocabulary !== false) {
      parts.push('- keyVocabulary: array of {word, reading, meaning}');
    }

    parts.push('', 'Return JSON with a "reading" object.');

    return parts.join('\n');
  }

  private buildListeningPrompt(
    topic: string,
    listeningType: ListeningType,
    durationSeconds: number,
    options?: { speakerCount?: number; questionCount?: number }
  ): string {
    const parts = [
      `Generate a JLPT N1 ${listeningType} listening exercise about: ${topic}`,
      '',
      `Target duration: ~${durationSeconds} seconds`,
      `Number of speakers: ${options?.speakerCount || 2}`,
      `Number of questions: ${options?.questionCount || 2}`,
      '',
      'Create a natural Japanese dialogue appropriate for N1 level.',
      '',
      'Provide:',
      '- id: unique identifier (listening-XXX)',
      '- listeningType: the type',
      '- transcript: the full dialogue text',
      '- dialogue: array of {speakerId, text}',
      '- speakers: array of {id, name, gender}',
      '- questions: array of multiple-choice questions',
      '  - Each with id, questionText, options (4), correctOption (0-3), explanation',
      '- situationContext: brief context description',
      '',
      'Return JSON with a "listening" object.',
    ];

    return parts.join('\n');
  }

  private extractKanjiFromContent(content: {
    vocabulary?: VocabularyItem[];
    reading?: ReadingPassage;
    listening?: ListeningItem;
  }): string[] {
    const kanjiSet = new Set<string>();
    const kanjiRegex = /[\u4e00-\u9faf]/g;

    // Extract from vocabulary
    if (content.vocabulary) {
      for (const vocab of content.vocabulary) {
        const matches = vocab.word.match(kanjiRegex);
        if (matches) {
          matches.forEach((k) => kanjiSet.add(k));
        }
      }
    }

    // Extract from reading
    if (content.reading) {
      const matches = content.reading.content.match(kanjiRegex);
      if (matches) {
        matches.forEach((k) => kanjiSet.add(k));
      }
    }

    // Extract from listening
    if (content.listening) {
      const matches = content.listening.transcript.match(kanjiRegex);
      if (matches) {
        matches.forEach((k) => kanjiSet.add(k));
      }
    }

    return Array.from(kanjiSet);
  }
}
