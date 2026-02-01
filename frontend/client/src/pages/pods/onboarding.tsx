import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { usePods, useJoinPod, useCreatePod } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { JLPTLevel, StudyCommitment, Pod } from '@/lib/api-types';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  Flame,
  Plus,
  Loader2,
  LogIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type OnboardingStep = 1 | 2 | 3 | 4;

interface OnboardingState {
  jlptLevel: JLPTLevel | null;
  targetExam: string | null;
  dailyCommitment: StudyCommitment | null;
  studyTime: 'morning' | 'evening' | 'flexible' | null;
}

const JLPT_LEVELS: { value: JLPTLevel; label: string; description: string }[] = [
  { value: 'N5', label: 'N5', description: 'Beginner - Basic vocabulary and kanji' },
  { value: 'N4', label: 'N4', description: 'Elementary - Basic grammar and conversation' },
  { value: 'N3', label: 'N3', description: 'Intermediate - Everyday situations' },
  { value: 'N2', label: 'N2', description: 'Upper Intermediate - Business and academic' },
  { value: 'N1', label: 'N1', description: 'Advanced - Native-level comprehension' },
];

const EXAM_DATES = [
  { value: '2026-07-05', label: 'July 2026', daysAway: 154 },
  { value: '2026-12-06', label: 'December 2026', daysAway: 308 },
  { value: 'undecided', label: 'Not sure yet', daysAway: null },
];

const COMMITMENTS: { value: StudyCommitment; emoji: string; label: string; description: string }[] = [
  { value: '30min', emoji: '🌱', label: '30 minutes', description: 'Light but sustainable' },
  { value: '1hr', emoji: '🔥', label: '1 hour', description: 'Balanced commitment' },
  { value: '2hr+', emoji: '⚡', label: '2+ hours', description: 'Intensive preparation' },
];

const STUDY_TIMES: { value: 'morning' | 'evening' | 'flexible'; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'evening', label: 'Evening' },
  { value: 'flexible', label: 'Flexible' },
];

export default function PodOnboarding() {
  const [, navigate] = useLocation();
  const { isAuthenticated, userId, login, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState<OnboardingStep>(1);
  const [state, setState] = useState<OnboardingState>({
    jlptLevel: null,
    targetExam: null,
    dailyCommitment: null,
    studyTime: null,
  });

  // Fetch matching pods when on step 4
  const { data: matchingPods, isLoading: podsLoading } = usePods(
    step === 4 && state.jlptLevel
      ? { jlptLevel: state.jlptLevel, commitment: state.dailyCommitment || undefined, hasSpace: true }
      : undefined
  );

  const joinPodMutation = useJoinPod();

  const progress = (step / 4) * 100;

  const canProceed = () => {
    switch (step) {
      case 1:
        return state.jlptLevel !== null;
      case 2:
        return state.targetExam !== null;
      case 3:
        return state.dailyCommitment !== null;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (step < 4 && canProceed()) {
      setStep((s) => (s + 1) as OnboardingStep);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as OnboardingStep);
    }
  };

  const handleJoinPod = async (podId: string) => {
    if (!userId) return;

    try {
      await joinPodMutation.mutateAsync({
        podId,
        userId,
      });
      navigate('/pods');
    } catch (error) {
      console.error('Failed to join pod:', error);
    }
  };

  // Auth loading
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <Card className="p-8">
          <Users className="w-12 h-12 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-serif font-bold mb-2">Sign In to Continue</h2>
          <p className="text-muted-foreground mb-6">
            Create an account to find your study pod.
          </p>
          <Button onClick={login} size="lg" className="w-full gap-2">
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">Step {step} of 4</span>
        {step > 1 && (
          <Button variant="ghost" size="sm" onClick={prevStep}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        )}
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-1 mb-8" />

      {/* Step 1: JLPT Level */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-serif font-bold">
              What JLPT level are you targeting?
            </h1>
          </div>

          <div className="space-y-3">
            {JLPT_LEVELS.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => setState((s) => ({ ...s, jlptLevel: value }))}
                className={cn(
                  'w-full p-4 rounded-lg border text-left transition-all',
                  state.jlptLevel === value
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-lg">{label}</span>
                    <span className="text-muted-foreground ml-2">|</span>
                    <span className="text-muted-foreground ml-2">{description}</span>
                  </div>
                  {state.jlptLevel === value && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            size="lg"
            className="w-full gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Target Exam */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-serif font-bold">
              Which exam are you preparing for?
            </h1>
          </div>

          <div className="space-y-3">
            {EXAM_DATES.map(({ value, label, daysAway }) => (
              <button
                key={value}
                onClick={() => setState((s) => ({ ...s, targetExam: value }))}
                className={cn(
                  'w-full p-4 rounded-lg border text-left transition-all',
                  state.targetExam === value
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold">{label}</span>
                    {daysAway && (
                      <span className="text-muted-foreground ml-2">
                        {daysAway} days away
                      </span>
                    )}
                  </div>
                  {state.targetExam === value && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            size="lg"
            className="w-full gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 3: Study Commitment */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-serif font-bold">
              How much can you study daily?
            </h1>
            <p className="text-muted-foreground mt-2">
              Be realistic - consistency beats intensity
            </p>
          </div>

          <div className="space-y-3">
            {COMMITMENTS.map(({ value, emoji, label, description }) => (
              <button
                key={value}
                onClick={() => setState((s) => ({ ...s, dailyCommitment: value }))}
                className={cn(
                  'w-full p-4 rounded-lg border text-left transition-all',
                  state.dailyCommitment === value
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <span className="font-bold">{label}</span>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  {state.dailyCommitment === value && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-center">When do you usually study?</p>
            <div className="flex justify-center gap-2">
              {STUDY_TIMES.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={state.studyTime === value ? 'default' : 'outline'}
                  onClick={() => setState((s) => ({ ...s, studyTime: value }))}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            size="lg"
            className="w-full gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 4: Pod Matching */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-serif font-bold">
              Here are pods that match your goals
            </h1>
          </div>

          {podsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : matchingPods && matchingPods.length > 0 ? (
            <div className="space-y-4">
              {matchingPods.slice(0, 3).map((pod, index) => (
                <Card
                  key={pod.id}
                  className={cn(
                    'p-4',
                    index === 0 && 'ring-2 ring-primary'
                  )}
                >
                  {index === 0 && (
                    <span className="text-xs font-medium text-primary mb-2 block">
                      Best Match
                    </span>
                  )}
                  <h3 className="font-bold">{pod.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pod.memberCount}/{pod.maxMembers} members • {pod.jlptLevel} •{' '}
                    {pod.dailyCommitment}/day
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>Avg streak: {Math.round(pod.averageStreak)} days</span>
                  </div>
                  <Button
                    onClick={() => handleJoinPod(pod.id)}
                    disabled={joinPodMutation.isPending}
                    className="w-full mt-4"
                  >
                    {joinPodMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : index === 0 ? (
                      'Join This Pod'
                    ) : (
                      'Join'
                    )}
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-bold mb-2">No matching pods found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Be the first to create a pod for {state.jlptLevel} learners!
              </p>
            </Card>
          )}

          {/* Create Pod CTA */}
          <Card className="p-4">
            <button
              onClick={() => navigate('/pods/create')}
              className="w-full flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="font-bold">Create Your Own Pod</span>
                <p className="text-sm text-muted-foreground">
                  Invite friends or let others find you
                </p>
              </div>
            </button>
          </Card>

          <Button
            variant="outline"
            onClick={() => navigate('/pods/browse')}
            className="w-full"
          >
            Browse All Pods
          </Button>
        </div>
      )}
    </div>
  );
}
