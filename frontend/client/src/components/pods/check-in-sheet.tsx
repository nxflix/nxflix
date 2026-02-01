import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCheckIn } from '@/lib/api';
import type { MoodType, StudyTag, CheckInResponse } from '@/lib/api-types';
import {
  Loader2,
  Camera,
  Link as LinkIcon,
  FileText,
  Check,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckInSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  podId: string;
  userId: string;
  currentStreak: number;
  onSuccess?: (response: CheckInResponse) => void;
}

const STUDY_MINUTES_OPTIONS = [15, 30, 45, 60, 90, 120];

const STUDY_TAGS: { value: StudyTag; label: string }[] = [
  { value: 'grammar', label: 'Grammar' },
  { value: 'kanji', label: 'Kanji' },
  { value: 'vocab', label: 'Vocab' },
  { value: 'listening', label: 'Listening' },
  { value: 'reading', label: 'Reading' },
  { value: 'speaking', label: 'Speaking' },
];

const MOOD_OPTIONS: { value: MoodType; emoji: string; label: string }[] = [
  { value: 'struggling', emoji: '😫', label: 'Struggling' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'great', emoji: '😊', label: 'Great' },
];

export function CheckInSheet({
  open,
  onOpenChange,
  podId,
  userId,
  currentStreak,
  onSuccess,
}: CheckInSheetProps) {
  const [studyMinutes, setStudyMinutes] = useState<number>(45);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<StudyTag[]>([]);
  const [mood, setMood] = useState<MoodType | null>(null);
  const [reflection, setReflection] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<CheckInResponse | null>(null);

  const checkInMutation = useCheckIn();

  const effectiveMinutes = customMinutes ? parseInt(customMinutes, 10) : studyMinutes;
  const canSubmit = effectiveMinutes > 0 && mood !== null;

  const toggleTag = (tag: StudyTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      const response = await checkInMutation.mutateAsync({
        podId,
        userId,
        studyMinutes: effectiveMinutes,
        mood: mood!,
        studyTags: selectedTags.length > 0 ? selectedTags : undefined,
        reflection: reflection.trim() || undefined,
      });

      setSuccessData(response);
      setShowSuccess(true);
      onSuccess?.(response);
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  const handleClose = () => {
    if (showSuccess) {
      setShowSuccess(false);
      setSuccessData(null);
      setStudyMinutes(45);
      setCustomMinutes('');
      setSelectedTags([]);
      setMood(null);
      setReflection('');
    }
    onOpenChange(false);
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (showSuccess && successData) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
          <div className="flex flex-col items-center justify-center h-full text-center px-4 space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold">Nice work!</h2>
              <div className="flex items-center justify-center gap-2 mt-2 text-orange-500">
                <Flame className="w-6 h-6" />
                <span className="text-xl font-bold">{successData.streak} day streak</span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 w-full max-w-sm">
              <p className="text-muted-foreground">
                {effectiveMinutes} min
                {selectedTags.length > 0 && ` • ${selectedTags.join(', ')}`}
              </p>
            </div>

            <Button onClick={handleClose} size="lg" className="w-full max-w-sm">
              Back to Dashboard
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="text-center pb-4">
          <SheetTitle className="text-xl font-serif">Log Your Study</SheetTitle>
          <SheetDescription>{today}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-2">
          {/* Study Duration */}
          <div className="space-y-3">
            <label className="text-sm font-medium">How long did you study?</label>
            <div className="flex flex-wrap gap-2">
              {STUDY_MINUTES_OPTIONS.map((mins) => (
                <Button
                  key={mins}
                  variant={studyMinutes === mins && !customMinutes ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setStudyMinutes(mins);
                    setCustomMinutes('');
                  }}
                >
                  {mins}
                </Button>
              ))}
              <input
                type="number"
                placeholder="Custom"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="w-20 h-9 px-3 text-sm border rounded-md bg-background"
              />
            </div>
            <p className="text-2xl font-bold text-center">
              {effectiveMinutes || 0} minutes
            </p>
          </div>

          {/* Study Tags */}
          <div className="space-y-3">
            <label className="text-sm font-medium">What did you study? (optional)</label>
            <div className="flex flex-wrap gap-2">
              {STUDY_TAGS.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={selectedTags.includes(value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleTag(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="space-y-3">
            <label className="text-sm font-medium">How are you feeling?</label>
            <div className="flex justify-center gap-4">
              {MOOD_OPTIONS.map(({ value, emoji, label }) => (
                <button
                  key={value}
                  onClick={() => setMood(value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg transition-colors',
                    mood === value
                      ? 'bg-primary/20 ring-2 ring-primary'
                      : 'hover:bg-muted'
                  )}
                >
                  <span className="text-3xl">{emoji}</span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Proof (optional) */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Add proof (optional)</label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2" disabled>
                <Camera className="w-4 h-4" />
                Screenshot
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2" disabled>
                <LinkIcon className="w-4 h-4" />
                Link
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2" disabled>
                <FileText className="w-4 h-4" />
                Note
              </Button>
            </div>
          </div>

          {/* Reflection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Quick note (optional)</label>
            <Textarea
              placeholder="What did you learn today?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              maxLength={280}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {reflection.length}/280 chars
            </p>
          </div>

          {/* Submit */}
          <div className="space-y-3 pb-6">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || checkInMutation.isPending}
              size="lg"
              className="w-full"
            >
              {checkInMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Check-In'
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              This will extend your streak to {currentStreak + 1} days <Flame className="w-4 h-4 inline text-orange-500" />
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
