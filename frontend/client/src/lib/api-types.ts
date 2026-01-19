// Content Types
export type ContentType = 'grammar' | 'vocabulary' | 'kanji' | 'reading' | 'listening';

// Kanji Types
export interface CompoundWord {
  word: string;
  reading: string;
  meaning: string;
}

export interface KanjiItem {
  id: string;
  character: string;
  strokeCount: number;
  onyomi: string[];
  kunyomi: string[];
  meanings: string[];
  radicals: string[];
  compoundWords: CompoundWord[];
  mnemonics?: string;
  level: string;
  contentType: 'kanji';
}

// Vocabulary Types
export type PartOfSpeech = 'noun' | 'verb' | 'adjective_i' | 'adjective_na' | 'adverb' | 'particle' | 'conjunction' | 'expression';

export interface VocabularyExample {
  sentence: string;
  translation: string;
}

export interface VocabularyItem {
  id: string;
  word: string;
  reading: string;
  meanings: string[];
  partOfSpeech: PartOfSpeech;
  examples: VocabularyExample[];
  synonyms: string[];
  level: string;
  contentType: 'vocabulary';
  audioUrl?: string;
}

// Reading Types
export type ReadingPassageType = 'short' | 'medium' | 'long' | 'comparison';

export interface ReadingQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

export interface ReadingPassage {
  id: string;
  passageType: ReadingPassageType;
  title?: string;
  content: string;
  wordCount: number;
  questions: ReadingQuestion[];
  keyVocabulary: string[];
  level: string;
  contentType: 'reading';
  estimatedMinutes: number;
}

// Listening Types
export type ListeningType = 'task_based' | 'point_comprehension' | 'quick_response';

export interface ListeningQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  timestamp?: number;
}

export interface ListeningItem {
  id: string;
  listeningType: ListeningType;
  audioUrl?: string;
  audioBase64?: string;
  transcript: string;
  dialogue: DialogueLine[];
  durationSeconds: number;
  questions: ListeningQuestion[];
  speakers: string[];
  level: string;
  contentType: 'listening';
}

// Grammar Types (keeping existing structure)
export interface GrammarPoint {
  id: string;
  pattern: string;
  meaning: string;
  example: string;
  explanation?: string;
  formationRules?: string[];
  usageNotes?: string;
  level: string;
  contentType: 'grammar';
}

// Progress Types
export interface SM2Data {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface UserProgress {
  userId: string;
  itemId: string;
  contentType: ContentType;
  sm2Data: SM2Data;
  timesStudied: number;
  timesCorrect: number;
  lastScore?: number;
  masteryLevel: number;
  nextReviewAt?: string;
  lastStudiedAt?: string;
}

// Quiz Types
export type QuestionType =
  | 'multiple_choice'
  | 'fill_in_blank'
  | 'translation'
  | 'sentence_construction'
  | 'error_correction'
  | 'kanji_reading'
  | 'kanji_meaning'
  | 'kanji_compound'
  | 'kanji_write'
  | 'vocab_meaning'
  | 'vocab_reading'
  | 'vocab_usage'
  | 'vocab_synonym'
  | 'listening_comprehension'
  | 'listening_task'
  | 'listening_detail'
  | 'reading_comprehension'
  | 'reading_inference'
  | 'reading_vocabulary';

export interface QuizQuestion {
  id: string;
  itemId: string;
  contentType: ContentType;
  questionType: QuestionType;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: number;
  audioUrl?: string;
}

export interface Quiz {
  id: string;
  userId: string;
  contentTypes: ContentType[];
  questions: QuizQuestion[];
  createdAt: string;
}

// API Request/Response Types
export type GrammarCategory = 'formal' | 'classical' | 'conjunctive' | 'conditional' | 'comparative' | 'emphasis' | 'negative' | 'temporal' | 'causative' | 'other';

export interface GenerateGrammarRequest {
  topic?: string;
  category?: GrammarCategory;
  count?: number;
}

export interface GenerateKanjiRequest {
  characters?: string[];
  topic?: string;
  count?: number;
}

export interface GenerateVocabularyRequest {
  topic?: string;
  count?: number;
  includeAudio?: boolean;
  partOfSpeech?: PartOfSpeech[];
}

export interface GenerateReadingRequest {
  topic?: string;
  passageType?: ReadingPassageType;
  questionCount?: number;
}

export type TTSProvider = 'openai' | 'google' | 'elevenlabs';

export interface GenerateListeningRequest {
  topic?: string;
  listeningType?: ListeningType;
  durationSeconds?: number;
  questionCount?: number;
  speakerCount?: number;
  generateAudio?: boolean; // Defaults to true on backend
  ttsProvider?: TTSProvider; // TTS provider to use for audio generation
}

export interface GenerateQuizRequest {
  userId: string;
  contentTypes?: ContentType[];
  itemIds?: string[];
  questionCount?: number;
}

export interface StatsResponse {
  totalItems: number;
  studiedCount: number;
  masteredCount: number;
  averageMastery: number;
  totalStudyTimeMinutes: number;
  byContentType: Record<string, number>;
  currentStreak: number;
  longestStreak: number;
}

export interface DueItemsResponse {
  dueCount: number;
  items: UserProgress[];
}

// Focus Types
export interface FocusContent {
  id: string;
  type: ContentType;
  title: string;
  content: {
    main: string;
    sub?: string;
    detail?: string;
    example?: string;
  };
  reason: string;
  studyTip: string;
  generatedAt: string;
  itemId: string;
}

export interface FocusDailyRequest {
  userId: string;
  preferredTypes?: ContentType[];
}

export interface FocusCompleteResponse {
  success: boolean;
  message: string;
  contentId: string;
  completedAt: string;
  progress?: {
    itemId: string;
    masteryLevel: number;
    timesStudied: number;
    nextReview?: string;
  };
  stats?: {
    totalSessions: number;
    completedSessions: number;
    streakDays: number;
    averageTimeSeconds: number;
  };
}

// ============================================================================
// Video Types
// ============================================================================

export type CharacterStyle =
  | 'anime_female'
  | 'anime_male'
  | 'realistic_female'
  | 'realistic_male'
  | 'chibi'
  | 'mascot'
  | 'none';

export type VideoStyle =
  | 'classroom'
  | 'cafe'
  | 'nature'
  | 'abstract'
  | 'manga';

export type VideoStatus = 'draft' | 'generating' | 'ready' | 'failed';

export interface FuriganaAnnotation {
  word: string;
  reading: string;
  startIndex: number;
}

export interface VideoSubtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  reading?: string;
  furigana: FuriganaAnnotation[];
  translation?: string;
}

export interface VideoScript {
  id: string;
  title: string;
  description?: string;
  subtitles: VideoSubtitle[];
  totalDurationSeconds: number;
  targetVocabulary: string[];
  grammarPoints: string[];
}

export interface VideoProject {
  id: string;
  userId: string;
  prompt: string;
  script: VideoScript;
  characterStyle: CharacterStyle;
  videoStyle: VideoStyle;
  voice: string;
  status: VideoStatus;
  audioUrl?: string;
  audioBase64?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
  progress: number;
}

export interface VideoCreateRequest {
  prompt: string;
  userId: string;
  characterStyle?: CharacterStyle;
  videoStyle?: VideoStyle;
  voice?: string;
  maxDurationSeconds?: number;
}

export interface ScriptGenerateRequest {
  prompt: string;
  maxDurationSeconds?: number;
}

export interface VideoStyleOption {
  id: string;
  name: string;
  description: string;
  imagePath?: string;
  gradient?: string;
}

export interface VideoStylesResponse {
  characters: VideoStyleOption[];
  backgrounds: VideoStyleOption[];
}

export interface VideoVoice {
  id: string;
  name: string;
  gender: string;
  description: string;
  provider: string;
}

// ============================================================================
// Rewards & Analytics Types
// ============================================================================

export type EpochType = 'daily' | 'weekly' | 'monthly';
export type EpochStatus = 'active' | 'completed' | 'processing';
export type EventType = 'view' | 'study' | 'complete' | 'save' | 'share';
export type PointsTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type RewardStatus = 'pending' | 'approved' | 'distributed' | 'rejected';
export type RewardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface Epoch {
  id: string;
  epochType: EpochType;
  startDate: string;
  endDate: string;
  status: EpochStatus;
  createdAt: string;
}

export interface ContentEvent {
  id: string;
  contentId: string;
  contentType: ContentType;
  userId?: string;
  eventType: EventType;
  eventData?: Record<string, unknown>;
  createdAt: string;
}

export interface ContentStats {
  contentId: string;
  contentType: string;
  totalViews: number;
  totalStudies: number;
  totalCompletions: number;
  totalSaves: number;
  totalShares: number;
  uniqueUsers: number;
  weightedScore: number;
}

export interface CreatorPerformance {
  creatorId: string;
  totalViews: number;
  totalStudies: number;
  totalCompletions: number;
  totalSaves: number;
  totalShares: number;
  totalPoints: number;
  contentCount: number;
}

export interface LeaderboardEntry {
  contentId: string;
  contentType: string;
  creatorId?: string;
  score: number;
  viewCount: number;
  studyCount: number;
  completionCount: number;
}

export interface CreatorPoint {
  id: string;
  creatorId: string;
  epochId: string;
  pointsEarned: number;
  tier?: PointsTier;
  createdAt: string;
}

export interface CreatorReward {
  id: string;
  creatorId: string;
  epochId: string;
  pointsEarned: number;
  tier?: PointsTier;
  rewardType?: string;
  rewardValue?: string;
  status: RewardStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  tokenAmount?: number;
  distributedAt?: string;
  createdAt: string;
}

export interface DailyReward {
  id: string;
  userId: string;
  rewardDate: string;
  qualifyingTaskId?: string;
  qualifyingTaskType?: string;
  rewardRarity: RewardRarity;
  rewardType: string;
  rewardValue?: string;
  claimed: boolean;
  claimedAt?: string;
  createdAt: string;
}

export interface FeaturedContent {
  id: string;
  contentId: string;
  contentType: string;
  creatorId?: string;
  featureDate: string;
  featureReason?: string;
  impressions: number;
  clicks: number;
  createdAt: string;
}

export interface TierThresholds {
  bronze: { min: number; max: number };
  silver: { min: number; max: number };
  gold: { min: number; max: number };
  platinum: { min: number; max: number };
}

export interface EventWeights {
  view: number;
  study: number;
  complete: number;
  save: number;
  share: number;
}

export interface DailyRewardPoolItem {
  rarity: RewardRarity;
  type: string;
  description: string;
}

export interface TrackEventRequest {
  contentId: string;
  contentType: string;
  userId?: string;
  eventType: EventType;
  eventData?: Record<string, unknown>;
}

export interface CheckDailyRewardRequest {
  userId: string;
  qualifyingTaskId: string;
  qualifyingTaskType: string;
}

export interface AdminStats {
  pendingRewardsCount: number;
  activeEpochs: {
    daily: string | null;
    weekly: string | null;
    monthly: string | null;
  };
  hasTodayFeatured: boolean;
  todayFeatured: {
    id: string;
    contentId: string;
    contentType: string;
    reason?: string;
  } | null;
}
