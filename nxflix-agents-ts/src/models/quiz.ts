import { z } from 'zod';

export const QuestionType = z.enum([
  'multiple_choice',
  'fill_in_blank',
  'translation',
  'sentence_construction',
  'error_correction',
]);
export type QuestionType = z.infer<typeof QuestionType>;

export const QuizQuestion = z.object({
  id: z.string(),
  grammarId: z.string(),
  questionType: QuestionType,
  questionText: z.string(),
  questionTextJp: z.string().nullish(),
  options: z.array(z.string()).nullish(),
  correctAnswer: z.string(),
  explanation: z.string(),
  difficulty: z.number().int().min(1).max(5).default(3),
  hints: z.array(z.string()).default([]),
});
export type QuizQuestion = z.infer<typeof QuizQuestion>;

export const Quiz = z.object({
  id: z.string(),
  userId: z.string(),
  grammarIds: z.array(z.string()),
  questions: z.array(QuizQuestion),
  difficulty: z.number().int().min(1).max(5).default(3),
  timeLimitSeconds: z.number().int().nullish(),
  createdAt: z.string().datetime().optional(),
});
export type Quiz = z.infer<typeof Quiz>;

export const QuizAnswer = z.object({
  questionId: z.string(),
  userAnswer: z.string(),
  timeTakenSeconds: z.number().nullish(),
});
export type QuizAnswer = z.infer<typeof QuizAnswer>;

export const GradedAnswer = z.object({
  questionId: z.string(),
  userAnswer: z.string(),
  correctAnswer: z.string(),
  isCorrect: z.boolean(),
  score: z.number().min(0).max(1),
  feedback: z.string(),
  grammarExplanation: z.string().nullish(),
});
export type GradedAnswer = z.infer<typeof GradedAnswer>;

export const QuizSubmission = z.object({
  quizId: z.string(),
  answers: z.array(QuizAnswer),
  totalTimeSeconds: z.number().nullish(),
});
export type QuizSubmission = z.infer<typeof QuizSubmission>;
