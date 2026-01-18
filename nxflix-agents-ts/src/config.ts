import { config } from 'dotenv';

config();

export interface Settings {
  host: string;
  port: number;
  debug: boolean;
  databaseUrl: string;
  defaultProvider: 'openai' | 'anthropic' | 'gemini' | 'ollama';
  defaultModel: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  googleApiKey: string;
  ollamaBaseUrl: string;
  opikEnabled: boolean;
  opikApiKey: string;
  opikProjectName: string;
}

function getEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] ?? defaultValue;
}

function getEnvBool(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export const settings: Settings = {
  host: getEnv('HOST', '0.0.0.0'),
  port: getEnvNumber('PORT', 8001),
  debug: getEnvBool('DEBUG', false),
  databaseUrl: getEnv('DATABASE_URL', 'postgresql://localhost:5432/nxflix'),
  defaultProvider: (getEnv('DEFAULT_PROVIDER', 'openai') as Settings['defaultProvider']),
  defaultModel: getEnv('DEFAULT_MODEL', 'gpt-4o-mini'),
  openaiApiKey: getEnv('OPENAI_API_KEY'),
  anthropicApiKey: getEnv('ANTHROPIC_API_KEY'),
  googleApiKey: getEnv('GOOGLE_API_KEY'),
  ollamaBaseUrl: getEnv('OLLAMA_BASE_URL', 'http://localhost:11434'),
  opikEnabled: getEnvBool('OPIK_ENABLED', true),
  opikApiKey: getEnv('OPIK_API_KEY'),
  opikProjectName: getEnv('OPIK_PROJECT_NAME', 'nxflix-jlpt-n1'),
};

export function getModelId(provider?: string, model?: string): string {
  const p = provider ?? settings.defaultProvider;
  const m = model ?? settings.defaultModel;
  return `${p}/${m}`;
}
