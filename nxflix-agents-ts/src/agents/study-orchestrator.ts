import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { LLMProvider } from '../providers/llm.js';
import { SM2Service } from '../services/spaced-repetition.js';
import { GrammarService } from '../services/grammar.js';
import { createTrace } from '../tracing/index.js';
import type {
  StudyRecommendation,
  RecommendationRequest,
  SessionRequest,
} from '../models/study.js';
import type { UserProgress, StudySession, SessionResult } from '../models/progress.js';
import type { GrammarPoint } from '../models/grammar.js';

const RecommendationResponse = z.object({
  grammar_ids: z.array(z.string()),
  reason: z.string(),
  focus_areas: z.array(z.string()),
  suggested_question_types: z.array(z.string()),
});

export class StudyOrchestratorAgent {
  private grammarService: GrammarService;
  private sm2Service: SM2Service;
  private llm: LLMProvider;
  private sessions: Map<string, StudySession> = new Map();

  constructor(
    grammarService: GrammarService,
    sm2Service?: SM2Service,
    llmProvider?: LLMProvider
  ) {
    this.grammarService = grammarService;
    this.sm2Service = sm2Service ?? new SM2Service();
    this.llm = llmProvider ?? new LLMProvider();
  }

  async getRecommendations(
    request: RecommendationRequest,
    userProgress: UserProgress[]
  ): Promise<StudyRecommendation> {
    const trace = createTrace('study_orchestrator.get_recommendations', {
      userId: request.userId,
      maxItems: request.maxItems,
    });

    try {
      const dueItems = this.sm2Service.getDueItems(userProgress, request.maxItems);

      const availableGrammar = this.grammarService.getGrammarPointsByIds(
        request.availableGrammarIds
      );

      const progressSummary = this.buildProgressSummary(userProgress);
      const dueSummary = this.buildDueSummary(dueItems);
      const grammarSummary = this.buildGrammarSummary(availableGrammar.slice(0, 20));

      const prompt = `You are a JLPT N1 study advisor. Based on the student's progress, recommend grammar points to study.

## Student Progress Summary
${progressSummary}

## Items Due for Review
${dueSummary}

## Available Grammar Points (sample)
${grammarSummary}

## Request
- Maximum items: ${request.maxItems}
- Focus on weak areas: ${request.focusWeakAreas}
- Include new items: ${request.includeNew}
- Time available: ${request.timeAvailableMinutes ?? 'unlimited'} minutes

Select the most appropriate grammar points to study and explain why. Consider:
1. Items that are due for review (highest priority)
2. Items with low mastery levels
3. A mix of review and new content
4. Related grammar patterns that reinforce each other

Respond with a JSON object containing:
- grammar_ids: list of grammar IDs to study (up to ${request.maxItems})
- reason: brief explanation of your recommendation
- focus_areas: specific areas the student should focus on
- suggested_question_types: recommended question types for practice`;

      const response = await this.llm.completeJson(
        [{ role: 'user', content: prompt }],
        RecommendationResponse
      );

      // Validate recommended grammar IDs exist
      let validIds = response.grammar_ids.filter(
        (id) => this.grammarService.getGrammarPoint(id) !== undefined
      );

      // Fall back to due items if LLM recommendations are invalid
      if (validIds.length === 0 && dueItems.length > 0) {
        validIds = dueItems.slice(0, request.maxItems).map((p) => p.grammarId);
      }

      const recommendation: StudyRecommendation = {
        grammarIds: validIds,
        reason: response.reason,
        priority: dueItems.length > 0 ? 1 : 2,
        estimatedTimeMinutes: validIds.length * 3,
        focusAreas: response.focus_areas,
        suggestedQuestionTypes: response.suggested_question_types,
      };

      trace?.update({ output: { grammarCount: validIds.length } });
      trace?.end();

      return recommendation;
    } catch (error) {
      trace?.update({ output: { error: String(error) } });
      trace?.end();
      throw error;
    }
  }

  async startSession(request: SessionRequest): Promise<StudySession> {
    const trace = createTrace('study_orchestrator.start_session', {
      userId: request.userId,
      grammarCount: request.grammarIds.length,
    });

    const sessionId = uuidv4();

    const session: StudySession = {
      id: sessionId,
      userId: request.userId,
      grammarIds: request.grammarIds,
      startedAt: new Date().toISOString(),
      completedAt: null,
      results: [],
      totalQuestions: request.questionCount,
      totalCorrect: 0,
    };

    this.sessions.set(sessionId, session);

    trace?.update({ output: { sessionId } });
    trace?.end();

    return session;
  }

  async completeSession(
    sessionId: string,
    results: SessionResult[],
    userProgress: Record<string, UserProgress>
  ): Promise<{ session: StudySession; updatedProgress: Record<string, UserProgress> }> {
    const trace = createTrace('study_orchestrator.complete_session', { sessionId });

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Update session with results
    session.results = results;
    session.completedAt = new Date().toISOString();
    session.totalCorrect = results.reduce((sum, r) => sum + r.correctAnswers, 0);
    session.totalQuestions = results.reduce((sum, r) => sum + r.questionsAsked, 0);

    // Update user progress using SM-2
    const updatedProgress: Record<string, UserProgress> = {};
    for (const result of results) {
      if (result.grammarId in userProgress) {
        const progress = userProgress[result.grammarId];
        const quality = Math.round(result.score);
        updatedProgress[result.grammarId] = this.sm2Service.updateProgress(
          progress,
          quality
        );
      }
    }

    trace?.update({ output: { totalCorrect: session.totalCorrect } });
    trace?.end();

    return { session, updatedProgress };
  }

  getSession(sessionId: string): StudySession | undefined {
    return this.sessions.get(sessionId);
  }

  private buildProgressSummary(progress: UserProgress[]): string {
    if (progress.length === 0) {
      return 'No previous study history.';
    }

    const total = progress.length;
    const studied = progress.filter((p) => p.timesStudied > 0).length;
    const avgMastery = progress.reduce((sum, p) => sum + p.masteryLevel, 0) / total;

    const weakItems = progress.filter(
      (p) => p.masteryLevel < 3 && p.timesStudied > 0
    );

    let summary = `- Total grammar points: ${total}
- Previously studied: ${studied}
- Average mastery level: ${avgMastery.toFixed(1)}/5
- Items needing review: ${weakItems.length}`;

    if (weakItems.length > 0) {
      const weakIds = weakItems.slice(0, 5).map((p) => p.grammarId);
      summary += `\n- Weakest items: ${weakIds.join(', ')}`;
    }

    return summary;
  }

  private buildDueSummary(dueItems: UserProgress[]): string {
    if (dueItems.length === 0) {
      return 'No items currently due for review.';
    }

    return `- ${dueItems.length} items due for review
- Item IDs: ${dueItems.slice(0, 10).map((p) => p.grammarId).join(', ')}`;
  }

  private buildGrammarSummary(grammar: GrammarPoint[]): string {
    if (grammar.length === 0) {
      return 'No grammar points available.';
    }

    return grammar
      .slice(0, 10)
      .map((g) => `- ${g.id}: ${g.pattern} (${g.meaning})`)
      .join('\n');
  }
}
