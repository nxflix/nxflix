import type { IImageProvider, ImageOptions, ImageResult } from './interface.js';
import { settings } from '../../../config.js';

/**
 * Stable Diffusion image generation provider via Stability AI API.
 */
export class StableDiffusionImageProvider implements IImageProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = settings.stabilityApiKey;
  }

  getProviderName(): string {
    return 'Stable Diffusion';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async generate(prompt: string, options?: ImageOptions): Promise<ImageResult> {
    if (!this.apiKey) {
      throw new Error('Stability AI API key not configured');
    }

    const width = this.roundToValidSize(options?.width ?? 1024);
    const height = this.roundToValidSize(options?.height ?? 1024);

    const response = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1,
            },
          ],
          cfg_scale: 7,
          height: height,
          width: width,
          samples: 1,
          steps: 30,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stable Diffusion error: ${error}`);
    }

    const data = await response.json() as { artifacts?: Array<{ base64: string }> };

    if (!data.artifacts || data.artifacts.length === 0) {
      throw new Error('No images generated');
    }

    return {
      imageBase64: data.artifacts[0].base64,
      width: width,
      height: height,
      format: 'png',
    };
  }

  async generateBackground(
    description: string,
    style: string,
    options?: ImageOptions
  ): Promise<ImageResult> {
    const prompt = this.buildBackgroundPrompt(description, style);
    return this.generate(prompt, {
      ...options,
      width: 1024,
      height: 1792, // Closest to 9:16 that SDXL supports
    });
  }

  async generateCharacter(
    description: string,
    style: string,
    options?: ImageOptions
  ): Promise<ImageResult> {
    const prompt = this.buildCharacterPrompt(description, style);
    return this.generate(prompt, {
      ...options,
      width: 1024,
      height: 1024,
    });
  }

  private buildBackgroundPrompt(description: string, style: string): string {
    const styleModifiers: Record<string, string> = {
      anime: 'anime style, vibrant colors, clean lines',
      realistic: 'photorealistic, high detail, professional photography',
      abstract: 'abstract art, gradient colors, minimalist',
      classroom: 'Japanese classroom interior, school setting, warm lighting',
      cafe: 'Japanese cafe interior, cozy atmosphere, warm tones',
      nature: 'Japanese garden, serene landscape, natural lighting',
      manga: 'manga style, black and white tones with color accents',
    };

    const styleModifier = styleModifiers[style] ?? styleModifiers.abstract;

    return `${styleModifier}, ${description}, background for educational video, no text, no people, suitable for text overlay, high quality`;
  }

  private buildCharacterPrompt(description: string, style: string): string {
    const styleModifiers: Record<string, string> = {
      anime_female: 'anime style female character, friendly expression',
      anime_male: 'anime style male character, friendly expression',
      realistic_female: 'illustrated female character, semi-realistic style',
      realistic_male: 'illustrated male character, semi-realistic style',
      chibi: 'chibi style character, cute, small proportions',
      mascot: 'cute mascot character, cartoon style',
    };

    const styleModifier = styleModifiers[style] ?? 'anime style character';

    return `${styleModifier}, ${description}, upper body portrait, transparent or simple background, suitable for educational content, high quality illustration`;
  }

  /**
   * Round dimensions to valid SDXL sizes (multiples of 64, max 2048).
   */
  private roundToValidSize(size: number): number {
    const rounded = Math.round(size / 64) * 64;
    return Math.min(Math.max(rounded, 512), 2048);
  }
}
