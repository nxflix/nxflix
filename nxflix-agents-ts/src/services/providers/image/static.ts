import path from 'path';
import { access, constants, readFile } from 'fs/promises';
import type { IImageProvider, ImageOptions, ImageResult } from './interface.js';

/**
 * Static background assets mapping.
 */
const STATIC_BACKGROUNDS: Record<string, string> = {
  classroom: 'classroom.png',
  cafe: 'cafe.png',
  nature: 'nature.png',
  abstract: 'abstract.png',
  manga: 'manga.png',
  default: 'abstract.png',
};

/**
 * Static character assets mapping.
 */
const STATIC_CHARACTERS: Record<string, string> = {
  anime_female: 'anime_female.png',
  anime_male: 'anime_male.png',
  realistic_female: 'realistic_female.png',
  realistic_male: 'realistic_male.png',
  chibi: 'chibi.png',
  mascot: 'mascot.png',
};

/**
 * Static image provider.
 * Uses pre-made assets instead of AI generation.
 * Fast, predictable, and free.
 */
export class StaticImageProvider implements IImageProvider {
  private assetsDir: string;

  constructor(assetsDir?: string) {
    this.assetsDir = assetsDir ?? path.join(process.cwd(), 'assets');
  }

  getProviderName(): string {
    return 'Static Assets';
  }

  async isAvailable(): Promise<boolean> {
    // Static provider is always available
    return true;
  }

  async generate(_prompt: string, options?: ImageOptions): Promise<ImageResult> {
    // For generic generation, return the default background
    return this.generateBackground('default', 'abstract', options);
  }

  async generateBackground(
    _description: string,
    style: string,
    options?: ImageOptions
  ): Promise<ImageResult> {
    // Map style to background file
    const fileName = STATIC_BACKGROUNDS[style] ?? STATIC_BACKGROUNDS.default;
    const filePath = path.join(this.assetsDir, 'backgrounds', fileName);

    try {
      await access(filePath, constants.R_OK);
      const imageData = await readFile(filePath);

      return {
        imageBase64: imageData.toString('base64'),
        width: options?.width ?? 1080,
        height: options?.height ?? 1920,
        format: 'png',
      };
    } catch {
      // Return a placeholder gradient description
      return this.createPlaceholderGradient(options);
    }
  }

  async generateCharacter(
    _description: string,
    style: string,
    options?: ImageOptions
  ): Promise<ImageResult> {
    // Map style to character file
    const fileName = STATIC_CHARACTERS[style];
    if (!fileName) {
      throw new Error(`No static character available for style: ${style}`);
    }

    const filePath = path.join(this.assetsDir, 'characters', fileName);

    try {
      await access(filePath, constants.R_OK);
      const imageData = await readFile(filePath);

      return {
        imageBase64: imageData.toString('base64'),
        width: options?.width ?? 512,
        height: options?.height ?? 512,
        format: 'png',
      };
    } catch {
      throw new Error(`Character asset not found: ${fileName}`);
    }
  }

  /**
   * Create a placeholder gradient when no asset is available.
   * Returns a description that FFmpeg can use to generate a gradient.
   */
  private createPlaceholderGradient(options?: ImageOptions): ImageResult {
    // This returns empty base64, indicating FFmpeg should generate the gradient
    return {
      imageBase64: undefined,
      imageUrl: 'gradient:0x667eea:0x764ba2',
      width: options?.width ?? 1080,
      height: options?.height ?? 1920,
      format: 'png',
    };
  }

  /**
   * Get path to a background asset.
   */
  getBackgroundPath(style: string): string {
    const fileName = STATIC_BACKGROUNDS[style] ?? STATIC_BACKGROUNDS.default;
    return path.join(this.assetsDir, 'backgrounds', fileName);
  }

  /**
   * Get path to a character asset.
   */
  getCharacterPath(style: string): string | null {
    const fileName = STATIC_CHARACTERS[style];
    if (!fileName) return null;
    return path.join(this.assetsDir, 'characters', fileName);
  }
}
