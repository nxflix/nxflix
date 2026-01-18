import { generateText, generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider';
import { z, ZodType } from 'zod';
import { settings } from '../config.js';
import { createTrace } from '../tracing/index.js';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

type Provider = 'openai' | 'anthropic' | 'gemini' | 'ollama';

function getProvider(provider: Provider) {
  switch (provider) {
    case 'openai':
      return createOpenAI({ apiKey: settings.openaiApiKey });
    case 'anthropic':
      return createAnthropic({ apiKey: settings.anthropicApiKey });
    case 'gemini':
      return createGoogleGenerativeAI({ apiKey: settings.googleApiKey });
    case 'ollama':
      return createOllama({ baseURL: settings.ollamaBaseUrl });
  }
}

export class LLMProvider {
  private provider: Provider;
  private model: string;

  constructor(provider?: Provider, model?: string) {
    this.provider = provider ?? settings.defaultProvider;
    this.model = model ?? settings.defaultModel;
  }

  async complete(
    messages: Message[],
    options: CompletionOptions = {}
  ): Promise<string> {
    const { temperature = 0.7, maxTokens = 1024 } = options;

    const trace = createTrace('llm.complete', {
      provider: this.provider,
      model: this.model,
      messageCount: messages.length,
    });

    try {
      const provider = getProvider(this.provider);
      const result = await generateText({
        model: provider(this.model),
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature,
        maxTokens,
      });

      trace?.update({ output: { textLength: result.text.length } });
      trace?.end();

      return result.text;
    } catch (error) {
      trace?.update({ output: { error: String(error) } });
      trace?.end();
      throw error;
    }
  }

  async completeJson<T>(
    messages: Message[],
    schema: ZodType<T>,
    options: CompletionOptions = {}
  ): Promise<T> {
    const { temperature = 0.3, maxTokens = 2048 } = options;

    const trace = createTrace('llm.completeJson', {
      provider: this.provider,
      model: this.model,
      messageCount: messages.length,
    });

    try {
      const provider = getProvider(this.provider);
      const result = await generateObject({
        model: provider(this.model),
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        schema,
        temperature,
        maxTokens,
      });

      trace?.update({ output: { success: true } });
      trace?.end();

      return result.object;
    } catch (error) {
      trace?.update({ output: { error: String(error) } });
      trace?.end();
      throw error;
    }
  }
}

export async function complete(
  messages: Message[],
  provider?: Provider,
  model?: string,
  options?: CompletionOptions
): Promise<string> {
  const llm = new LLMProvider(provider, model);
  return llm.complete(messages, options);
}

export async function completeWithJson<T>(
  messages: Message[],
  schema: ZodType<T>,
  provider?: Provider,
  model?: string,
  options?: CompletionOptions
): Promise<T> {
  const llm = new LLMProvider(provider, model);
  return llm.completeJson(messages, schema, options);
}
