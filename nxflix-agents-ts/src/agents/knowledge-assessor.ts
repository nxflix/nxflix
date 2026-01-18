import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { LLMProvider } from '../providers/llm.js';
import { GrammarService } from '../services/grammar.js';
import { createTrace } from '../tracing/index.js';
import type { Quiz, QuizQuestion, QuestionType, GradedAnswer } from '../models/quiz.js';
import type { GrammarPoint } from '../models/grammar.js';

const GeneratedQuestions = z.object({
  questions: z.array(z.record(z.unknown())),
});

const GradingResult = z.object({
  is_correct: z.boolean(),
  score: z.number(),
  feedback: z.string(),
  grammar_explanation: z.string().nullish(),
});

const MistakeExplanation = z.object({
  explanation: z.string(),
  correct_usage: z.string(),
  common_mistakes: z.array(z.string()),
  practice_suggestions: z.array(z.string()),
});

export class KnowledgeAssessorAgent {
  private grammarService: GrammarService;
  private llm: LLMProvider;
  private quizzes: Map<string, Quiz> = new Map();

  constructor(grammarService: GrammarService, llmProvider?: LLMProvider) {
    this.grammarService = grammarService;
    this.llm = llmProvider ?? new LLMProvider();
  }

  async generateQuiz(
    userId: string,
    grammarIds: string[],
    questionCount: number = 10,
    questionTypes: QuestionType[] = ['multiple_choice', 'fill_in_blank'],
    difficulty: number = 3
  ): Promise<Quiz> {
    const trace = createTrace('knowledge_assessor.generate_quiz', {
      userId,
      grammarCount: grammarIds.length,
      questionCount,
    });

    try {
      const grammarPoints = this.grammarService.getGrammarPointsByIds(grammarIds);
      if (grammarPoints.length === 0) {
        throw new Error('No valid grammar points found');
      }

      const grammarInfo = this.formatGrammarForPrompt(grammarPoints);
      const typesStr = questionTypes.join(', ');

      const prompt = `You are a JLPT N1 exam question creator. Generate ${questionCount} quiz questions for these grammar patterns:

${grammarInfo}

## Requirements
- Question types to use: ${typesStr}
- Target difficulty: ${difficulty}/5
- Questions should test understanding, not just memorization
- Include context-appropriate example sentences
- For multiple choice, provide 4 plausible options

## Question Type Guidelines
- multiple_choice: Provide 4 options with one correct answer
- fill_in_blank: Create a sentence with a blank for the grammar pattern
- translation: Provide a Japanese sentence to translate to English
- sentence_construction: Give words/phrases to construct a sentence using the grammar
- error_correction: Present a sentence with an error to identify and fix

Generate a JSON object with a "questions" array. Each question should have:
- id: unique identifier (e.g., "q1", "q2")
- grammar_id: the grammar pattern being tested
- question_type: one of ${typesStr}
- question_text: the question in English
- question_text_jp: the question in Japanese (if applicable)
- options: array of 4 choices (for multiple_choice only)
- correct_answer: the correct answer
- explanation: why this is correct
- difficulty: 1-5 rating
- hints: array of helpful hints (optional)`;

      const response = await this.llm.completeJson(
        [{ role: 'user', content: prompt }],
        GeneratedQuestions
      );

      // Parse questions
      const questions: QuizQuestion[] = [];
      for (let i = 0; i < Math.min(response.questions.length, questionCount); i++) {
        const qData = response.questions[i] as Record<string, unknown>;
        try {
          const question: QuizQuestion = {
            id: (qData.id as string) ?? `q${i + 1}`,
            grammarId: (qData.grammar_id as string) ?? grammarIds[0],
            questionType: (qData.question_type as QuestionType) ?? 'multiple_choice',
            questionText: (qData.question_text as string) ?? '',
            questionTextJp: qData.question_text_jp as string | undefined,
            options: qData.options as string[] | undefined,
            correctAnswer: (qData.correct_answer as string) ?? '',
            explanation: (qData.explanation as string) ?? '',
            difficulty: (qData.difficulty as number) ?? difficulty,
            hints: (qData.hints as string[]) ?? [],
          };
          questions.push(question);
        } catch {
          continue;
        }
      }

      const quizId = uuidv4();
      const quiz: Quiz = {
        id: quizId,
        userId,
        grammarIds,
        questions,
        difficulty,
        timeLimitSeconds: null,
        createdAt: new Date().toISOString(),
      };

      this.quizzes.set(quizId, quiz);

      trace?.update({ output: { quizId, questionCount: questions.length } });
      trace?.end();

      return quiz;
    } catch (error) {
      trace?.update({ output: { error: String(error) } });
      trace?.end();
      throw error;
    }
  }

  async gradeAnswer(question: QuizQuestion, userAnswer: string): Promise<GradedAnswer> {
    const trace = createTrace('knowledge_assessor.grade_answer', {
      questionId: question.id,
    });

    try {
      const grammar = this.grammarService.getGrammarPoint(question.grammarId);
      const grammarInfo = grammar
        ? `Pattern: ${grammar.pattern}\nMeaning: ${grammar.meaning}`
        : '';

      const prompt = `You are a JLPT N1 exam grader. Grade this answer:

## Question
Type: ${question.questionType}
Question: ${question.questionText}
${question.questionTextJp ? `Japanese: ${question.questionTextJp}` : ''}
Correct Answer: ${question.correctAnswer}

## Grammar Being Tested
${grammarInfo}

## User's Answer
${userAnswer}

Grade the answer and provide:
1. is_correct: true if the answer is correct or acceptably close
2. score: 0.0 to 1.0 (allow partial credit for partially correct answers)
3. feedback: brief, encouraging feedback
4. grammar_explanation: explain the grammar point if the answer was wrong

Be fair in grading - accept reasonable alternative answers that demonstrate understanding.`;

      const response = await this.llm.completeJson(
        [{ role: 'user', content: prompt }],
        GradingResult
      );

      const gradedAnswer: GradedAnswer = {
        questionId: question.id,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: response.is_correct,
        score: response.score,
        feedback: response.feedback,
        grammarExplanation: response.grammar_explanation ?? null,
      };

      trace?.update({ output: { isCorrect: response.is_correct, score: response.score } });
      trace?.end();

      return gradedAnswer;
    } catch (error) {
      trace?.update({ output: { error: String(error) } });
      trace?.end();
      throw error;
    }
  }

  async explainMistake(
    grammarId: string,
    userAnswer: string,
    correctAnswer: string
  ): Promise<{
    grammarId: string;
    grammarPattern: string;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
    correctUsage: string;
    commonMistakes: string[];
    practiceSuggestions: string[];
  }> {
    const trace = createTrace('knowledge_assessor.explain_mistake', { grammarId });

    try {
      const grammar = this.grammarService.getGrammarPoint(grammarId);
      if (!grammar) {
        throw new Error(`Grammar point not found: ${grammarId}`);
      }

      const prompt = `You are a JLPT N1 tutor helping a student understand their mistake.

## Grammar Point
Pattern: ${grammar.pattern}
Meaning: ${grammar.meaning}
Example: ${grammar.example}
Translation: ${grammar.exampleTranslation}

## The Mistake
User's answer: ${userAnswer}
Correct answer: ${correctAnswer}

Provide a helpful explanation including:
1. explanation: Why the user's answer was incorrect
2. correct_usage: How to correctly use this grammar pattern
3. common_mistakes: List of common mistakes students make with this pattern
4. practice_suggestions: Specific practice recommendations

Be encouraging and focus on learning, not criticism.`;

      const response = await this.llm.completeJson(
        [{ role: 'user', content: prompt }],
        MistakeExplanation
      );

      const result = {
        grammarId,
        grammarPattern: grammar.pattern,
        userAnswer,
        correctAnswer,
        explanation: response.explanation,
        correctUsage: response.correct_usage,
        commonMistakes: response.common_mistakes,
        practiceSuggestions: response.practice_suggestions,
      };

      trace?.update({ output: { success: true } });
      trace?.end();

      return result;
    } catch (error) {
      trace?.update({ output: { error: String(error) } });
      trace?.end();
      throw error;
    }
  }

  getQuiz(quizId: string): Quiz | undefined {
    return this.quizzes.get(quizId);
  }

  private formatGrammarForPrompt(grammarPoints: GrammarPoint[]): string {
    return grammarPoints
      .map(
        (g) => `### ${g.pattern}
- ID: ${g.id}
- Meaning: ${g.meaning}
- Category: ${g.category}
- Example: ${g.example}
- Translation: ${g.exampleTranslation}
`
      )
      .join('\n');
  }
}
