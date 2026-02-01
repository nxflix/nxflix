import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './queryClient';
import type {
  ContentType,
  KanjiItem,
  VocabularyItem,
  ReadingPassage,
  ListeningItem,
  GrammarPoint,
  StatsResponse,
  DueItemsResponse,
  Quiz,
  GenerateGrammarRequest,
  GenerateKanjiRequest,
  GenerateVocabularyRequest,
  GenerateReadingRequest,
  GenerateListeningRequest,
  GenerateQuizRequest,
  FocusContent,
  FocusDailyRequest,
  FocusCompleteResponse,
  VideoProject,
  VideoScript,
  VideoCreateRequest,
  ScriptGenerateRequest,
  VideoStylesResponse,
  VideoVoice,
  // Rewards & Analytics types
  Epoch,
  EpochType,
  ContentEvent,
  ContentStats,
  CreatorPerformance,
  LeaderboardEntry,
  CreatorPoint,
  CreatorReward,
  DailyReward,
  FeaturedContent,
  TierThresholds,
  EventWeights,
  DailyRewardPoolItem,
  TrackEventRequest,
  CheckDailyRewardRequest,
  AdminStats,
} from './api-types';

// ============================================================================
// Grammar Hooks
// ============================================================================

export function useGrammar() {
  return useQuery<GrammarPoint[]>({
    queryKey: ['/api/grammar'],
    queryFn: async () => {
      const res = await fetch('/api/grammar');
      if (!res.ok) throw new Error('Failed to fetch grammar');
      const data = await res.json();
      // API returns { grammar: [...], count: N } - extract the array
      return (data.grammar || data) as GrammarPoint[];
    },
  });
}

export function useGenerateGrammar() {
  return useMutation({
    mutationFn: async (request: GenerateGrammarRequest) => {
      const res = await apiRequest('POST', '/api/grammar/generate', request);
      const data = await res.json();
      // API returns { grammar: [...], count: N } - extract the array
      return (data.grammar || data) as GrammarPoint[];
    },
  });
}

export function useSaveGrammar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ grammar, isPublic, userId }: { grammar: GrammarPoint[]; isPublic?: boolean; userId?: string }) => {
      const res = await apiRequest('POST', '/api/grammar/save', { grammar, isPublic, userId });
      const data = await res.json();
      return data as { grammar: GrammarPoint[]; count: number; saved: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grammar'] });
    },
  });
}

// ============================================================================
// Kanji Hooks
// ============================================================================

export function useKanji() {
  return useQuery<KanjiItem[]>({
    queryKey: ['/api/kanji'],
    queryFn: async () => {
      const res = await fetch('/api/kanji');
      if (!res.ok) throw new Error('Failed to fetch kanji');
      const data = await res.json();
      // API returns { kanji: [...], count: N } - extract the array
      return (data.kanji || data) as KanjiItem[];
    },
  });
}

export function useKanjiSearch(query: string) {
  return useQuery<KanjiItem[]>({
    queryKey: ['/api/kanji/search', query],
    queryFn: async () => {
      const res = await fetch(`/api/kanji/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to search kanji');
      return res.json();
    },
    enabled: query.length > 0,
  });
}

export function useGenerateKanji() {
  return useMutation({
    mutationFn: async (request: GenerateKanjiRequest) => {
      const res = await apiRequest('POST', '/api/kanji/generate', request);
      const data = await res.json();
      // API returns { status, kanji: [...] } or just the array
      return (data.kanji || data) as KanjiItem[];
    },
  });
}

export function useSaveKanji() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ kanji, isPublic, userId }: { kanji: KanjiItem[]; isPublic?: boolean; userId?: string }) => {
      const res = await apiRequest('POST', '/api/kanji/save', { kanji, isPublic, userId });
      const data = await res.json();
      return data as { kanji: KanjiItem[]; count: number; saved: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kanji'] });
    },
  });
}

// ============================================================================
// Vocabulary Hooks
// ============================================================================

export function useVocabulary() {
  return useQuery<VocabularyItem[]>({
    queryKey: ['/api/vocabulary'],
    queryFn: async () => {
      const res = await fetch('/api/vocabulary');
      if (!res.ok) throw new Error('Failed to fetch vocabulary');
      const data = await res.json();
      // API returns { vocabulary: [...], count: N } - extract the array
      return (data.vocabulary || data) as VocabularyItem[];
    },
  });
}

export function useVocabularySearch(query: string) {
  return useQuery<VocabularyItem[]>({
    queryKey: ['/api/vocabulary/search', query],
    queryFn: async () => {
      const res = await fetch(`/api/vocabulary/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to search vocabulary');
      return res.json();
    },
    enabled: query.length > 0,
  });
}

export function useGenerateVocabulary() {
  return useMutation({
    mutationFn: async (request: GenerateVocabularyRequest) => {
      const res = await apiRequest('POST', '/api/vocabulary/generate', request);
      const data = await res.json();
      // API returns { status, vocabulary: [...] } or just the array
      return (data.vocabulary || data) as VocabularyItem[];
    },
  });
}

export function useSaveVocabulary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vocabulary, isPublic, userId }: { vocabulary: VocabularyItem[]; isPublic?: boolean; userId?: string }) => {
      const res = await apiRequest('POST', '/api/vocabulary/save', { vocabulary, isPublic, userId });
      const data = await res.json();
      return data as { vocabulary: VocabularyItem[]; count: number; saved: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
    },
  });
}

// ============================================================================
// Reading Hooks
// ============================================================================

export function useReading() {
  return useQuery<ReadingPassage[]>({
    queryKey: ['/api/reading'],
    queryFn: async () => {
      const res = await fetch('/api/reading');
      if (!res.ok) throw new Error('Failed to fetch reading');
      const data = await res.json();
      // API returns { reading: [...], count: N } - extract the array
      return (data.reading || data) as ReadingPassage[];
    },
  });
}

export function useGenerateReading() {
  return useMutation({
    mutationFn: async (request: GenerateReadingRequest) => {
      const res = await apiRequest('POST', '/api/reading/generate', request);
      const data = await res.json();
      // API returns { status, reading: {...} } or just the object
      return (data.reading || data) as ReadingPassage;
    },
  });
}

export function useSaveReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reading, isPublic, userId }: { reading: ReadingPassage; isPublic?: boolean; userId?: string }) => {
      const res = await apiRequest('POST', '/api/reading/save', { reading, isPublic, userId });
      const data = await res.json();
      return data as { reading: ReadingPassage; saved: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reading'] });
    },
  });
}

// ============================================================================
// Listening Hooks
// ============================================================================

export function useListening() {
  return useQuery<ListeningItem[]>({
    queryKey: ['/api/listening'],
    queryFn: async () => {
      const res = await fetch('/api/listening');
      if (!res.ok) throw new Error('Failed to fetch listening');
      const data = await res.json();
      // API returns { listening: [...], count: N } - extract the array
      return (data.listening || data) as ListeningItem[];
    },
  });
}

export function useGenerateListening() {
  return useMutation({
    mutationFn: async (request: GenerateListeningRequest) => {
      const res = await apiRequest('POST', '/api/listening/generate', request);
      const data = await res.json();
      // API returns { status, listening: {...} } or just the object
      return (data.listening || data) as ListeningItem;
    },
  });
}

export function useSaveListening() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listening, isPublic, userId }: { listening: ListeningItem; isPublic?: boolean; userId?: string }) => {
      const res = await apiRequest('POST', '/api/listening/save', { listening, isPublic, userId });
      const data = await res.json();
      return data as { listening: ListeningItem; saved: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listening'] });
    },
  });
}

// ============================================================================
// Quiz Hooks
// ============================================================================

export function useGenerateQuiz() {
  return useMutation({
    mutationFn: async (request: GenerateQuizRequest) => {
      const res = await apiRequest('POST', '/api/quiz/generate', request);
      const data = await res.json();
      // API returns { status, quiz: {...} } or just the object
      return (data.quiz || data) as Quiz;
    },
  });
}

export function useGradeQuiz() {
  return useMutation({
    mutationFn: async ({ quizId, answers }: { quizId: string; answers: Record<string, string> }) => {
      const res = await apiRequest('POST', `/api/quiz/${quizId}/grade`, { answers });
      return res.json();
    },
  });
}

// ============================================================================
// Progress Hooks
// ============================================================================

export function useUserStats(userId: string, contentType?: ContentType) {
  const params = contentType ? `?contentType=${contentType}` : '';
  return useQuery<StatsResponse>({
    queryKey: ['/api/progress', userId, 'stats', contentType],
    queryFn: async () => {
      const res = await fetch(`/api/progress/${userId}/stats${params}`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useDueItems(userId: string, contentType?: ContentType, limit?: number) {
  const params = new URLSearchParams();
  if (contentType) params.append('contentType', contentType);
  if (limit) params.append('limit', limit.toString());
  const queryString = params.toString() ? `?${params.toString()}` : '';

  return useQuery<DueItemsResponse>({
    queryKey: ['/api/progress', userId, 'due', contentType, limit],
    queryFn: async () => {
      const res = await fetch(`/api/progress/${userId}/due${queryString}`);
      if (!res.ok) throw new Error('Failed to fetch due items');
      return res.json();
    },
    enabled: !!userId,
  });
}

// ============================================================================
// TTS Hooks
// ============================================================================

export interface TTSVoice {
  id: string;
  name: string;
  language: string;
  gender: string;
  provider: string;
}

export function useTTSVoices() {
  return useQuery<TTSVoice[]>({
    queryKey: ['/api/tts/voices'],
  });
}

export function useSynthesizeSpeech() {
  return useMutation({
    mutationFn: async ({ text, voice, speed }: { text: string; voice?: string; speed?: number }) => {
      const res = await apiRequest('POST', '/api/tts/synthesize', { text, voice, speed });
      return res.json() as Promise<{ audioUrl: string; durationSeconds: number }>;
    },
  });
}

// ============================================================================
// Study Recommendations Hooks
// ============================================================================

export interface StudyRecommendation {
  contentType: ContentType;
  itemId: string;
  reason: string;
  priority: number;
}

export function useStudyRecommendations(userId: string) {
  return useMutation({
    mutationFn: async ({ focusAreas }: { focusAreas?: ContentType[] } = {}) => {
      const res = await apiRequest('POST', '/api/study/recommendations', { userId, focusAreas });
      return res.json() as Promise<{ recommendations: StudyRecommendation[] }>;
    },
  });
}

// ============================================================================
// Focus Hooks
// ============================================================================

export function useFocusDaily() {
  return useMutation({
    mutationFn: async (request: FocusDailyRequest) => {
      const res = await apiRequest('POST', '/api/focus/daily', request);
      return res.json() as Promise<{ content: FocusContent }>;
    },
  });
}

export function useFocusComplete() {
  return useMutation({
    mutationFn: async ({ contentId, userId, quality = 4 }: { contentId: string; userId: string; quality?: number }) => {
      const res = await apiRequest('POST', `/api/focus/${contentId}/complete`, { userId, quality });
      return res.json() as Promise<FocusCompleteResponse>;
    },
  });
}

// ============================================================================
// Video Hooks
// ============================================================================

export function useVideoProjects(userId?: string) {
  const params = userId ? `?userId=${userId}` : '';
  return useQuery<{ projects: VideoProject[]; count: number }>({
    queryKey: ['/api/video', userId],
    queryFn: async () => {
      const res = await fetch(`/api/video${params}`);
      if (!res.ok) throw new Error('Failed to fetch video projects');
      return res.json();
    },
  });
}

export function useVideoProject(id: string) {
  return useQuery<{ project: VideoProject }>({
    queryKey: ['/api/video', id],
    queryFn: async () => {
      const res = await fetch(`/api/video/${id}`);
      if (!res.ok) throw new Error('Failed to fetch video project');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useVideoProjectStatus(id: string) {
  return useQuery<{ status: string; progress: number; error?: string }>({
    queryKey: ['/api/video', id, 'status'],
    queryFn: async () => {
      const res = await fetch(`/api/video/${id}/status`);
      if (!res.ok) throw new Error('Failed to fetch video status');
      return res.json();
    },
    enabled: !!id,
    refetchInterval: (query) => {
      // Poll while generating
      const data = query.state.data;
      return data?.status === 'generating' ? 2000 : false;
    },
  });
}

export function useCreateVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: VideoCreateRequest) => {
      const res = await apiRequest('POST', '/api/video/create', request);
      return res.json() as Promise<{ project: VideoProject }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video'] });
    },
  });
}

export function useGenerateScript() {
  return useMutation({
    mutationFn: async (request: ScriptGenerateRequest) => {
      const res = await apiRequest('POST', '/api/video/script', request);
      return res.json() as Promise<{ script: VideoScript }>;
    },
  });
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/video/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video'] });
    },
  });
}

export function useVideoStyles() {
  return useQuery<VideoStylesResponse>({
    queryKey: ['/api/video/meta/styles'],
    queryFn: async () => {
      const res = await fetch('/api/video/meta/styles');
      if (!res.ok) throw new Error('Failed to fetch video styles');
      return res.json();
    },
  });
}

export function useVideoVoices() {
  return useQuery<{ voices: VideoVoice[] }>({
    queryKey: ['/api/video/meta/voices'],
    queryFn: async () => {
      const res = await fetch('/api/video/meta/voices');
      if (!res.ok) throw new Error('Failed to fetch video voices');
      return res.json();
    },
  });
}

export interface ProviderStatus {
  id: string;
  name: string;
  available: boolean;
  reason?: string;
  voices?: Array<{
    id: string;
    name: string;
    gender: string;
    language: string;
    provider: string;
  }>;
}

export interface ProvidersResponse {
  script: ProviderStatus[];
  tts: ProviderStatus[];
  image: ProviderStatus[];
  video: ProviderStatus[];
}

export function useVideoProviders() {
  return useQuery<ProvidersResponse>({
    queryKey: ['/api/video/meta/providers'],
    queryFn: async () => {
      const res = await fetch('/api/video/meta/providers');
      if (!res.ok) throw new Error('Failed to fetch video providers');
      return res.json();
    },
  });
}

export function useRenderVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, provider }: { id: string; provider?: string }) => {
      const endpoint = provider
        ? `/api/video/${id}/render-with-provider`
        : `/api/video/${id}/render`;
      const body = provider ? { provider } : undefined;
      const res = await apiRequest('POST', endpoint, body);
      return res.json() as Promise<{ project: VideoProject }>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/video', variables.id] });
    },
  });
}

// ============================================================================
// Animation Hooks (D-ID & Hedra - Talking Head Videos)
// ============================================================================

export interface AnimationProviderConfig {
  name: string;
  configured: boolean;
  features: string[];
  recommended?: boolean;
}

export interface AnimationConfig {
  providers: {
    did: AnimationProviderConfig;
    hedra: AnimationProviderConfig;
  };
  defaultProvider: string;
  ttsProviders: string[];
  maxDuration: number;
}

export interface AnimationVoice {
  id: string;
  name: string;
  language: string;
}

export interface GenerateAnimationRequest {
  /** Base64-encoded portrait image */
  image: string;
  /** Whether image is base64 (default true) */
  imageIsBase64?: boolean;
  /** Audio as base64 or URL (optional if text is provided) */
  audio?: string;
  /** Text to convert to speech */
  text?: string;
  /** Provider: 'd-id' (default) or 'hedra' */
  provider?: 'd-id' | 'hedra';
  /** TTS provider for text */
  ttsProvider?: 'microsoft' | 'elevenlabs' | 'google' | 'amazon';
  /** Voice ID for TTS */
  voiceId?: string;
  /** Whether to wait for completion */
  waitForCompletion?: boolean;
  /** Timeout for waiting (ms) */
  timeout?: number;
}

export interface AnimationResult {
  success: boolean;
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  provider?: string;
}

// Script types
export interface ScriptCharacter {
  id: string;
  name: string;
  nameJapanese: string;
  role: string;
  description: string;
  voiceType: string;
}

export interface ScriptLine {
  type: 'dialogue' | 'action' | 'direction' | 'transition';
  characterId?: string;
  japanese: string;
  english: string;
  notes?: string;
  duration?: number;
}

export interface ScriptScene {
  sceneNumber: number;
  location: string;
  locationJapanese: string;
  timeOfDay: string;
  description: string;
  lines: ScriptLine[];
  learningFocus?: string[];
}

export interface HollywoodScript {
  title: string;
  titleJapanese: string;
  genre: string;
  targetLevel: string;
  synopsis: string;
  synopsisJapanese: string;
  characters: ScriptCharacter[];
  scenes: ScriptScene[];
  totalDuration: number;
  learningObjectives: {
    grammar: string[];
    vocabulary: string[];
    kanji: string[];
    culturalNotes?: string[];
  };
}

export interface GenerateScriptRequest {
  grammar?: Array<{ pattern: string; meaning: string; example?: string }>;
  vocabulary?: Array<{ word: string; reading?: string; meaning: string }>;
  kanji?: Array<{ character: string; meaning: string; readings?: string[] }>;
  genre: string;
  context?: string;
  targetDuration?: number;
  characterCount?: number;
  level?: string;
}

export function useAnimationConfig() {
  return useQuery<AnimationConfig>({
    queryKey: ['/api/animation/config'],
    queryFn: async () => {
      const res = await fetch('/api/animation/config');
      if (!res.ok) throw new Error('Failed to fetch animation config');
      return res.json();
    },
  });
}

export function useAnimationVoices(provider: string = 'microsoft') {
  return useQuery<{ voices: AnimationVoice[]; provider: string }>({
    queryKey: ['/api/animation/voices', provider],
    queryFn: async () => {
      const res = await fetch(`/api/animation/voices?provider=${provider}`);
      if (!res.ok) throw new Error('Failed to fetch voices');
      return res.json();
    },
  });
}

export function useAnimationCredits() {
  return useQuery<{ credits: number; remaining: number; provider: string }>({
    queryKey: ['/api/animation/credits'],
    queryFn: async () => {
      const res = await fetch('/api/animation/credits');
      if (!res.ok) throw new Error('Failed to fetch animation credits');
      return res.json();
    },
  });
}

export function useGenerateAnimation() {
  return useMutation({
    mutationFn: async (request: GenerateAnimationRequest) => {
      const res = await apiRequest('POST', '/api/animation/generate', request);
      return res.json() as Promise<AnimationResult>;
    },
  });
}

export function useAnimationStatus(jobId: string, enabled: boolean = true, provider: string = 'd-id') {
  return useQuery<AnimationResult>({
    queryKey: ['/api/animation/status', jobId, provider],
    queryFn: async () => {
      const res = await fetch(`/api/animation/status/${jobId}?provider=${provider}`);
      if (!res.ok) throw new Error('Failed to fetch animation status');
      return res.json();
    },
    enabled: enabled && !!jobId,
    refetchInterval: (query) => {
      // Poll while processing
      const data = query.state.data;
      return data?.status === 'processing' || data?.status === 'pending' ? 3000 : false;
    },
  });
}

export function useWaitForAnimation() {
  return useMutation({
    mutationFn: async ({ jobId, timeout = 300000, provider = 'd-id' }: { jobId: string; timeout?: number; provider?: string }) => {
      const res = await apiRequest('POST', `/api/animation/wait/${jobId}?timeout=${timeout}&provider=${provider}`, {});
      return res.json() as Promise<AnimationResult>;
    },
  });
}

// Script generation hooks for Animation Lab (Hollywood-style scripts)
export function useGenerateAnimationScript() {
  return useMutation({
    mutationFn: async (request: GenerateScriptRequest) => {
      const res = await apiRequest('POST', '/api/animation/script/generate', request);
      return res.json() as Promise<{ success: boolean; script: HollywoodScript }>;
    },
  });
}

export function useExtractDialogue() {
  return useMutation({
    mutationFn: async ({ script, characterId }: { script: HollywoodScript; characterId?: string }) => {
      const res = await apiRequest('POST', '/api/animation/script/extract-dialogue', { script, characterId });
      return res.json() as Promise<{ success: boolean; dialogue: string; characterId?: string }>;
    },
  });
}

// ============================================================================
// AI Video Generation Hooks (Runway ML)
// ============================================================================

export interface GenerateAIVideoRequest {
  /** Text prompt describing the video */
  prompt: string;
  /** Optional reference image (base64 or URL) */
  image?: string;
  /** Whether image is a URL (default: false = base64) */
  imageIsUrl?: boolean;
  /** Provider */
  provider?: 'runway';
  /** Duration in seconds (5 or 10) */
  duration?: '5' | '10';
  /** Aspect ratio */
  ratio?: '16:9' | '9:16' | '1:1';
  /** Whether to wait for completion */
  waitForCompletion?: boolean;
  /** Timeout for waiting (ms) */
  timeout?: number;
}

export interface AIVideoResult {
  success: boolean;
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  progress?: number;
  provider?: string;
}

export function useGenerateAIVideo() {
  return useMutation({
    mutationFn: async (request: GenerateAIVideoRequest) => {
      const res = await apiRequest('POST', '/api/animation/ai-video/generate', request);
      return res.json() as Promise<AIVideoResult>;
    },
  });
}

export function useAIVideoStatus(jobId: string, enabled: boolean = true) {
  return useQuery<AIVideoResult>({
    queryKey: ['/api/animation/ai-video/status', jobId],
    queryFn: async () => {
      const res = await fetch(`/api/animation/ai-video/status/${jobId}`);
      if (!res.ok) throw new Error('Failed to fetch AI video status');
      return res.json();
    },
    enabled: enabled && !!jobId,
    refetchInterval: (query) => {
      // Poll while processing
      const data = query.state.data;
      return data?.status === 'processing' || data?.status === 'pending' ? 5000 : false;
    },
  });
}

export function useWaitForAIVideo() {
  return useMutation({
    mutationFn: async ({ jobId, timeout = 600000 }: { jobId: string; timeout?: number }) => {
      const res = await apiRequest('POST', `/api/animation/ai-video/wait/${jobId}?timeout=${timeout}`, {});
      return res.json() as Promise<AIVideoResult>;
    },
  });
}

// ============================================================================
// Analytics Hooks
// ============================================================================

export function useTrackEvent() {
  return useMutation({
    mutationFn: async (request: TrackEventRequest) => {
      const res = await apiRequest('POST', '/api/analytics/event', request);
      return res.json() as Promise<{ success: boolean; event: ContentEvent }>;
    },
  });
}

export function useContentStats(contentId: string) {
  return useQuery<{ stats: ContentStats }>({
    queryKey: ['/api/analytics/content', contentId, 'stats'],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/content/${contentId}/stats`);
      if (!res.ok) throw new Error('Failed to fetch content stats');
      return res.json();
    },
    enabled: !!contentId,
  });
}

export function useCreatorPerformance(userId: string, epochId?: string) {
  const params = epochId ? `?epochId=${epochId}` : '';
  return useQuery<{ performance: CreatorPerformance }>({
    queryKey: ['/api/analytics/creator', userId, 'performance', epochId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/creator/${userId}/performance${params}`);
      if (!res.ok) throw new Error('Failed to fetch creator performance');
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useAnalyticsLeaderboard(epochId?: string, contentType?: string, limit: number = 10) {
  const params = new URLSearchParams();
  if (epochId) params.set('epochId', epochId);
  if (contentType) params.set('contentType', contentType);
  params.set('limit', limit.toString());
  const queryString = params.toString() ? `?${params.toString()}` : '';

  return useQuery<{ leaderboard: LeaderboardEntry[]; count: number }>({
    queryKey: ['/api/analytics/leaderboard', epochId, contentType, limit],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/leaderboard${queryString}`);
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    },
  });
}

export function useEpochs() {
  return useQuery<{ epochs: Epoch[]; count: number }>({
    queryKey: ['/api/analytics/epochs'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/epochs');
      if (!res.ok) throw new Error('Failed to fetch epochs');
      return res.json();
    },
  });
}

export function useCurrentEpochs() {
  return useQuery<{ epochs: Record<EpochType, Epoch | null> }>({
    queryKey: ['/api/analytics/epochs/current'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/epochs/current');
      if (!res.ok) throw new Error('Failed to fetch current epochs');
      return res.json();
    },
  });
}

export function useEventWeights() {
  return useQuery<{ weights: EventWeights }>({
    queryKey: ['/api/analytics/weights'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/weights');
      if (!res.ok) throw new Error('Failed to fetch event weights');
      return res.json();
    },
  });
}

// ============================================================================
// Creator Rewards Hooks
// ============================================================================

export function useCreatorPoints(creatorId: string, epochId?: string) {
  const params = epochId ? `?epochId=${epochId}` : '';
  return useQuery<{ points: CreatorPoint[]; count: number }>({
    queryKey: ['/api/rewards/creator', creatorId, 'points', epochId],
    queryFn: async () => {
      const res = await fetch(`/api/rewards/creator/${creatorId}/points${params}`);
      if (!res.ok) throw new Error('Failed to fetch creator points');
      return res.json();
    },
    enabled: !!creatorId,
  });
}

export function useCreatorTotalPoints(creatorId: string) {
  return useQuery<{ totalPoints: number; tier: string | null }>({
    queryKey: ['/api/rewards/creator', creatorId, 'total'],
    queryFn: async () => {
      const res = await fetch(`/api/rewards/creator/${creatorId}/total`);
      if (!res.ok) throw new Error('Failed to fetch total points');
      return res.json();
    },
    enabled: !!creatorId,
  });
}

export function useCreatorRewards(creatorId: string) {
  return useQuery<{ rewards: CreatorReward[]; count: number }>({
    queryKey: ['/api/rewards/creator', creatorId, 'rewards'],
    queryFn: async () => {
      const res = await fetch(`/api/rewards/creator/${creatorId}/rewards`);
      if (!res.ok) throw new Error('Failed to fetch creator rewards');
      return res.json();
    },
    enabled: !!creatorId,
  });
}

export function usePointsLeaderboard(epochId?: string, limit: number = 10) {
  const params = new URLSearchParams();
  if (epochId) params.set('epochId', epochId);
  params.set('limit', limit.toString());
  const queryString = params.toString() ? `?${params.toString()}` : '';

  return useQuery<{ leaderboard: CreatorPoint[]; count: number }>({
    queryKey: ['/api/rewards/leaderboard', epochId, limit],
    queryFn: async () => {
      const res = await fetch(`/api/rewards/leaderboard${queryString}`);
      if (!res.ok) throw new Error('Failed to fetch points leaderboard');
      return res.json();
    },
  });
}

export function useTierThresholds() {
  return useQuery<{ tiers: TierThresholds }>({
    queryKey: ['/api/rewards/tiers'],
    queryFn: async () => {
      const res = await fetch('/api/rewards/tiers');
      if (!res.ok) throw new Error('Failed to fetch tier thresholds');
      return res.json();
    },
  });
}

// ============================================================================
// Daily Rewards Hooks
// ============================================================================

export function useCheckDailyReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CheckDailyRewardRequest) => {
      const res = await apiRequest('POST', '/api/rewards/daily/check', request);
      return res.json() as Promise<{ success: boolean; reward: DailyReward; isNewReward: boolean }>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/daily', variables.userId] });
    },
  });
}

export function useTodayReward(userId: string) {
  return useQuery<{ hasReward: boolean; reward: DailyReward | null }>({
    queryKey: ['/api/rewards/daily', userId, 'today'],
    queryFn: async () => {
      const res = await fetch(`/api/rewards/daily/${userId}/today`);
      if (!res.ok) throw new Error('Failed to fetch today reward');
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useClaimDailyReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rewardId, userId }: { rewardId: string; userId: string }) => {
      const res = await apiRequest('POST', `/api/rewards/daily/${rewardId}/claim`, { userId });
      return res.json() as Promise<{ success: boolean; reward: DailyReward }>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/daily', variables.userId] });
    },
  });
}

export function useDailyRewardsHistory(userId: string) {
  return useQuery<{ rewards: DailyReward[]; count: number }>({
    queryKey: ['/api/rewards/daily', userId, 'history'],
    queryFn: async () => {
      const res = await fetch(`/api/rewards/daily/${userId}/history`);
      if (!res.ok) throw new Error('Failed to fetch daily rewards history');
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useUserStreak(userId: string) {
  return useQuery<{ streak: number }>({
    queryKey: ['/api/rewards/daily', userId, 'streak'],
    queryFn: async () => {
      const res = await fetch(`/api/rewards/daily/${userId}/streak`);
      if (!res.ok) throw new Error('Failed to fetch user streak');
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useDailyRewardPool() {
  return useQuery<{ pool: DailyRewardPoolItem[]; distribution: Record<string, string> }>({
    queryKey: ['/api/rewards/daily/pool'],
    queryFn: async () => {
      const res = await fetch('/api/rewards/daily/pool');
      if (!res.ok) throw new Error('Failed to fetch reward pool');
      return res.json();
    },
  });
}

// ============================================================================
// Featured Content Hooks
// ============================================================================

export function useTodayFeatured() {
  return useQuery<{ featured: FeaturedContent | null }>({
    queryKey: ['/api/rewards/featured/today'],
    queryFn: async () => {
      const res = await fetch('/api/rewards/featured/today');
      if (!res.ok) throw new Error('Failed to fetch today featured');
      return res.json();
    },
  });
}

export function useRecentFeatured(days: number = 7) {
  return useQuery<{ featured: FeaturedContent[]; count: number }>({
    queryKey: ['/api/rewards/featured/recent', days],
    queryFn: async () => {
      const res = await fetch(`/api/rewards/featured/recent?days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch recent featured');
      return res.json();
    },
  });
}

export function useRecordFeaturedImpression() {
  return useMutation({
    mutationFn: async (featuredId: string) => {
      const res = await apiRequest('POST', `/api/rewards/featured/${featuredId}/impression`);
      return res.json() as Promise<{ success: boolean }>;
    },
  });
}

export function useRecordFeaturedClick() {
  return useMutation({
    mutationFn: async (featuredId: string) => {
      const res = await apiRequest('POST', `/api/rewards/featured/${featuredId}/click`);
      return res.json() as Promise<{ success: boolean }>;
    },
  });
}

// ============================================================================
// Admin Hooks
// ============================================================================

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to fetch admin stats');
      return res.json();
    },
  });
}

export function usePendingRewards() {
  return useQuery<{ rewards: CreatorReward[]; count: number }>({
    queryKey: ['/api/admin/rewards/pending'],
    queryFn: async () => {
      const res = await fetch('/api/admin/rewards/pending');
      if (!res.ok) throw new Error('Failed to fetch pending rewards');
      return res.json();
    },
  });
}

export function useApproveReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rewardId, reviewedBy, tokenAmount }: { rewardId: string; reviewedBy: string; tokenAmount?: number }) => {
      const res = await apiRequest('POST', `/api/admin/rewards/${rewardId}/approve`, { reviewedBy, tokenAmount });
      return res.json() as Promise<{ success: boolean; reward: CreatorReward }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rewards/pending'] });
    },
  });
}

export function useRejectReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rewardId, reviewedBy }: { rewardId: string; reviewedBy: string }) => {
      const res = await apiRequest('POST', `/api/admin/rewards/${rewardId}/reject`, { reviewedBy });
      return res.json() as Promise<{ success: boolean; reward: CreatorReward }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rewards/pending'] });
    },
  });
}

export function useDistributeReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rewardId: string) => {
      const res = await apiRequest('POST', `/api/admin/rewards/${rewardId}/distribute`);
      return res.json() as Promise<{ success: boolean; reward: CreatorReward }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rewards/pending'] });
    },
  });
}

export function useSelectFeaturedContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contentId, contentType, creatorId, reason }: { contentId: string; contentType: string; creatorId?: string; reason?: string }) => {
      const res = await apiRequest('POST', '/api/admin/featured/select', { contentId, contentType, creatorId, reason });
      return res.json() as Promise<{ success: boolean; featured: FeaturedContent }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/featured'] });
    },
  });
}

export function useAutoSelectFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/featured/auto-select');
      return res.json() as Promise<{ success: boolean; featured: FeaturedContent }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/featured'] });
    },
  });
}

export function useInitializeEpochs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/epochs/initialize');
      return res.json() as Promise<{ success: boolean; epochs: Record<EpochType, Epoch> }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/epochs'] });
    },
  });
}

export function useRolloverEpochs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/epochs/rollover');
      return res.json() as Promise<{ success: boolean; completedEpochs: number; epochs: Epoch[] }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/epochs'] });
    },
  });
}

export function useProcessEpochRewards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (epochId: string) => {
      const res = await apiRequest('POST', `/api/admin/epochs/${epochId}/process`);
      return res.json() as Promise<{ success: boolean; result: unknown }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rewards/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/leaderboard'] });
    },
  });
}

// ============================================================================
// Pod Hooks (Study Accountability Groups)
// ============================================================================

import type {
  Pod,
  PodMember,
  CheckIn,
  PodWithMembers,
  UserPodMembership,
  CreatePodRequest,
  ListPodsParams,
  JoinPodRequest,
  CheckInRequest,
  CheckInResponse,
} from './api-types';

/**
 * Fetch all pods with optional filtering
 */
export function usePods(params?: ListPodsParams) {
  const searchParams = new URLSearchParams();
  if (params?.jlptLevel) searchParams.set('jlptLevel', params.jlptLevel);
  if (params?.commitment) searchParams.set('commitment', params.commitment);
  if (params?.hasSpace !== undefined) searchParams.set('hasSpace', String(params.hasSpace));
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';

  return useQuery<Pod[]>({
    queryKey: ['/api/pods', params],
    queryFn: async () => {
      const res = await fetch(`/api/pods${queryString}`);
      if (!res.ok) throw new Error('Failed to fetch pods');
      return res.json();
    },
  });
}

/**
 * Fetch a single pod with its members
 */
export function usePod(podId: string) {
  return useQuery<PodWithMembers>({
    queryKey: ['/api/pods', podId],
    queryFn: async () => {
      const res = await fetch(`/api/pods/${podId}`);
      if (!res.ok) throw new Error('Failed to fetch pod');
      return res.json();
    },
    enabled: !!podId,
  });
}

/**
 * Fetch pod members
 */
export function usePodMembers(podId: string) {
  return useQuery<PodMember[]>({
    queryKey: ['/api/pods', podId, 'members'],
    queryFn: async () => {
      const res = await fetch(`/api/pods/${podId}/members`);
      if (!res.ok) throw new Error('Failed to fetch pod members');
      return res.json();
    },
    enabled: !!podId,
  });
}

/**
 * Fetch pods that a user belongs to
 */
export function useUserPods(userId: string) {
  return useQuery<UserPodMembership[]>({
    queryKey: ['/api/users', userId, 'pods'],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/pods`);
      if (!res.ok) throw new Error('Failed to fetch user pods');
      return res.json();
    },
    enabled: !!userId,
  });
}

/**
 * Create a new pod
 */
export function useCreatePod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreatePodRequest) => {
      const res = await apiRequest('POST', '/api/pods', request);
      return res.json() as Promise<Pod>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pods'] });
    },
  });
}

/**
 * Join a pod
 */
export function useJoinPod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ podId, ...request }: JoinPodRequest & { podId: string }) => {
      const res = await apiRequest('POST', `/api/pods/${podId}/join`, request);
      return res.json() as Promise<PodMember>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/pods', variables.podId] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', variables.userId, 'pods'] });
    },
  });
}

/**
 * Leave a pod
 */
export function useLeavePod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ podId, userId }: { podId: string; userId: string }) => {
      const res = await apiRequest('POST', `/api/pods/${podId}/leave`, { userId });
      return res.json() as Promise<{ success: boolean }>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/pods', variables.podId] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', variables.userId, 'pods'] });
    },
  });
}

/**
 * Submit a daily check-in
 */
export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ podId, ...request }: CheckInRequest & { podId: string }) => {
      const res = await apiRequest('POST', `/api/pods/${podId}/check-in`, request);
      return res.json() as Promise<CheckInResponse>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/pods', variables.podId] });
      queryClient.invalidateQueries({ queryKey: ['/api/pods', variables.podId, 'check-ins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pods', variables.podId, 'members'] });
    },
  });
}

/**
 * Fetch check-ins for a pod
 */
export function usePodCheckIns(podId: string, date?: string) {
  const params = date ? `?date=${date}` : '';

  return useQuery<CheckIn[]>({
    queryKey: ['/api/pods', podId, 'check-ins', date],
    queryFn: async () => {
      const res = await fetch(`/api/pods/${podId}/check-ins${params}`);
      if (!res.ok) throw new Error('Failed to fetch check-ins');
      return res.json();
    },
    enabled: !!podId,
  });
}

/**
 * Approve a pending member (leader only)
 */
export function useApprovePodMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ podId, memberId, leaderId }: { podId: string; memberId: string; leaderId: string }) => {
      const res = await apiRequest('POST', `/api/pods/${podId}/members/${memberId}/approve`, { leaderId });
      return res.json() as Promise<PodMember>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/pods', variables.podId] });
      queryClient.invalidateQueries({ queryKey: ['/api/pods', variables.podId, 'members'] });
    },
  });
}
