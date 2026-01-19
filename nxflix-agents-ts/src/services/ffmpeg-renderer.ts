import { spawn } from 'child_process';
import { writeFile, mkdir, rm, access, constants } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createTrace } from '../tracing/index.js';
import type {
  VideoProject,
  VideoScript,
  VideoSubtitle,
  CharacterStyle,
  VideoStyle,
} from '../models/video.js';
import type { VideoSettings } from '../models/pipeline-config.js';

/**
 * Render options for FFmpeg video composition.
 */
export interface FFmpegRenderOptions {
  width: number;
  height: number;
  fps: number;
  codec: 'h264' | 'h265' | 'vp8' | 'vp9';
  outputFormat: 'mp4' | 'webm';
}

/**
 * Render result containing paths to generated files.
 */
export interface FFmpegRenderResult {
  videoPath: string;
  videoUrl: string;
  thumbnailPath: string;
  thumbnailUrl: string;
  durationSeconds: number;
  fileSizeBytes?: number;
}

/**
 * Default render options for vertical video (9:16 aspect ratio).
 */
const DEFAULT_RENDER_OPTIONS: FFmpegRenderOptions = {
  width: 1080,
  height: 1920,
  fps: 30,
  codec: 'h264',
  outputFormat: 'mp4',
};

/**
 * Resolution presets.
 */
const RESOLUTION_PRESETS: Record<string, { width: number; height: number }> = {
  '720p': { width: 720, height: 1280 },
  '1080p': { width: 1080, height: 1920 },
  '4k': { width: 2160, height: 3840 },
};

/**
 * Background asset paths and colors.
 */
const BACKGROUND_ASSETS: Record<VideoStyle, { type: 'image' | 'color'; value: string }> = {
  classroom: { type: 'image', value: 'classroom.png' },
  cafe: { type: 'image', value: 'cafe.png' },
  nature: { type: 'image', value: 'nature.png' },
  abstract: { type: 'color', value: '#667eea' },
  manga: { type: 'image', value: 'manga.png' },
};

/**
 * Character asset paths.
 */
const CHARACTER_ASSETS: Record<CharacterStyle, string | null> = {
  anime_female: 'anime_female.png',
  anime_male: 'anime_male.png',
  realistic_female: 'realistic_female.png',
  realistic_male: 'realistic_male.png',
  chibi: 'chibi.png',
  mascot: 'mascot.png',
  none: null,
};

/**
 * FFmpegRendererService handles the actual video rendering using FFmpeg.
 * It composes backgrounds, characters, subtitles, and audio into a final video.
 */
export class FFmpegRendererService {
  private tempDir: string;
  private outputDir: string;
  private assetsDir: string;

  constructor(options?: {
    tempDir?: string;
    outputDir?: string;
    assetsDir?: string;
  }) {
    this.tempDir = options?.tempDir ?? '/tmp/video-render';
    this.outputDir = options?.outputDir ?? path.join(process.cwd(), 'public', 'videos');
    this.assetsDir = options?.assetsDir ?? path.join(process.cwd(), 'assets');
  }

  /**
   * Check if FFmpeg is available on the system.
   */
  async checkFFmpegAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const ffmpeg = spawn('ffmpeg', ['-version']);
      ffmpeg.on('error', () => resolve(false));
      ffmpeg.on('close', (code) => resolve(code === 0));
    });
  }

  /**
   * Render a complete video from a project.
   */
  async render(
    project: VideoProject,
    options?: Partial<FFmpegRenderOptions>
  ): Promise<FFmpegRenderResult> {
    const trace = createTrace('ffmpeg_renderer.render', {
      projectId: project.id,
      characterStyle: project.characterStyle,
      videoStyle: project.videoStyle,
    });

    const opts = { ...DEFAULT_RENDER_OPTIONS, ...options };
    const workDir = path.join(this.tempDir, uuidv4());

    try {
      // Ensure directories exist
      await mkdir(workDir, { recursive: true });
      await mkdir(this.outputDir, { recursive: true });

      // Step 1: Generate subtitle file (ASS format)
      const assPath = await this.generateSubtitleFile(
        project.script.subtitles,
        workDir,
        opts
      );

      // Step 2: Write audio to temp file
      let audioPath: string | null = null;
      if (project.audioBase64) {
        audioPath = path.join(workDir, 'audio.mp3');
        await writeFile(audioPath, Buffer.from(project.audioBase64, 'base64'));
      }

      // Step 3: Get background and character paths
      const bgPath = await this.getBackgroundPath(project.videoStyle, workDir, opts);
      const charPath = this.getCharacterPath(project.characterStyle);

      // Step 4: Run FFmpeg composition
      const outputPath = path.join(this.outputDir, `${project.id}.mp4`);
      await this.runFFmpegComposition({
        bgPath,
        charPath,
        assPath,
        audioPath,
        outputPath,
        duration: project.script.totalDurationSeconds,
        ...opts,
      });

      // Step 5: Generate thumbnail
      const thumbPath = path.join(this.outputDir, `${project.id}_thumb.jpg`);
      await this.generateThumbnail(outputPath, thumbPath);

      // Get file size
      let fileSizeBytes: number | undefined;
      try {
        const { stat } = await import('fs/promises');
        const stats = await stat(outputPath);
        fileSizeBytes = stats.size;
      } catch {
        // Ignore stat errors
      }

      const result: FFmpegRenderResult = {
        videoPath: outputPath,
        videoUrl: `/videos/${project.id}.mp4`,
        thumbnailPath: thumbPath,
        thumbnailUrl: `/videos/${project.id}_thumb.jpg`,
        durationSeconds: project.script.totalDurationSeconds,
        fileSizeBytes,
      };

      trace?.update({
        output: {
          videoUrl: result.videoUrl,
          thumbnailUrl: result.thumbnailUrl,
          duration: result.durationSeconds,
          fileSizeBytes: result.fileSizeBytes,
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
    } finally {
      // Cleanup temp directory
      await this.cleanupDir(workDir);
    }
  }

  /**
   * Generate ASS (Advanced SubStation Alpha) subtitle file with furigana styling.
   */
  private async generateSubtitleFile(
    subtitles: VideoSubtitle[],
    workDir: string,
    opts: FFmpegRenderOptions
  ): Promise<string> {
    const assContent = this.generateASSContent(subtitles, opts);
    const assPath = path.join(workDir, 'subtitles.ass');
    await writeFile(assPath, assContent, 'utf-8');
    return assPath;
  }

  /**
   * Generate ASS content with proper styling for Japanese text and furigana.
   */
  private generateASSContent(subtitles: VideoSubtitle[], opts: FFmpegRenderOptions): string {
    const mainFontSize = Math.round(opts.height * 0.04); // 4% of height
    const furiganaFontSize = Math.round(mainFontSize * 0.5);
    const translationFontSize = Math.round(mainFontSize * 0.7);
    const marginV = Math.round(opts.height * 0.08);

    const header = `[Script Info]
Title: Japanese Learning Video
ScriptType: v4.00+
PlayResX: ${opts.width}
PlayResY: ${opts.height}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Noto Sans JP,${mainFontSize},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,2,2,20,20,${marginV},1
Style: Furigana,Noto Sans JP,${furiganaFontSize},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,1,2,20,20,${Math.round(marginV * 0.6)},1
Style: Translation,Noto Sans JP,${translationFontSize},&H00CCCCCC,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,1,2,20,20,${Math.round(marginV * 0.3)},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const events = subtitles
      .map((sub) => {
        const start = this.formatASSTime(sub.startTime);
        const end = this.formatASSTime(sub.endTime);

        // Main Japanese text with furigana inline
        const mainText = this.formatTextWithFurigana(sub.text, sub.furigana, mainFontSize, furiganaFontSize);
        let lines = `Dialogue: 0,${start},${end},Main,,0,0,0,,${mainText}`;

        // Add translation if available
        if (sub.translation) {
          lines += `\nDialogue: 1,${start},${end},Translation,,0,0,0,,${sub.translation}`;
        }

        return lines;
      })
      .join('\n');

    return header + events;
  }

  /**
   * Format time for ASS subtitle format (H:MM:SS.CC).
   */
  private formatASSTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.floor((seconds * 100) % 100);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  }

  /**
   * Format text with furigana using ASS override tags.
   * Shows furigana in parentheses after kanji for compatibility.
   */
  private formatTextWithFurigana(
    text: string,
    furigana: Array<{ word: string; reading: string; startIndex: number }>,
    mainSize: number,
    furiganaSize: number
  ): string {
    if (!furigana || furigana.length === 0) {
      return text;
    }

    let result = text;

    // Sort by startIndex descending to avoid offset issues
    const sorted = [...furigana].sort((a, b) => b.startIndex - a.startIndex);

    for (const f of sorted) {
      const pos = result.indexOf(f.word, Math.max(0, f.startIndex - 5));
      if (pos !== -1) {
        const before = result.slice(0, pos);
        const after = result.slice(pos + f.word.length);
        // Use smaller font for furigana reading in parentheses
        result = `${before}{\\fs${mainSize}}${f.word}{\\fs${furiganaSize}}(${f.reading}){\\fs${mainSize}}${after}`;
      }
    }

    return result;
  }

  /**
   * Get or create the background for the video.
   */
  private async getBackgroundPath(
    style: VideoStyle,
    workDir: string,
    opts: FFmpegRenderOptions
  ): Promise<string> {
    const bgConfig = BACKGROUND_ASSETS[style] || BACKGROUND_ASSETS.abstract;

    if (bgConfig.type === 'color') {
      // Create a solid color image using FFmpeg
      const colorPath = path.join(workDir, 'background.png');
      await this.createColorImage(bgConfig.value, colorPath, opts.width, opts.height);
      return colorPath;
    }

    // Try to use the asset image
    const assetPath = path.join(this.assetsDir, 'backgrounds', bgConfig.value);
    try {
      await access(assetPath, constants.R_OK);
      return assetPath;
    } catch {
      // Fall back to creating a gradient
      const colorPath = path.join(workDir, 'background.png');
      await this.createGradientImage(colorPath, opts.width, opts.height);
      return colorPath;
    }
  }

  /**
   * Get the character image path.
   */
  private getCharacterPath(style: CharacterStyle): string | null {
    const charFile = CHARACTER_ASSETS[style];
    if (!charFile) return null;

    const assetPath = path.join(this.assetsDir, 'characters', charFile);
    return assetPath;
  }

  /**
   * Create a solid color image using FFmpeg.
   */
  private async createColorImage(
    color: string,
    outputPath: string,
    width: number,
    height: number
  ): Promise<void> {
    // Remove # from hex color
    const hexColor = color.replace('#', '');

    return new Promise((resolve, reject) => {
      const args = [
        '-f', 'lavfi',
        '-i', `color=c=0x${hexColor}:s=${width}x${height}:d=1`,
        '-frames:v', '1',
        '-y',
        outputPath,
      ];

      const ffmpeg = spawn('ffmpeg', args);

      let stderr = '';
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to create color image: ${stderr}`));
        }
      });

      ffmpeg.on('error', reject);
    });
  }

  /**
   * Create a gradient image using FFmpeg.
   */
  private async createGradientImage(
    outputPath: string,
    width: number,
    height: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create a purple-to-pink gradient (similar to the abstract style)
      const args = [
        '-f', 'lavfi',
        '-i', `gradients=s=${width}x${height}:c0=0x667eea:c1=0x764ba2:d=1`,
        '-frames:v', '1',
        '-y',
        outputPath,
      ];

      const ffmpeg = spawn('ffmpeg', args);

      let stderr = '';
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          // Fall back to solid color if gradient fails
          this.createColorImage('#667eea', outputPath, width, height)
            .then(resolve)
            .catch(reject);
        }
      });

      ffmpeg.on('error', reject);
    });
  }

  /**
   * Run FFmpeg to compose the final video.
   */
  private runFFmpegComposition(params: {
    bgPath: string;
    charPath: string | null;
    assPath: string;
    audioPath: string | null;
    outputPath: string;
    duration: number;
    width: number;
    height: number;
    fps: number;
    codec: string;
    outputFormat: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      const args: string[] = [];

      // Input: Loop background image for duration
      args.push('-loop', '1', '-t', String(params.duration), '-i', params.bgPath);

      // Input: Audio (if available)
      if (params.audioPath) {
        args.push('-i', params.audioPath);
      }

      // Input: Character image (if available)
      const hasCharacter = params.charPath !== null;
      if (hasCharacter) {
        args.push('-loop', '1', '-t', String(params.duration), '-i', params.charPath);
      }

      // Build filter complex
      let filterComplex = `[0:v]scale=${params.width}:${params.height}:force_original_aspect_ratio=decrease,pad=${params.width}:${params.height}:(ow-iw)/2:(oh-ih)/2,setsar=1[bg]`;

      if (hasCharacter) {
        // Character input index depends on whether audio is present
        const charInputIdx = params.audioPath ? 2 : 1;
        // Scale character to 40% of width, position at bottom center
        const charWidth = Math.round(params.width * 0.4);
        const charY = Math.round(params.height * 0.55);
        filterComplex += `;[${charInputIdx}:v]scale=${charWidth}:-1[char];[bg][char]overlay=(W-w)/2:${charY}[withchar]`;
        filterComplex += `;[withchar]ass='${params.assPath.replace(/'/g, "'\\''")}'[out]`;
      } else {
        filterComplex += `;[bg]ass='${params.assPath.replace(/'/g, "'\\''")}'[out]`;
      }

      args.push('-filter_complex', filterComplex);
      args.push('-map', '[out]');

      // Map audio if available
      if (params.audioPath) {
        args.push('-map', '1:a');
      }

      // Video codec settings
      if (params.codec === 'h264') {
        args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '23');
      } else if (params.codec === 'h265') {
        args.push('-c:v', 'libx265', '-preset', 'fast', '-crf', '28');
      } else if (params.codec === 'vp8') {
        args.push('-c:v', 'libvpx', '-b:v', '2M');
      } else if (params.codec === 'vp9') {
        args.push('-c:v', 'libvpx-vp9', '-b:v', '2M');
      }

      // Audio codec
      if (params.audioPath) {
        args.push('-c:a', 'aac', '-b:a', '192k');
      }

      // Output settings
      args.push(
        '-r', String(params.fps),
        '-pix_fmt', 'yuv420p',
        '-shortest',
        '-y',
        params.outputPath
      );

      console.log('Running FFmpeg with args:', args.join(' '));

      const ffmpeg = spawn('ffmpeg', args);

      let stderr = '';
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          console.error('FFmpeg stderr:', stderr);
          reject(new Error(`FFmpeg failed with code ${code}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`FFmpeg spawn error: ${err.message}`));
      });
    });
  }

  /**
   * Generate a thumbnail from the video.
   */
  private generateThumbnail(videoPath: string, thumbPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-ss', '00:00:01',
        '-vframes', '1',
        '-q:v', '2',
        '-y',
        thumbPath,
      ]);

      let stderr = '';
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          // Don't fail if thumbnail generation fails
          console.warn('Thumbnail generation failed:', stderr);
          resolve();
        }
      });

      ffmpeg.on('error', (err) => {
        console.warn('Thumbnail spawn error:', err.message);
        resolve();
      });
    });
  }

  /**
   * Clean up a temporary directory.
   */
  private async cleanupDir(dir: string): Promise<void> {
    try {
      await rm(dir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }

  /**
   * Convert VideoSettings to FFmpegRenderOptions.
   */
  convertSettings(settings: VideoSettings): Partial<FFmpegRenderOptions> {
    const resolution = RESOLUTION_PRESETS[settings.resolution] ?? RESOLUTION_PRESETS['1080p'];
    return {
      width: resolution.width,
      height: resolution.height,
      fps: settings.fps,
      codec: settings.codec as FFmpegRenderOptions['codec'],
      outputFormat: settings.format as FFmpegRenderOptions['outputFormat'],
    };
  }
}
