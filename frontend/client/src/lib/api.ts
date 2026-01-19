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
  GenerateKanjiRequest,
  GenerateVocabularyRequest,
  GenerateReadingRequest,
  GenerateListeningRequest,
  GenerateQuizRequest,
  FocusContent,
  FocusDailyRequest,
  FocusCompleteResponse,
} from './api-types';

// ============================================================================
// Grammar Hooks
// ============================================================================

export function useGrammar() {
  return useQuery<GrammarPoint[]>({
    queryKey: ['/api/grammar'],
  });
}

// ============================================================================
// Kanji Hooks
// ============================================================================

export function useKanji() {
  return useQuery<KanjiItem[]>({
    queryKey: ['/api/kanji'],
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: GenerateKanjiRequest) => {
      const res = await apiRequest('POST', '/api/kanji/generate', request);
      return res.json() as Promise<KanjiItem[]>;
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: GenerateVocabularyRequest) => {
      const res = await apiRequest('POST', '/api/vocabulary/generate', request);
      return res.json() as Promise<VocabularyItem[]>;
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
  });
}

export function useGenerateReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: GenerateReadingRequest) => {
      const res = await apiRequest('POST', '/api/reading/generate', request);
      return res.json() as Promise<ReadingPassage>;
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
  });
}

export function useGenerateListening() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: GenerateListeningRequest) => {
      const res = await apiRequest('POST', '/api/listening/generate', request);
      return res.json() as Promise<ListeningItem>;
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
      return res.json() as Promise<Quiz>;
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
