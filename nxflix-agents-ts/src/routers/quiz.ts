import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { KnowledgeAssessorAgent } from '../agents/knowledge-assessor.js';
import { GrammarService } from '../services/grammar.js';
import type { QuestionType } from '../models/quiz.js';

const quizRouter = Router();

// Singleton services
const grammarService = new GrammarService();
const quizAgent = new KnowledgeAssessorAgent(grammarService);

// Request schemas
const GenerateQuizRequestSchema = z.object({
  userId: z.string(),
  grammarIds: z.array(z.string()),
  questionCount: z.number().int().min(1).max(50).default(10),
  questionTypes: z.array(z.string()).default([]),
  difficulty: z.number().int().min(1).max(5).default(3),
});

const AnswerRequestSchema = z.object({
  userAnswer: z.string(),
});

const SubmitAllRequestSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    userAnswer: z.string(),
    timeTakenSeconds: z.number().nullish(),
  })),
});

const ExplainRequestSchema = z.object({
  grammarId: z.string(),
  userAnswer: z.string(),
  correctAnswer: z.string(),
});

// POST /api/quiz/generate
quizRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const request = GenerateQuizRequestSchema.parse(req.body);

    const questionTypes = request.questionTypes.length > 0
      ? request.questionTypes as QuestionType[]
      : undefined;

    const quiz = await quizAgent.generateQuiz(
      request.userId,
      request.grammarIds,
      request.questionCount,
      questionTypes,
      request.difficulty
    );

    res.json({ quiz });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(400).json({ error: String(error) });
  }
});

// GET /api/quiz/:id
quizRouter.get('/:id', (req: Request, res: Response) => {
  const quiz = quizAgent.getQuiz(req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }
  res.json({ quiz });
});

// POST /api/quiz/:id/answer/:questionId
quizRouter.post('/:id/answer/:questionId', async (req: Request, res: Response) => {
  try {
    const quizId = req.params.id;
    const questionId = req.params.questionId;
    const { userAnswer } = AnswerRequestSchema.parse(req.body);

    const quiz = quizAgent.getQuiz(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const question = quiz.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const result = await quizAgent.gradeAnswer(question, userAnswer);

    res.json({ result });
  } catch (error) {
    console.error('Error grading answer:', error);
    res.status(400).json({ error: String(error) });
  }
});

// POST /api/quiz/:id/submit
quizRouter.post('/:id/submit', async (req: Request, res: Response) => {
  try {
    const quizId = req.params.id;
    const { answers } = SubmitAllRequestSchema.parse(req.body);

    const quiz = quizAgent.getQuiz(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const results = [];
    for (const answer of answers) {
      const question = quiz.questions.find(q => q.id === answer.questionId);
      if (question) {
        const result = await quizAgent.gradeAnswer(question, answer.userAnswer);
        results.push(result);
      }
    }

    const correctCount = results.filter(r => r.isCorrect).length;
    const totalScore = results.length > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length
      : 0;

    res.json({
      results,
      totalScore,
      correctCount,
      totalCount: results.length,
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(400).json({ error: String(error) });
  }
});

// POST /api/quiz/explain
quizRouter.post('/explain', async (req: Request, res: Response) => {
  try {
    const request = ExplainRequestSchema.parse(req.body);

    const explanation = await quizAgent.explainMistake(
      request.grammarId,
      request.userAnswer,
      request.correctAnswer
    );

    res.json(explanation);
  } catch (error) {
    console.error('Error explaining mistake:', error);
    res.status(400).json({ error: String(error) });
  }
});

export { quizRouter };
