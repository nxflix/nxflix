import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { useFocusDaily, useFocusComplete } from '@/lib/api';
import type { FocusContent } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Check,
  RefreshCw,
  ChevronRight,
  Clock,
  Sparkles,
  Languages,
  PenTool,
  FileText,
  Headphones,
  BookOpen,
  Sun,
  Moon,
  Coffee,
  Loader2,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import type { ContentType } from '@/lib/api-types';

const contentTypeConfig: Record<ContentType, { icon: typeof BookOpen; color: string }> = {
  grammar: { icon: BookOpen, color: 'text-blue-400' },
  vocabulary: { icon: Languages, color: 'text-emerald-400' },
  kanji: { icon: PenTool, color: 'text-violet-400' },
  reading: { icon: FileText, color: 'text-amber-400' },
  listening: { icon: Headphones, color: 'text-rose-400' },
};

function getGreeting(): { text: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', icon: Coffee };
  if (hour < 17) return { text: 'Good afternoon', icon: Sun };
  return { text: 'Good evening', icon: Moon };
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

type FocusState = 'ready' | 'loading' | 'studying' | 'complete' | 'error';

export default function Focus() {
  const { userId, isAuthenticated } = useAuth();
  const [state, setState] = useState<FocusState>('ready');
  const [content, setContent] = useState<FocusContent | null>(null);
  const [studyProgress, setStudyProgress] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const focusDaily = useFocusDaily();
  const focusComplete = useFocusComplete();

  // Check if already completed today
  useEffect(() => {
    const lastCompleted = localStorage.getItem('focus-last-completed');
    if (lastCompleted === getTodayKey()) {
      setCompletedToday(true);
    }
  }, []);

  const handleStart = async () => {
    setState('loading');
    setError(null);

    try {
      const result = await focusDaily.mutateAsync({
        userId: userId || 'anonymous',
      });

      setContent(result.content);
      setState('studying');
      setIsRevealed(false);
      setStudyProgress(0);
    } catch (err) {
      console.error('Failed to get focus content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
      setState('error');
    }
  };

  const handleReveal = () => {
    setIsRevealed(true);
    // Simulate study progress
    const interval = setInterval(() => {
      setStudyProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleComplete = async () => {
    if (content) {
      try {
        const result = await focusComplete.mutateAsync({
          contentId: content.id,
          userId: userId || 'anonymous',
          quality: 4, // Default quality score
        });
        console.log('Focus session completed:', result);
      } catch (err) {
        console.error('Failed to mark complete:', err);
        // Continue anyway - don't block completion
      }
    }

    setState('complete');
    localStorage.setItem('focus-last-completed', getTodayKey());
    setCompletedToday(true);
  };

  const handleReset = () => {
    setState('ready');
    setContent(null);
    setStudyProgress(0);
    setIsRevealed(false);
    setError(null);
  };

  const handleAnotherOne = async () => {
    setState('loading');
    setError(null);

    try {
      const result = await focusDaily.mutateAsync({
        userId: userId || 'anonymous',
      });

      setContent(result.content);
      setState('studying');
      setIsRevealed(false);
      setStudyProgress(0);
    } catch (err) {
      console.error('Failed to get focus content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
      setState('error');
    }
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const ContentIcon = content ? contentTypeConfig[content.type]?.icon || BookOpen : Sparkles;
  const contentColor = content ? contentTypeConfig[content.type]?.color || 'text-primary' : 'text-primary';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-b from-background to-background/95">
      <AnimatePresence mode="wait">
        {/* Ready State - Minimal start screen */}
        {state === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <div className="inline-flex items-center gap-2 text-muted-foreground mb-4">
                <GreetingIcon className="w-5 h-5" />
                <span className="text-sm">{greeting.text}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                Focus
              </h1>
              <p className="text-muted-foreground text-lg">
                One moment. One item. Full attention.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                size="lg"
                className="h-16 px-12 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                onClick={handleStart}
              >
                <Play className="w-5 h-5 mr-2" />
                Begin
              </Button>

              {completedToday && (
                <p className="text-sm text-muted-foreground mt-6 flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  You've already focused today
                </p>
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-muted-foreground/60 mt-16"
            >
              AI will select your study item based on your progress
            </motion.p>
          </motion.div>
        )}

        {/* Loading State */}
        {state === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto mb-6"
            >
              <Sparkles className="w-16 h-16 text-primary" />
            </motion.div>
            <p className="text-muted-foreground">AI is selecting your focus item...</p>
          </motion.div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">{error || 'Failed to load content'}</p>
            <Button onClick={handleReset} variant="outline">
              Try again
            </Button>
          </motion.div>
        )}

        {/* Studying State - Show the content */}
        {state === 'studying' && content && (
          <motion.div
            key="studying"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-lg mx-auto w-full"
          >
            {/* Content type indicator */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className={`inline-flex items-center gap-2 ${contentColor}`}>
                <ContentIcon className="w-5 h-5" />
                <span className="text-sm font-medium">{content.title}</span>
              </div>
            </motion.div>

            {/* Main content card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-8 md:p-12 bg-card/50 backdrop-blur border-border/50">
                {/* Main text - always visible */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="mb-6"
                >
                  <p className="text-5xl md:text-7xl font-bold tracking-tight">
                    {content.content.main}
                  </p>
                </motion.div>

                {/* Revealed content */}
                <AnimatePresence>
                  {isRevealed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {content.content.sub && (
                        <p className="text-2xl text-muted-foreground">
                          {content.content.sub}
                        </p>
                      )}
                      {content.content.detail && (
                        <p className="text-lg text-muted-foreground/80">
                          {content.content.detail}
                        </p>
                      )}
                      {content.content.example && (
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg text-left">
                          <p className="text-sm text-muted-foreground mb-1">Example:</p>
                          <p className="text-base">{content.content.example}</p>
                        </div>
                      )}

                      {/* Study tip */}
                      {content.studyTip && (
                        <div className="mt-4 p-3 bg-primary/10 rounded-lg text-left flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-primary">{content.studyTip}</p>
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="pt-6">
                        <Progress value={studyProgress} className="h-1" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-8"
                >
                  {!isRevealed ? (
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full px-8"
                      onClick={handleReveal}
                    >
                      Reveal
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : studyProgress >= 100 ? (
                    <Button
                      size="lg"
                      className="rounded-full px-8"
                      onClick={handleComplete}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Done
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Take a moment to memorize...
                    </p>
                  )}
                </motion.div>
              </Card>
            </motion.div>

            {/* AI reason */}
            {content.reason && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-xs text-muted-foreground/60 mt-4 italic"
              >
                {content.reason}
              </motion.p>
            )}

            {/* Skip/Another option */}
            {isRevealed && studyProgress >= 100 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={handleAnotherOne}
                  disabled={focusDaily.isPending}
                >
                  {focusDaily.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  One more
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Complete State - Celebration */}
        {state === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-8"
            >
              <Check className="w-10 h-10 text-green-500" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-3xl font-serif font-bold mb-3">
                Well done
              </h2>
              <p className="text-muted-foreground mb-8">
                You've completed your focus session.
                <br />
                Come back tomorrow for more.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={handleAnotherOne}
                  disabled={focusDaily.isPending}
                >
                  {focusDaily.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Study another
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-full text-muted-foreground"
                  onClick={handleReset}
                >
                  Back to start
                </Button>
              </div>
            </motion.div>

            {/* Zen quote */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-sm text-muted-foreground/50 mt-16 italic"
            >
              "The journey of a thousand miles begins with a single step."
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
