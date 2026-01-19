import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { LLMProvider } from '../providers/llm.js';
import { TTSService } from '../services/tts.js';
import { createTrace } from '../tracing/index.js';
import type {
  VideoProject,
  VideoScript,
  VideoCreateRequest,
} from '../models/video.js';

/**
 * Response schema for LLM-generated video script.
 * Note: Using plain types for LLM output to avoid Zod inference issues with defaults.
 */
const GeneratedScriptSchema = z.object({
  script: z.object({
    title: z.string(),
    description: z.string().nullish(),
    subtitles: z.array(
      z.object({
        id: z.string(),
        startTime: z.number(),
        endTime: z.number(),
        text: z.string(),
        reading: z.string().nullish(),
        furigana: z
          .array(
            z.object({
              word: z.string(),
              reading: z.string(),
              startIndex: z.number(),
            })
          )
          .nullish(),
        translation: z.string().nullish(),
      })
    ),
    totalDurationSeconds: z.number(),
    targetVocabulary: z.array(z.string()).nullish(),
    grammarPoints: z.array(z.string()).nullish(),
  }),
});

type GeneratedScript = z.infer<typeof GeneratedScriptSchema>;

/**
 * VideoCreatorAgent handles AI-powered generation of short educational videos
 * for Japanese language learning. It orchestrates the complete pipeline:
 * Text Prompt → Script Generation → TTS Audio → Video Composition
 */
export class VideoCreatorAgent {
  private llm: LLMProvider;
  private tts: TTSService;

  constructor(llmProvider?: LLMProvider, ttsService?: TTSService) {
    this.llm = llmProvider ?? new LLMProvider();
    this.tts = ttsService ?? new TTSService();
  }

  /**
   * Generate complete video from user prompt.
   * Pipeline: Prompt → Script → Audio → Video
   */
  async createVideo(request: VideoCreateRequest): Promise<VideoProject> {
    const trace = createTrace('video_creator.create_video', {
      prompt: request.prompt,
      userId: request.userId,
      characterStyle: request.characterStyle,
      videoStyle: request.videoStyle,
    });

    const projectId = `video-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    try {
      // Step 1: Generate script
      const script = await this.generateScript(
        request.prompt,
        request.maxDurationSeconds ?? 60
      );

      // Step 2: Generate TTS audio
      const audio = await this.generateAudio(
        script,
        request.voice ?? 'shimmer'
      );

      // Create the project (video rendering happens separately)
      const project: VideoProject = {
        id: projectId,
        userId: request.userId,
        prompt: request.prompt,
        script,
        characterStyle: request.characterStyle ?? 'anime_female',
        videoStyle: request.videoStyle ?? 'classroom',
        voice: request.voice ?? 'shimmer',
        status: 'ready',
        audioBase64: audio.audioBase64,
        createdAt: now,
        updatedAt: now,
        progress: 100,
      };

      trace?.update({
        output: {
          projectId: project.id,
          status: project.status,
          duration: script.totalDurationSeconds,
        },
      });
      trace?.end();

      return project;
    } catch (error) {
      trace?.update({
        output: { error: String(error) },
        metadata: { success: false },
      });
      trace?.end();

      // Return a failed project
      const failedProject: VideoProject = {
        id: projectId,
        userId: request.userId,
        prompt: request.prompt,
        script: {
          id: `script-${uuidv4().slice(0, 8)}`,
          title: 'Generation Failed',
          subtitles: [],
          totalDurationSeconds: 0,
          targetVocabulary: [],
          grammarPoints: [],
        },
        characterStyle: request.characterStyle ?? 'anime_female',
        videoStyle: request.videoStyle ?? 'classroom',
        voice: request.voice ?? 'shimmer',
        status: 'failed',
        createdAt: now,
        updatedAt: now,
        errorMessage: String(error),
        progress: 0,
      };

      return failedProject;
    }
  }

  /**
   * Step 1: Generate script with subtitles and furigana.
   */
  async generateScript(
    prompt: string,
    maxDurationSeconds: number
  ): Promise<VideoScript> {
    const trace = createTrace('video_creator.generate_script', {
      prompt,
      maxDurationSeconds,
    });

    try {
      const systemPrompt = this.buildScriptPrompt(prompt, maxDurationSeconds);

      const result = await this.llm.completeJson<GeneratedScript>(
        [{ role: 'user', content: systemPrompt }],
        GeneratedScriptSchema
      );

      const script: VideoScript = {
        id: `script-${uuidv4().slice(0, 8)}`,
        title: result.script.title,
        description: result.script.description ?? undefined,
        subtitles: result.script.subtitles.map((s, i) => ({
          id: s.id || `sub-${i}`,
          startTime: s.startTime,
          endTime: s.endTime,
          text: s.text,
          reading: s.reading ?? undefined,
          furigana: s.furigana ?? [],
          translation: s.translation ?? undefined,
        })),
        totalDurationSeconds: result.script.totalDurationSeconds,
        targetVocabulary: result.script.targetVocabulary ?? [],
        grammarPoints: result.script.grammarPoints ?? [],
      };

      trace?.update({
        output: {
          scriptId: script.id,
          subtitleCount: script.subtitles.length,
          duration: script.totalDurationSeconds,
        },
      });
      trace?.end();

      return script;
    } catch (error) {
      trace?.update({
        output: { error: String(error) },
        metadata: { success: false },
      });
      trace?.end();
      throw error;
    }
  }

  /**
   * Step 2: Generate TTS audio from script.
   */
  async generateAudio(
    script: VideoScript,
    voice: string
  ): Promise<{ audioBase64: string; durationSeconds: number }> {
    const trace = createTrace('video_creator.generate_audio', {
      scriptId: script.id,
      voice,
      subtitleCount: script.subtitles.length,
    });

    try {
      // Combine all subtitle text into a single transcript
      // Using readings if available for better TTS pronunciation
      const fullText = script.subtitles
        .map((s) => s.reading || s.text)
        .join('。');

      const result = await this.tts.synthesize(fullText, {
        voice,
        speed: 0.9, // Slightly slower for learning content
        pitch: 0,
      });

      trace?.update({
        output: {
          audioLength: result.audioBase64.length,
          durationSeconds: result.durationSeconds,
        },
      });
      trace?.end();

      return {
        audioBase64: result.audioBase64,
        durationSeconds: result.durationSeconds,
      };
    } catch (error) {
      trace?.update({
        output: { error: String(error) },
        metadata: { success: false },
      });
      trace?.end();
      throw error;
    }
  }

  /**
   * Generate just the script without audio (for preview/editing).
   */
  async generateScriptOnly(
    prompt: string,
    maxDurationSeconds: number = 60
  ): Promise<VideoScript> {
    return this.generateScript(prompt, maxDurationSeconds);
  }

  /**
   * Build the LLM prompt for script generation.
   */
  private buildScriptPrompt(prompt: string, maxDurationSeconds: number): string {
    return `You are a Japanese language content creator specializing in JLPT learning materials.
Generate a video script for the following request:

"${prompt}"

Requirements:
- Maximum duration: ${maxDurationSeconds} seconds
- Use natural, conversational Japanese appropriate for JLPT learners
- Include vocabulary and grammar appropriate for N1-N3 levels
- Each subtitle should be 2-5 seconds long
- Provide furigana (reading annotations) for all kanji words

Return a JSON object with the following structure:
{
  "script": {
    "title": "Short title for the video",
    "description": "Brief description of what the video teaches",
    "subtitles": [
      {
        "id": "sub-1",
        "startTime": 0,
        "endTime": 3.5,
        "text": "Japanese text with kanji",
        "reading": "Full hiragana reading for TTS",
        "furigana": [
          {
            "word": "漢字",
            "reading": "かんじ",
            "startIndex": 0
          }
        ],
        "translation": "English translation"
      }
    ],
    "totalDurationSeconds": ${maxDurationSeconds},
    "targetVocabulary": ["key vocabulary words featured"],
    "grammarPoints": ["grammar patterns used"]
  }
}

Important:
- Start times should flow naturally without gaps
- Each subtitle should be a complete thought or sentence segment
- Furigana should cover ALL kanji in the text
- The total duration should not exceed ${maxDurationSeconds} seconds`;
  }
}
