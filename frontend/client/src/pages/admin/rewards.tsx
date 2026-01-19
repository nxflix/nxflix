import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  usePendingRewards,
  useApproveReward,
  useRejectReward,
  useDistributeReward,
  useAdminStats,
  useEpochs,
  useInitializeEpochs,
  useRolloverEpochs,
  useProcessEpochRewards,
  useAutoSelectFeatured,
  useTodayFeatured,
} from '@/lib/api';
import type { CreatorReward, Epoch, PointsTier } from '@/lib/api-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Star,
  TrendingUp,
  Gift,
  Play,
  Send,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const tierColors: Record<PointsTier, string> = {
  bronze: 'bg-amber-700 text-white',
  silver: 'bg-gray-400 text-white',
  gold: 'bg-yellow-500 text-black',
  platinum: 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white',
};

export default function AdminRewards() {
  const { user } = useAuth();
  const adminId = user?.id || 'admin';
  const { toast } = useToast();
  const [selectedReward, setSelectedReward] = useState<CreatorReward | null>(null);
  const [tokenAmount, setTokenAmount] = useState<string>('');

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useAdminStats();
  const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending } = usePendingRewards();
  const { data: epochsData, isLoading: epochsLoading, refetch: refetchEpochs } = useEpochs();
  const { data: featuredData, refetch: refetchFeatured } = useTodayFeatured();

  const approveReward = useApproveReward();
  const rejectReward = useRejectReward();
  const distributeReward = useDistributeReward();
  const initializeEpochs = useInitializeEpochs();
  const rolloverEpochs = useRolloverEpochs();
  const processEpochRewards = useProcessEpochRewards();
  const autoSelectFeatured = useAutoSelectFeatured();

  const stats = statsData;
  const pendingRewards = pendingData?.rewards || [];
  const epochs = epochsData?.epochs || [];

  const handleApprove = async (reward: CreatorReward) => {
    try {
      await approveReward.mutateAsync({
        rewardId: reward.id,
        reviewedBy: adminId,
        tokenAmount: tokenAmount ? parseFloat(tokenAmount) : undefined,
      });
      toast({
        title: 'Reward Approved',
        description: `Approved reward for creator ${reward.creatorId}`,
      });
      setSelectedReward(null);
      setTokenAmount('');
      refetchPending();
      refetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve reward',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (reward: CreatorReward) => {
    try {
      await rejectReward.mutateAsync({
        rewardId: reward.id,
        reviewedBy: adminId,
      });
      toast({
        title: 'Reward Rejected',
        description: `Rejected reward for creator ${reward.creatorId}`,
      });
      refetchPending();
      refetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject reward',
        variant: 'destructive',
      });
    }
  };

  const handleDistribute = async (rewardId: string) => {
    try {
      await distributeReward.mutateAsync(rewardId);
      toast({
        title: 'Reward Distributed',
        description: 'Reward has been marked as distributed',
      });
      refetchPending();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to distribute reward',
        variant: 'destructive',
      });
    }
  };

  const handleInitializeEpochs = async () => {
    try {
      await initializeEpochs.mutateAsync();
      toast({
        title: 'Epochs Initialized',
        description: 'All epoch types have been initialized',
      });
      refetchEpochs();
      refetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initialize epochs',
        variant: 'destructive',
      });
    }
  };

  const handleRolloverEpochs = async () => {
    try {
      const result = await rolloverEpochs.mutateAsync();
      toast({
        title: 'Epoch Rollover',
        description: `${result.completedEpochs} epochs completed and rolled over`,
      });
      refetchEpochs();
      refetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to rollover epochs',
        variant: 'destructive',
      });
    }
  };

  const handleProcessEpochRewards = async (epochId: string) => {
    try {
      await processEpochRewards.mutateAsync(epochId);
      toast({
        title: 'Rewards Processed',
        description: `Rewards for epoch ${epochId} have been processed`,
      });
      refetchPending();
      refetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process epoch rewards',
        variant: 'destructive',
      });
    }
  };

  const handleAutoSelectFeatured = async () => {
    try {
      await autoSelectFeatured.mutateAsync();
      toast({
        title: 'Featured Selected',
        description: 'Featured content for today has been selected',
      });
      refetchFeatured();
      refetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to select featured content',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-500';
      case 'completed': return 'bg-blue-500/20 text-blue-500';
      case 'processing': return 'bg-yellow-500/20 text-yellow-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin: Rewards Management</h1>
        <p className="text-muted-foreground">Manage creator rewards and epoch processing</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Rewards
            </CardDescription>
            <CardTitle className="text-3xl">{stats?.pendingRewardsCount || 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Daily Epoch
            </CardDescription>
            <CardTitle className="text-sm truncate">{stats?.activeEpochs?.daily || 'Not set'}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Weekly Epoch
            </CardDescription>
            <CardTitle className="text-sm truncate">{stats?.activeEpochs?.weekly || 'Not set'}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Featured Today
            </CardDescription>
            <CardTitle className="text-sm">
              {stats?.hasTodayFeatured ? 'Yes' : 'No'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Rewards</TabsTrigger>
          <TabsTrigger value="epochs">Epochs</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>

        {/* Pending Rewards Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Pending Rewards
                </span>
                <Button variant="outline" size="sm" onClick={() => refetchPending()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>Review and approve creator rewards</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : pendingRewards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending rewards to review</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRewards.map((reward) => (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${reward.tier ? tierColors[reward.tier as PointsTier] : 'bg-gray-200'}`}>
                          <Gift className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{reward.creatorId}</p>
                          <p className="text-sm text-muted-foreground">
                            {reward.pointsEarned.toLocaleString()} points - {reward.rewardType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Epoch: {reward.epochId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {reward.tier && (
                          <Badge className={tierColors[reward.tier as PointsTier]}>
                            {reward.tier}
                          </Badge>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedReward(reward)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Approve Reward</DialogTitle>
                              <DialogDescription>
                                Review and approve this creator reward. Optionally set a JLPT token amount.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <p className="font-medium">Creator: {reward.creatorId}</p>
                                <p className="text-sm text-muted-foreground">Points: {reward.pointsEarned}</p>
                                <p className="text-sm text-muted-foreground">Tier: {reward.tier || 'None'}</p>
                                <p className="text-sm text-muted-foreground">Reward: {reward.rewardValue}</p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="tokenAmount">JLPT Token Amount (optional)</Label>
                                <Input
                                  id="tokenAmount"
                                  type="number"
                                  placeholder="Enter token amount"
                                  value={tokenAmount}
                                  onChange={(e) => setTokenAmount(e.target.value)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setSelectedReward(null)}>
                                Cancel
                              </Button>
                              <Button onClick={() => handleApprove(reward)} disabled={approveReward.isPending}>
                                {approveReward.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Approve
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(reward)}
                          disabled={rejectReward.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Epochs Tab */}
        <TabsContent value="epochs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Epoch Management
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInitializeEpochs}
                    disabled={initializeEpochs.isPending}
                  >
                    {initializeEpochs.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Initialize Epochs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRolloverEpochs}
                    disabled={rolloverEpochs.isPending}
                  >
                    {rolloverEpochs.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rollover
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Manage time-based epochs for reward tracking</CardDescription>
            </CardHeader>
            <CardContent>
              {epochsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : epochs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No epochs found. Click "Initialize Epochs" to create them.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {epochs.slice(0, 20).map((epoch) => (
                    <div
                      key={epoch.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div>
                        <p className="font-medium">{epoch.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {epoch.epochType} - {formatDate(epoch.startDate)} to {formatDate(epoch.endDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(epoch.status)}>
                          {epoch.status}
                        </Badge>
                        {epoch.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessEpochRewards(epoch.id)}
                            disabled={processEpochRewards.isPending}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Process
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Featured Tab */}
        <TabsContent value="featured" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Featured Content
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoSelectFeatured}
                  disabled={autoSelectFeatured.isPending}
                >
                  {autoSelectFeatured.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Auto Select Today's Featured
                </Button>
              </CardTitle>
              <CardDescription>Manage daily featured content selection</CardDescription>
            </CardHeader>
            <CardContent>
              {featuredData?.featured ? (
                <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/20">
                      <Star className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Today's Featured</p>
                      <p className="text-sm text-muted-foreground">
                        {featuredData.featured.contentType}: {featuredData.featured.contentId}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Reason: {featuredData.featured.featureReason || 'Editor\'s Pick'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Impressions: {featuredData.featured.impressions} | Clicks: {featuredData.featured.clicks}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No featured content for today. Click "Auto Select" to choose one.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
