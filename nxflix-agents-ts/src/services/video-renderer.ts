import { createTrace } from '../tracing/index.js';
import type {
  VideoProject,
  VideoScript,
  CharacterStyle,
  VideoStyle,
} from '../models/video.js';

/**
 * Render configuration for video composition.
 */
export interface RenderConfig {
  width: number;
  height: number;
  fps: number;
  codec: 'h264' | 'h265' | 'vp8' | 'vp9';
  outputFormat: 'mp4' | 'webm';
}

/**
 * Render result containing video and thumbnail URLs.
 */
export interface RenderResult {
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  fileSizeBytes?: number;
}

/**
 * Character asset configuration.
 */
export const CHARACTER_ASSETS: Record<
  CharacterStyle,
  { name: string; imagePath?: string; description: string }
> = {
  anime_female: {
    name: 'Sakura',
    imagePath: '/assets/characters/anime_female.png',
    description: 'Anime-style female character',
  },
  anime_male: {
    name: 'Takeshi',
    imagePath: '/assets/characters/anime_male.png',
    description: 'Anime-style male character',
  },
  realistic_female: {
    name: 'Yuki',
    imagePath: '/assets/characters/realistic_female.png',
    description: 'Photo-realistic female',
  },
  realistic_male: {
    name: 'Kenji',
    imagePath: '/assets/characters/realistic_male.png',
    description: 'Photo-realistic male',
  },
  chibi: {
    name: 'Chibi-chan',
    imagePath: '/assets/characters/chibi.png',
    description: 'Cute chibi character',
  },
  mascot: {
    name: 'NxFlix-kun',
    imagePath: '/assets/characters/mascot.png',
    description: 'App mascot character',
  },
  none: {
    name: 'No Character',
    description: 'Subtitles only, no character',
  },
};

/**
 * Background style configuration.
 */
export const BACKGROUND_ASSETS: Record<
  VideoStyle,
  { name: string; imagePath?: string; gradient?: string; description: string }
> = {
  classroom: {
    name: 'Classroom',
    imagePath: '/assets/backgrounds/classroom.png',
    description: 'Traditional learning setting',
  },
  cafe: {
    name: 'Cafe',
    imagePath: '/assets/backgrounds/cafe.png',
    description: 'Casual conversation setting',
  },
  nature: {
    name: 'Nature',
    imagePath: '/assets/backgrounds/nature.png',
    description: 'Outdoor/scenic background',
  },
  abstract: {
    name: 'Abstract',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    description: 'Minimalist gradient background',
  },
  manga: {
    name: 'Manga',
    imagePath: '/assets/backgrounds/manga.png',
    description: 'Comic panel style',
  },
};

/**
 * Default render configuration.
 */
const DEFAULT_RENDER_CONFIG: RenderConfig = {
  width: 1080,
  height: 1920, // Vertical format for mobile/shorts
  fps: 30,
  codec: 'h264',
  outputFormat: 'mp4',
};

/**
 * VideoRendererService handles the rendering of video compositions
 * using Remotion (React-based video framework).
 *
 * Note: Full Remotion integration requires additional setup:
 * 1. Install @remotion/cli, @remotion/renderer, remotion packages
 * 2. Create Remotion composition components
 * 3. Configure Remotion bundle
 *
 * This service provides the interface and placeholder implementation.
 */
export class VideoRendererService {
  private config: RenderConfig;

  constructor(config?: Partial<RenderConfig>) {
    this.config = { ...DEFAULT_RENDER_CONFIG, ...config };
  }

  /**
   * Render video with Remotion.
   *
   * In production, this would:
   * 1. Bundle the Remotion composition
   * 2. Render the video with the provided assets
   * 3. Upload to storage and return URLs
   */
  async render(project: VideoProject): Promise<RenderResult> {
    const trace = createTrace('video_renderer.render', {
      projectId: project.id,
      characterStyle: project.characterStyle,
      videoStyle: project.videoStyle,
      subtitleCount: project.script.subtitles.length,
    });

    try {
      // Placeholder: In production, this would use Remotion to render
      // For now, return placeholder URLs
      const result: RenderResult = {
        videoUrl: `/api/video/${project.id}/stream`,
        thumbnailUrl: `/api/video/${project.id}/thumbnail`,
        durationSeconds: project.script.totalDurationSeconds,
      };

      trace?.update({
        output: {
          videoUrl: result.videoUrl,
          thumbnailUrl: result.thumbnailUrl,
          duration: result.durationSeconds,
        },
      });
      trace?.end();

      return result;
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
   * Generate a thumbnail preview of the video.
   */
  async generateThumbnail(project: VideoProject): Promise<string> {
    const trace = createTrace('video_renderer.generate_thumbnail', {
      projectId: project.id,
    });

    try {
      // Placeholder: Generate thumbnail from first frame
      const thumbnailUrl = `/api/video/${project.id}/thumbnail`;

      trace?.update({ output: { thumbnailUrl } });
      trace?.end();
      return thumbnailUrl;
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
   * Get the render configuration.
   */
  getConfig(): RenderConfig {
    return { ...this.config };
  }

  /**
   * Update render configuration.
   */
  setConfig(config: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if Remotion is properly configured and available.
   */
  async checkRemotionAvailable(): Promise<boolean> {
    // Placeholder: Check if Remotion packages are installed
    // In production, this would verify the Remotion bundle is built
    try {
      // await import('@remotion/renderer');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate subtitle render data with furigana positioning.
   */
  generateSubtitleRenderData(script: VideoScript): Array<{
    id: string;
    startTime: number;
    endTime: number;
    text: string;
    furiganaHtml: string;
    translation?: string;
  }> {
    return script.subtitles.map((subtitle) => {
      // Generate HTML with ruby annotations for furigana
      let furiganaHtml = subtitle.text;

      // Sort furigana by startIndex in reverse order to avoid offset issues
      const sortedFurigana = [...subtitle.furigana].sort(
        (a, b) => b.startIndex - a.startIndex
      );

      for (const f of sortedFurigana) {
        const before = furiganaHtml.slice(0, f.startIndex);
        const wordEnd = f.startIndex + f.word.length;
        const after = furiganaHtml.slice(wordEnd);
        furiganaHtml = `${before}<ruby>${f.word}<rt>${f.reading}</rt></ruby>${after}`;
      }

      return {
        id: subtitle.id,
        startTime: subtitle.startTime,
        endTime: subtitle.endTime,
        text: subtitle.text,
        furiganaHtml,
        translation: subtitle.translation,
      };
    });
  }
}
