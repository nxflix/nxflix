import { useState } from 'react';
import { Link } from 'wouter';
import { useReading } from '@/lib/api';
import type { ReadingPassage, ReadingQuestion } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Clock,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ReadingStudy() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const { data: passages, isLoading } = useReading();
  const currentPassage = passages?.[currentIndex];

  const handleNext = () => {
    setShowQuestions(false);
    setSelectedAnswers({});
    setShowResults(false);
    setCurrentIndex((prev) => (prev + 1) % (passages?.length || 1));
  };

  const handlePrev = () => {
    setShowQuestions(false);
    setSelectedAnswers({});
    setShowResults(false);
    setCurrentIndex((prev) => (prev - 1 + (passages?.length || 1)) % (passages?.length || 1));
  };

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleCheckAnswers = () => {
    setShowResults(true);
  };

  const getScore = () => {
    if (!currentPassage) return { correct: 0, total: 0 };
    let correct = 0;
    for (const question of currentPassage.questions) {
      if (selectedAnswers[question.id] === question.correctOption) {
        correct++;
      }
    }
    return { correct, total: currentPassage.questions.length };
  };

  const passageTypeLabel = {
    short: 'Short',
    medium: 'Medium',
    long: 'Long',
    comparison: 'Comparison',
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/study">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
                <FileText className="w-6 h-6 text-orange-500" />
                Reading Practice
              </h1>
              <p className="text-sm text-muted-foreground">
                {passages?.length ?? 0} passages available
              </p>
            </div>
          </div>
          <Link href="/create">
            <Button variant="outline" size="sm" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate More
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !currentPassage ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No reading passages yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Generate some reading content to start practicing
            </p>
            <Link href="/create">
              <Button>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Reading
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Passage Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">
                {passageTypeLabel[currentPassage.passageType]}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                ~{currentPassage.estimatedMinutes} min
              </span>
              <span>{currentPassage.wordCount} chars</span>
              <span>{currentPassage.questions.length} questions</span>
            </div>

            {/* Passage Content */}
            <AnimatePresence mode="wait">
              {!showQuestions ? (
                <motion.div
                  key="passage"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Card className="p-6">
                    {currentPassage.title && (
                      <h2 className="text-xl font-semibold mb-4">{currentPassage.title}</h2>
                    )}
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-lg leading-relaxed whitespace-pre-wrap">
                        {currentPassage.content}
                      </p>
                    </div>

                    {currentPassage.keyVocabulary.length > 0 && (
                      <div className="mt-6 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Key Vocabulary</p>
                        <div className="flex flex-wrap gap-2">
                          {currentPassage.keyVocabulary.map((item, i) => {
                            // Handle both string and object formats from API
                            const word = typeof item === 'string' ? item : (item as { word: string }).word;
                            return (
                              <span
                                key={i}
                                className="text-sm bg-primary/10 text-primary px-2 py-1 rounded"
                              >
                                {word}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>

                  <div className="flex justify-center mt-4">
                    <Button onClick={() => setShowQuestions(true)} className="gap-2">
                      <HelpCircle className="w-4 h-4" />
                      Answer Questions
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="questions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuestions(false)}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to passage
                  </Button>

                  {showResults && (
                    <Card className="p-4 bg-primary/5 border-primary/20">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Your Score</span>
                        <span className="text-2xl font-bold text-primary">
                          {getScore().correct} / {getScore().total}
                        </span>
                      </div>
                    </Card>
                  )}

                  {currentPassage.questions.map((question, qIdx) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      questionNumber={qIdx + 1}
                      selectedAnswer={selectedAnswers[question.id]}
                      onSelectAnswer={(optionIndex) => handleSelectAnswer(question.id, optionIndex)}
                      showResult={showResults}
                    />
                  ))}

                  {!showResults ? (
                    <Button
                      onClick={handleCheckAnswers}
                      disabled={Object.keys(selectedAnswers).length < currentPassage.questions.length}
                      className="w-full"
                    >
                      Check Answers
                    </Button>
                  ) : (
                    <Button onClick={handleNext} className="w-full">
                      Next Passage
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            {!showQuestions && (
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={handlePrev} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} / {passages?.length ?? 0}
                </span>
                <Button variant="outline" onClick={handleNext} className="gap-2">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  questionNumber,
  selectedAnswer,
  onSelectAnswer,
  showResult,
}: {
  question: ReadingQuestion;
  questionNumber: number;
  selectedAnswer: number | undefined;
  onSelectAnswer: (optionIndex: number) => void;
  showResult: boolean;
}) {
  const isCorrect = selectedAnswer === question.correctOption;

  return (
    <Card className="p-4">
      <p className="font-medium mb-4">
        <span className="text-muted-foreground mr-2">Q{questionNumber}.</span>
        {question.questionText}
      </p>

      <div className="space-y-2">
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;
          const isCorrectOption = idx === question.correctOption;

          return (
            <button
              key={idx}
              onClick={() => onSelectAnswer(idx)}
              disabled={showResult}
              className={cn(
                'w-full text-left p-3 rounded border transition-colors flex items-center gap-3',
                !showResult && isSelected && 'border-primary bg-primary/5',
                !showResult && !isSelected && 'hover:border-muted-foreground/50',
                showResult && isCorrectOption && 'border-green-500 bg-green-500/10',
                showResult && isSelected && !isCorrectOption && 'border-red-500 bg-red-500/10'
              )}
            >
              <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs">
                {showResult && isCorrectOption ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : showResult && isSelected && !isCorrectOption ? (
                  <X className="w-4 h-4 text-red-500" />
                ) : (
                  String.fromCharCode(65 + idx)
                )}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="mt-4 pt-3 border-t text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium">Explanation:</span> {question.explanation}
          </p>
        </div>
      )}
    </Card>
  );
}
