export { SM2Service, calculateNextReview, qualityFromScore } from './spaced-repetition.js';
export { GrammarService } from './grammar.js';
export { KanjiService } from './kanji.js';
export { VocabularyService } from './vocabulary.js';
export { ListeningService } from './listening.js';
export { ReadingService } from './reading.js';
export { TTSService, TTSProvider, JapaneseVoices } from './tts.js';
export { HedraService, hedraService } from './hedra.js';
export { SideshiftService, sideshiftService } from './sideshift.js';
export { SubscriptionService, subscriptionService } from './subscription.js';
export { VideoRendererService, CHARACTER_ASSETS, BACKGROUND_ASSETS } from './video-renderer.js';
export { FFmpegRendererService } from './ffmpeg-renderer.js';
export {
  createTTSProvider,
  createImageProvider,
  createVideoProvider,
  getProvidersStatus,
  renderWithFallback,
} from './provider-factory.js';

// Reward and engagement system services
export { EpochService, epochService } from './epoch.js';
export { AnalyticsService, analyticsService, EVENT_WEIGHTS } from './analytics.js';
export { RewardsService, rewardsService, TIER_THRESHOLDS, DAILY_REWARD_POOL } from './rewards.js';
export { FeaturedContentService, featuredContentService, FEATURE_REASONS } from './featured-content.js';

export type { SM2Result } from './spaced-repetition.js';
export type { TTSSynthesizeResult, DialogueLine as TTSDialogueLine, TTSSynthesizeOptions } from './tts.js';
export type { Plan, SupportedChainId } from './subscription.js';
export type { RenderConfig, RenderResult } from './video-renderer.js';
export type { FFmpegRenderOptions, FFmpegRenderResult } from './ffmpeg-renderer.js';
export type { EpochConfig } from './epoch.js';
export type { TrackEventRequest, ContentStats, CreatorPerformance, LeaderboardEntry } from './analytics.js';
export type { ProcessEpochResult, DailyRewardResult } from './rewards.js';
export type { ContentCandidate } from './featured-content.js';
export type {
  AspectRatio,
  VideoResolution,
  GenerationStatus,
  GenerateTalkingVideoOptions,
  GenerateTalkingVideoResult,
} from './hedra.js';
