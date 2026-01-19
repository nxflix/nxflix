import { useState } from 'react';
import { Link } from 'wouter';
import { useUserStats, useDueItems, useStudyRecommendations } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { ContentType } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Languages,
  FileText,
  Headphones,
  PenTool,
  Trophy,
  Clock,
  Target,
  Sparkles,
  ArrowRight,
  Loader2,
  LogIn,
} from 'lucide-react';

const contentTypeInfo: Record<ContentType, { icon: typeof BookOpen; label: string; color: string; path: string }> = {
  grammar: { icon: BookOpen, label: 'Grammar', color: 'text-blue-500', path: '/study/grammar' },
  vocabulary: { icon: Languages, label: 'Vocabulary', color: 'text-green-500', path: '/study/vocabulary' },
  kanji: { icon: PenTool, label: 'Kanji', color: 'text-purple-500', path: '/study/kanji' },
  reading: { icon: FileText, label: 'Reading', color: 'text-orange-500', path: '/study/reading' },
  listening: { icon: Headphones, label: 'Listening', color: 'text-pink-500', path: '/study/listening' },
};

export default function StudyDashboard() {
  const [selectedContentType, setSelectedContentType] = useState<ContentType | undefined>(undefined);
  const { isAuthenticated, userId, login, isLoading: authLoading } = useAuth();

  // Use authenticated user ID or fallback to demo-user
  const effectiveUserId = userId || 'demo-user';

  const { data: stats, isLoading: statsLoading } = useUserStats(effectiveUserId, selectedContentType);
  const { data: dueItems, isLoading: dueLoading } = useDueItems(effectiveUserId, selectedContentType, 10);
  const getRecommendations = useStudyRecommendations(effectiveUserId);

  // Show login prompt if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <Card className="p-8">
          <LogIn className="w-12 h-12 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-serif font-bold mb-2">Sign In to Study</h2>
          <p className="text-muted-foreground mb-6">
            Track your progress and get personalized recommendations by signing in.
          </p>
          <Button onClick={login} size="lg" className="w-full">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  const handleGetRecommendations = () => {
    getRecommendations.mutate({ focusAreas: selectedContentType ? [selectedContentType] : undefined });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold">Study Dashboard</h1>
            <p className="text-muted-foreground">Track your JLPT N1 progress</p>
          </div>
          <Link href="/create">
            <Button className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Content
            </Button>
          </Link>
        </div>

        {/* Content Type Tabs */}
        <Tabs
          defaultValue="all"
          onValueChange={(value) => setSelectedContentType(value === 'all' ? undefined : (value as ContentType))}
        >
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            {Object.entries(contentTypeInfo).map(([type, info]) => (
              <TabsTrigger key={type} value={type} className="gap-1">
                <info.icon className={`w-4 h-4 ${info.color}`} />
                <span className="hidden sm:inline">{info.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Stats Overview */}
          <TabsContent value={selectedContentType || 'all'} className="mt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span className="text-sm">Total Items</span>
                </div>
                <p className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.totalItems ?? 0}
                </p>
              </Card>

              <Card className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm">Studied</span>
                </div>
                <p className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.studiedCount ?? 0}
                </p>
              </Card>

              <Card className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm">Mastered</span>
                </div>
                <p className="text-2xl font-bold text-green-500">
                  {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.masteredCount ?? 0}
                </p>
              </Card>

              <Card className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Study Time</span>
                </div>
                <p className="text-2xl font-bold">
                  {statsLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `${stats?.totalStudyTimeMinutes ?? 0}m`
                  )}
                </p>
              </Card>
            </div>

            {/* Mastery Progress */}
            <Card className="mt-6 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Overall Mastery</h3>
                <span className="text-sm text-muted-foreground">
                  {statsLoading ? '...' : `${((stats?.averageMastery ?? 0) * 20).toFixed(0)}%`}
                </span>
              </div>
              <Progress value={(stats?.averageMastery ?? 0) * 20} className="h-2" />
            </Card>
          </TabsContent>
        </Tabs>

        {/* Content Type Quick Access */}
        <div className="grid gap-4 md:grid-cols-5">
          {Object.entries(contentTypeInfo).map(([type, info]) => {
            const count = stats?.byContentType?.[type] ?? 0;
            return (
              <Link key={type} href={info.path}>
                <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer group">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={`p-3 rounded-full bg-muted ${info.color}`}>
                      <info.icon className="w-6 h-6" />
                    </div>
                    <h4 className="font-semibold">{info.label}</h4>
                    <p className="text-sm text-muted-foreground">{count} items</p>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Due Items Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Due for Review
              </h3>
              <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                {dueLoading ? '...' : dueItems?.dueCount ?? 0} items
              </span>
            </div>

            {dueLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : dueItems?.items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No items due for review!</p>
                <p className="text-sm">Great job staying on top of your studies.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dueItems?.items.slice(0, 5).map((item) => {
                  const typeInfo = contentTypeInfo[item.contentType];
                  return (
                    <div
                      key={`${item.contentType}-${item.itemId}`}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <typeInfo.icon className={`w-4 h-4 ${typeInfo.color}`} />
                        <span className="text-sm font-medium">{item.itemId}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Level {item.masteryLevel}/5
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {(dueItems?.dueCount ?? 0) > 0 && (
              <Button className="w-full mt-4" variant="outline">
                Start Review Session
              </Button>
            )}
          </Card>

          {/* AI Recommendations */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AI Recommendations
              </h3>
            </div>

            {getRecommendations.data?.recommendations ? (
              <div className="space-y-2">
                {getRecommendations.data.recommendations.slice(0, 5).map((rec, idx) => {
                  const typeInfo = contentTypeInfo[rec.contentType];
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-2 rounded bg-muted/50"
                    >
                      <typeInfo.icon className={`w-4 h-4 mt-0.5 ${typeInfo.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{rec.itemId}</p>
                        <p className="text-xs text-muted-foreground">{rec.reason}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Get personalized study recommendations</p>
                <p className="text-sm">based on your progress and weaknesses.</p>
              </div>
            )}

            <Button
              className="w-full mt-4"
              onClick={handleGetRecommendations}
              disabled={getRecommendations.isPending}
            >
              {getRecommendations.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Get Recommendations'
              )}
            </Button>
          </Card>
        </div>

        {/* Streak Display */}
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Study Streak</h3>
                <p className="text-sm text-muted-foreground">Keep up the momentum!</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-primary">{stats?.currentStreak ?? 0}</p>
              <p className="text-sm text-muted-foreground">
                Best: {stats?.longestStreak ?? 0} days
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
