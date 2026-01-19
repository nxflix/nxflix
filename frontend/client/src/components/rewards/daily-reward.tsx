import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useTodayReward,
  useCheckDailyReward,
  useClaimDailyReward,
  useUserStreak,
} from '@/lib/api';
import type { DailyReward, RewardRarity } from '@/lib/api-types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Gift,
  Sparkles,
  Star,
  Flame,
  Loader2,
  Crown,
  Zap,
  Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const rarityConfig: Record<RewardRarity, { color: string; bgColor: string; icon: typeof Star; label: string }> = {
  common: {
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    icon: Star,
    label: 'Common',
  },
  uncommon: {
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: Zap,
    label: 'Uncommon',
  },
  rare: {
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: Trophy,
    label: 'Rare',
  },
  legendary: {
    color: 'text-yellow-500',
    bgColor: 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30',
    icon: Crown,
    label: 'LEGENDARY',
  },
};

interface DailyRewardProps {
  userId: string;
  taskId?: string;
  taskType?: string;
  onRewardEarned?: (reward: DailyReward) => void;
}

export function DailyRewardButton({
  userId,
  taskId,
  taskType,
  onRewardEarned,
}: DailyRewardProps) {
  const [showReveal, setShowReveal] = useState(false);
  const [revealedReward, setRevealedReward] = useState<DailyReward | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const { data: todayRewardData, refetch: refetchToday } = useTodayReward(userId);
  const { data: streakData } = useUserStreak(userId);
  const checkReward = useCheckDailyReward();
  const claimReward = useClaimDailyReward();

  const hasReward = todayRewardData?.hasReward;
  const todayReward = todayRewardData?.reward;
  const streak = streakData?.streak || 0;

  const handleCheckReward = async () => {
    if (!taskId || !taskType) return;

    try {
      const result = await checkReward.mutateAsync({
        userId,
        qualifyingTaskId: taskId,
        qualifyingTaskType: taskType,
      });

      if (result.isNewReward) {
        setRevealedReward(result.reward);
        setShowReveal(true);
        onRewardEarned?.(result.reward);
      } else if (result.reward && !result.reward.claimed) {
        setRevealedReward(result.reward);
        setShowReveal(true);
      }
      refetchToday();
    } catch (error) {
      console.error('Error checking daily reward:', error);
    }
  };

  const handleClaim = async () => {
    if (!revealedReward) return;

    setIsRevealing(true);

    // Simulate reveal animation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      await claimReward.mutateAsync({
        rewardId: revealedReward.id,
        userId,
      });

      // Trigger confetti for rare+ rewards
      if (revealedReward.rewardRarity === 'rare' || revealedReward.rewardRarity === 'legendary') {
        confetti({
          particleCount: revealedReward.rewardRarity === 'legendary' ? 200 : 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: revealedReward.rewardRarity === 'legendary'
            ? ['#FFD700', '#FFA500', '#FF6347']
            : ['#3B82F6', '#8B5CF6', '#EC4899'],
        });
      }

      setIsRevealing(false);
      refetchToday();
    } catch (error) {
      setIsRevealing(false);
      console.error('Error claiming reward:', error);
    }
  };

  const handleOpenReward = () => {
    if (todayReward && !todayReward.claimed) {
      setRevealedReward(todayReward);
      setShowReveal(true);
    }
  };

  // Parse reward value
  const parseRewardValue = (reward: DailyReward) => {
    try {
      return JSON.parse(reward.rewardValue || '{}');
    } catch {
      return { description: reward.rewardType };
    }
  };

  return (
    <>
      {/* Floating button to show unclaimed reward */}
      {hasReward && todayReward && !todayReward.claimed && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-20 right-4 z-50"
        >
          <Button
            size="lg"
            className="rounded-full p-4 shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            onClick={handleOpenReward}
          >
            <Gift className="h-6 w-6 mr-2 animate-bounce" />
            Claim Reward!
          </Button>
        </motion.div>
      )}

      {/* Streak display */}
      {streak > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Flame className="h-4 w-4 text-orange-500" />
          <span>{streak} day streak!</span>
        </div>
      )}

      {/* Reward reveal dialog */}
      <Dialog open={showReveal} onOpenChange={setShowReveal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              Daily Reward!
            </DialogTitle>
            <DialogDescription className="text-center">
              {isRevealing
                ? 'Revealing your reward...'
                : revealedReward?.claimed
                ? 'You claimed today\'s reward!'
                : 'Tap to reveal your mystery reward!'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <AnimatePresence mode="wait">
              {revealedReward && !isRevealing && revealedReward.claimed ? (
                <motion.div
                  key="claimed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className={`p-8 rounded-xl ${rarityConfig[revealedReward.rewardRarity].bgColor}`}>
                    {(() => {
                      const Icon = rarityConfig[revealedReward.rewardRarity].icon;
                      return <Icon className={`h-16 w-16 mx-auto mb-4 ${rarityConfig[revealedReward.rewardRarity].color}`} />;
                    })()}
                    <Badge className={`mb-3 ${rarityConfig[revealedReward.rewardRarity].color}`}>
                      {rarityConfig[revealedReward.rewardRarity].label}
                    </Badge>
                    <p className="text-xl font-bold mb-2">
                      {parseRewardValue(revealedReward).description || revealedReward.rewardType}
                    </p>
                    <p className="text-sm text-muted-foreground">Claimed!</p>
                  </div>
                </motion.div>
              ) : isRevealing ? (
                <motion.div
                  key="revealing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="p-8 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20"
                  >
                    <Gift className="h-16 w-16 mx-auto text-purple-500" />
                  </motion.div>
                  <p className="mt-4 text-muted-foreground">Opening...</p>
                </motion.div>
              ) : revealedReward ? (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer p-8 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 transition-colors"
                    onClick={handleClaim}
                  >
                    <Gift className="h-16 w-16 mx-auto text-purple-500 animate-pulse" />
                    <p className="mt-4 font-medium">Tap to reveal!</p>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {revealedReward?.claimed && (
            <Button onClick={() => setShowReveal(false)} className="w-full">
              Close
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DailyRewardCard({ userId }: { userId: string }) {
  const { data: todayRewardData, isLoading } = useTodayReward(userId);
  const { data: streakData } = useUserStreak(userId);

  const hasReward = todayRewardData?.hasReward;
  const reward = todayRewardData?.reward;
  const streak = streakData?.streak || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const parseRewardValue = (r: DailyReward) => {
    try {
      return JSON.parse(r.rewardValue || '{}');
    } catch {
      return { description: r.rewardType };
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-500" />
            <span className="font-medium">Daily Reward</span>
          </div>
          {streak > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              {streak} days
            </Badge>
          )}
        </div>

        {hasReward && reward ? (
          <div className={`p-4 rounded-lg ${rarityConfig[reward.rewardRarity].bgColor}`}>
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = rarityConfig[reward.rewardRarity].icon;
                return <Icon className={`h-8 w-8 ${rarityConfig[reward.rewardRarity].color}`} />;
              })()}
              <div>
                <Badge className={rarityConfig[reward.rewardRarity].color}>
                  {rarityConfig[reward.rewardRarity].label}
                </Badge>
                <p className="font-medium mt-1">
                  {parseRewardValue(reward).description || reward.rewardType}
                </p>
                <p className="text-xs text-muted-foreground">
                  {reward.claimed ? 'Claimed' : 'Unclaimed'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-muted-foreground text-sm">
              Complete a study task to earn today's reward!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
