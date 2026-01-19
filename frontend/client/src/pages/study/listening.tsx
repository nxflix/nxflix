import { useState, useRef } from 'react';
import { Link } from 'wouter';
import { useListening } from '@/lib/api';
import type { ListeningItem, ListeningQuestion } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Headphones,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Check,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ListeningStudy() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { data: listeningItems, isLoading } = useListening();
  const currentItem = listeningItems?.[currentIndex];

  const handleNext = () => {
    setShowTranscript(false);
    setSelectedAnswers({});
    setShowResults(false);
    setCurrentTime(0);
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % (listeningItems?.length || 1));
  };

  const handlePrev = () => {
    setShowTranscript(false);
    setSelectedAnswers({});
    setShowResults(false);
    setCurrentTime(0);
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + (listeningItems?.length || 1)) % (listeningItems?.length || 1));
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    audioRef.current.play();
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleCheckAnswers = () => {
    setShowResults(true);
  };

  const getScore = () => {
    if (!currentItem) return { correct: 0, total: 0 };
    let correct = 0;
    for (const question of currentItem.questions) {
      if (selectedAnswers[question.id] === question.correctOption) {
        correct++;
      }
    }
    return { correct, total: currentItem.questions.length };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const listeningTypeLabel = {
    task_based: 'Task-Based',
    point_comprehension: 'Point Comprehension',
    quick_response: 'Quick Response',
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
                <Headphones className="w-6 h-6 text-pink-500" />
                Listening Practice
              </h1>
              <p className="text-sm text-muted-foreground">
                {listeningItems?.length ?? 0} exercises available
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
        ) : !currentItem ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No listening exercises yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Generate some listening content to start practicing
            </p>
            <Link href="/create">
              <Button>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Listening
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Exercise Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">
                {listeningTypeLabel[currentItem.listeningType]}
              </span>
              <span>{currentItem.durationSeconds}s</span>
              <span>{currentItem.questions.length} questions</span>
              <span>{currentItem.speakers.length} speakers</span>
            </div>

            {/* Audio Player */}
            <Card className="p-6">
              {currentItem.audioUrl && (
                <audio
                  ref={audioRef}
                  src={currentItem.audioUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                />
              )}

              <div className="flex items-center justify-center gap-4 mb-6">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRestart}
                  disabled={!currentItem.audioUrl}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  className="w-16 h-16 rounded-full"
                  onClick={handlePlayPause}
                  disabled={!currentItem.audioUrl}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowTranscript(!showTranscript)}
                >
                  {showTranscript ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <Slider
                  value={[currentTime]}
                  max={duration || currentItem.durationSeconds}
                  step={0.1}
                  onValueChange={handleSeek}
                  disabled={!currentItem.audioUrl}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration || currentItem.durationSeconds)}</span>
                </div>
              </div>

              {!currentItem.audioUrl && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Audio not available. Read the transcript below.
                </p>
              )}
            </Card>

            {/* Transcript (collapsible) */}
            <AnimatePresence>
              {showTranscript && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Transcript
                    </h3>
                    <div className="space-y-3">
                      {currentItem.dialogue.map((line, idx) => (
                        <div key={idx} className="flex gap-3">
                          <span className="font-medium text-primary min-w-[80px]">
                            {line.speaker}:
                          </span>
                          <span>{line.text}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Questions */}
            <div className="space-y-4">
              <h3 className="font-semibold">Questions</h3>

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

              {currentItem.questions.map((question, qIdx) => (
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
                  disabled={Object.keys(selectedAnswers).length < currentItem.questions.length}
                  className="w-full"
                >
                  Check Answers
                </Button>
              ) : (
                <Button onClick={handleNext} className="w-full">
                  Next Exercise
                </Button>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handlePrev} className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {listeningItems?.length ?? 0}
              </span>
              <Button variant="outline" onClick={handleNext} className="gap-2">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
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
  question: ListeningQuestion;
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
