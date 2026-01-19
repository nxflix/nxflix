import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  useCreatorPerformance,
  useCreatorTotalPoints,
  useCreatorRewards,
  useCreatorPoints,
  useCurrentEpochs,
  useTierThresholds,
} from '@/lib/api';
import type { CreatorReward, PointsTier } from '@/lib/api-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Trophy,
  TrendingUp,
  Eye,
  BookOpen,
  CheckCircle,
  Bookmark,
  Share2,
  Award,
  Clock,
  Loader2,
  Star,
} from 'lucide-react';
import { motion } from 'framer-motion';

const tierColors: Record<PointsTier, string> = {
  bronze: 'bg-amber-700 text-white',
  silver: 'bg-gray-400 text-white',
  gold: 'bg-yellow-500 text-black',
  platinum: 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white',
};

const tierIcons: Record<PointsTier, string> = {
  bronze: 'Cu',
  silver: 'Ag',
  gold: 'Au',
  platinum: 'Pt',
};

export default function CreatorDashboard() {
  const { user } = useAuth();
  const userId = user?.id || 'demo-user';
  const [selectedEpochId, setSelectedEpochId] = useState<string | undefined>(undefined);

  const { data: performanceData, isLoading: performanceLoading } = useCreatorPerformance(userId, selectedEpochId);
  const { data: totalPointsData, isLoading: totalPointsLoading } = useCreatorTotalPoints(userId);
  const { data: rewardsData, isLoading: rewardsLoading } = useCreatorRewards(userId);
  const { data: pointsData, isLoading: pointsLoading } = useCreatorPoints(userId);
  const { data: epochsData } = useCurrentEpochs();
  const { data: tiersData } = useTierThresholds();

  const performance = performanceData?.performance;
  const totalPoints = totalPointsData?.totalPoints || 0;
  const currentTier = totalPointsData?.tier as PointsTier | null;
  const rewards = rewardsData?.rewards || [];
  const points = pointsData?.points || [];

  const isLoading = performanceLoading || totalPointsLoading || rewardsLoading || pointsLoading;

  // Calculate progress to next tier
  const getNextTierProgress = () => {
    if (!tiersData?.tiers) return { progress: 0, nextTier: null, pointsNeeded: 0 };

    const tiers = tiersData.tiers;
    if (totalPoints < tiers.bronze.min) {
      return { progress: (totalPoints / tiers.bronze.min) * 100, nextTier: 'bronze' as PointsTier, pointsNeeded: tiers.bronze.min - totalPoints };
    }
    if (totalPoints < tiers.silver.min) {
      return { progress: ((totalPoints - tiers.bronze.min) / (tiers.silver.min - tiers.bronze.min)) * 100, nextTier: 'silver' as PointsTier, pointsNeeded: tiers.silver.min - totalPoints };
    }
    if (totalPoints < tiers.gold.min) {
      return { progress: ((totalPoints - tiers.silver.min) / (tiers.gold.min - tiers.silver.min)) * 100, nextTier: 'gold' as PointsTier, pointsNeeded: tiers.gold.min - totalPoints };
    }
    if (totalPoints < tiers.platinum.min) {
      return { progress: ((totalPoints - tiers.gold.min) / (tiers.platinum.min - tiers.gold.min)) * 100, nextTier: 'platinum' as PointsTier, pointsNeeded: tiers.platinum.min - totalPoints };
    }
    return { progress: 100, nextTier: null, pointsNeeded: 0 };
  };

  const tierProgress = getNextTierProgress();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRewardStatusColor = (status: CreatorReward['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-500';
      case 'approved': return 'bg-green-500/20 text-green-500';
      case 'distributed': return 'bg-blue-500/20 text-blue-500';
      case 'rejected': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
        <p className="text-muted-foreground">Track your content performance and rewards</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Points Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Total Points
              </CardDescription>
              <CardTitle className="text-3xl">{totalPoints.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              {currentTier && (
                <Badge className={`${tierColors[currentTier]} font-mono`}>
                  {tierIcons[currentTier]} {currentTier.toUpperCase()}
                </Badge>
              )}
              {!currentTier && totalPoints > 0 && (
                <span className="text-sm text-muted-foreground">Keep creating to earn your first tier!</span>
              )}
            </CardContent>
            {currentTier && (
              <div className={`absolute top-0 right-0 w-20 h-20 ${tierColors[currentTier]} opacity-10 rounded-bl-full`} />
            )}
          </Card>
        </motion.div>

        {/* Views Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Total Views
              </CardDescription>
              <CardTitle className="text-3xl">{performance?.totalViews.toLocaleString() || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-sm text-muted-foreground">{performance?.contentCount || 0} content items</span>
            </CardContent>
          </Card>
        </motion.div>

        {/* Studies Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Total Studies
              </CardDescription>
              <CardTitle className="text-3xl">{performance?.totalStudies.toLocaleString() || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-sm text-muted-foreground">3x points each</span>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completions
              </CardDescription>
              <CardTitle className="text-3xl">{performance?.totalCompletions.toLocaleString() || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-sm text-muted-foreground">5x points each</span>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Progress to Next Tier */}
      {tierProgress.nextTier && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress to {tierProgress.nextTier.charAt(0).toUpperCase() + tierProgress.nextTier.slice(1)} Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={tierProgress.progress} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{totalPoints.toLocaleString()} points</span>
                <span>{tierProgress.pointsNeeded.toLocaleString()} more needed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Details */}
      <Tabs defaultValue="rewards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="history">Points History</TabsTrigger>
          <TabsTrigger value="breakdown">Engagement Breakdown</TabsTrigger>
        </TabsList>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Your Rewards
              </CardTitle>
              <CardDescription>Rewards earned from your content</CardDescription>
            </CardHeader>
            <CardContent>
              {rewards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No rewards yet. Keep creating great content!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${reward.tier ? tierColors[reward.tier as PointsTier] : 'bg-gray-200'}`}>
                          <Star className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{reward.rewardValue || 'Reward'}</p>
                          <p className="text-sm text-muted-foreground">
                            {reward.pointsEarned.toLocaleString()} points - {formatDate(reward.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge className={getRewardStatusColor(reward.status)}>
                        {reward.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Points History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Points History
              </CardTitle>
              <CardDescription>Points earned per epoch</CardDescription>
            </CardHeader>
            <CardContent>
              {points.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No points history yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {points.map((point) => (
                    <div
                      key={point.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div>
                        <p className="font-medium">{point.epochId}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(point.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{point.pointsEarned.toLocaleString()}</p>
                        {point.tier && (
                          <Badge className={tierColors[point.tier as PointsTier]} variant="secondary">
                            {point.tier}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Engagement Breakdown
              </CardTitle>
              <CardDescription>How users interact with your content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Views</span>
                    </div>
                    <p className="text-2xl font-bold">{performance?.totalViews.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">1 point each</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Studies</span>
                    </div>
                    <p className="text-2xl font-bold">{performance?.totalStudies.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">3 points each</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-purple-500" />
                      <span className="text-sm text-muted-foreground">Completions</span>
                    </div>
                    <p className="text-2xl font-bold">{performance?.totalCompletions.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">5 points each</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Bookmark className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">Saves</span>
                    </div>
                    <p className="text-2xl font-bold">{performance?.totalSaves.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">2 points each</p>
                  </div>
                </div>

                <Separator />

                <div className="p-4 rounded-lg border bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-pink-500" />
                      <span className="text-sm text-muted-foreground">Shares</span>
                    </div>
                    <p className="text-2xl font-bold">{performance?.totalShares.toLocaleString() || 0}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">4 points each</p>
                </div>

                <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Points (This Period)</span>
                    <span className="text-2xl font-bold text-primary">{performance?.totalPoints.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
