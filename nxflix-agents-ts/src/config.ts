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
  // TTS settings
  ttsProvider: 'google' | 'openai' | 'elevenlabs' | 'azure';
  elevenLabsApiKey: string;
  azureSpeechKey: string;
  azureSpeechRegion: string;
  // Image generation settings
  stabilityApiKey: string;
  // Video generation settings
  hedraApiKey: string;
  didApiKey: string;
  runwayApiKey: string;
  pikaApiKey: string;
  // SideShift settings
  sideshiftApiUrl: string;
  sideshiftAffiliateId: string;
  sideshiftSecret: string;
  sideshiftWebhookSecret: string;
  // Subscription contract settings
  treasuryPrivateKey: string;
  sepoliaRpcUrl: string;
  baseSepoliaRpcUrl: string;
  sepoliaSubscriptionContract: string;
  baseSepoliaSubscriptionContract: string;
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
  // TTS settings
  ttsProvider: (getEnv('TTS_PROVIDER', 'openai') as Settings['ttsProvider']),
  elevenLabsApiKey: getEnv('ELEVENLABS_API_KEY'),
  azureSpeechKey: getEnv('AZURE_SPEECH_KEY'),
  azureSpeechRegion: getEnv('AZURE_SPEECH_REGION', 'eastus'),
  // Image generation settings
  stabilityApiKey: getEnv('STABILITY_API_KEY'),
  // Video generation settings
  hedraApiKey: getEnv('HEDRA_API_KEY'),
  didApiKey: getEnv('DID_API_KEY'),
  runwayApiKey: getEnv('RUNWAY_API_KEY'),
  pikaApiKey: getEnv('PIKA_API_KEY'),
  // SideShift settings
  sideshiftApiUrl: getEnv('SIDESHIFT_API_URL', 'https://sideshift.ai/api/v2'),
  sideshiftAffiliateId: getEnv('SIDESHIFT_AFFILIATE_ID', ''),
  sideshiftSecret: getEnv('SIDESHIFT_SECRET', ''),
  sideshiftWebhookSecret: getEnv('SIDESHIFT_WEBHOOK_SECRET', ''),
  // Subscription contract settings
  treasuryPrivateKey: getEnv('TREASURY_PRIVATE_KEY', ''),
  sepoliaRpcUrl: getEnv('SEPOLIA_RPC_URL', 'https://ethereum-sepolia-rpc.publicnode.com'),
  baseSepoliaRpcUrl: getEnv('BASE_SEPOLIA_RPC_URL', 'https://sepolia.base.org'),
  sepoliaSubscriptionContract: getEnv('SEPOLIA_SUBSCRIPTION_CONTRACT', '0x789A4C17d01551BAF6152F8F842B174ab61ace9A'),
  baseSepoliaSubscriptionContract: getEnv('BASE_SEPOLIA_SUBSCRIPTION_CONTRACT', '0xDA4EF957c402522Fa0b837cb047dd416ba783798'),
};

export function getModelId(provider?: string, model?: string): string {
  const p = provider ?? settings.defaultProvider;
  const m = model ?? settings.defaultModel;
  return `${p}/${m}`;
}
