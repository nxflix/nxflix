import { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useUserPods, usePodCheckIns } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckInSheet } from '@/components/pods/check-in-sheet';
import {
  Flame,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  Circle,
  Lightbulb,
  ArrowRight,
  Plus,
  LogIn,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getDaysUntil(targetDate: string) {
  const target = new Date(targetDate);
  const today = new Date();
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export default function PodDashboard() {
  const { isAuthenticated, userId, userDisplayName, login, isLoading: authLoading } = useAuth();
  const [checkInOpen, setCheckInOpen] = useState(false);

  const { data: userPods, isLoading: podsLoading } = useUserPods(userId || '');

  // Get the first pod (primary pod for now)
  const primaryMembership = userPods?.[0];
  const pod = primaryMembership?.pod;
  const membership = primaryMembership?.membership;

  // Get today's check-ins for the pod
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: todayCheckIns } = usePodCheckIns(pod?.id || '', todayStr);

  // Check if user has checked in today
  const userCheckedIn = todayCheckIns?.some((c) => c.userId === userId);
  const checkedInCount = todayCheckIns?.filter((c) => c.userId)?.length || 0;

  // Loading state
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
          <h2 className="text-2xl font-serif font-bold mb-2">Join a Study Pod</h2>
          <p className="text-muted-foreground mb-6">
            Sign in to join a study pod and track your JLPT progress with others.
          </p>
          <Button onClick={login} size="lg" className="w-full gap-2">
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  // No pods yet
  if (!podsLoading && (!userPods || userPods.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <Card className="p-8">
          <Users className="w-12 h-12 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-serif font-bold mb-2">No Pod Yet</h2>
          <p className="text-muted-foreground mb-6">
            Join a study pod to stay accountable and study together.
          </p>
          <div className="space-y-3">
            <Link href="/pods/onboarding">
              <Button size="lg" className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Find a Pod
              </Button>
            </Link>
            <Link href="/pods/browse">
              <Button variant="outline" size="lg" className="w-full">
                Browse All Pods
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Loading pods
  if (podsLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const daysToExam = pod?.targetExam ? getDaysUntil(pod.targetExam) : null;
  const userName = userDisplayName?.split(' ')[0] || 'there';

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-serif font-bold">
              {getGreeting()}, {userName}
            </h1>
          </div>
        </div>

        {/* Status Card */}
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-bold">{membership?.currentStreak || 0} day streak</span>
            </div>
            {daysToExam !== null && (
              <span className="text-muted-foreground">
                {daysToExam} days to exam
              </span>
            )}
          </div>

          {userCheckedIn ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="font-medium text-green-600 dark:text-green-400">
                You've checked in today!
              </p>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-muted-foreground mb-3">
                You haven't checked in today
              </p>
              <Button onClick={() => setCheckInOpen(true)} size="lg" className="gap-2">
                Log Today's Study
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* Pod Activity Card */}
        {pod && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">{pod.name}</h2>
              <Link href={`/pods/${pod.id}`}>
                <Button variant="ghost" size="sm">
                  View Pod
                </Button>
              </Link>
            </div>

            <div className="space-y-1 mb-4">
              <p className="text-sm font-medium text-muted-foreground">Today's Activity</p>
            </div>

            <div className="space-y-3">
              {todayCheckIns && todayCheckIns.length > 0 ? (
                todayCheckIns.slice(0, 5).map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>
                        {checkIn.userId === userId ? 'You' : checkIn.username || 'Member'}
                      </span>
                      <span className="text-muted-foreground">
                        logged {checkIn.studyMinutes} min
                        {checkIn.studyTags?.length > 0 && ` (${checkIn.studyTags.join(', ')})`}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(checkIn.createdAt || '')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No check-ins yet today</p>
              )}

              {/* Show pending members */}
              {pod.memberCount > checkedInCount && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Circle className="w-4 h-4" />
                    <span>
                      {pod.memberCount - checkedInCount} member
                      {pod.memberCount - checkedInCount !== 1 ? 's' : ''} haven't checked in yet
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {checkedInCount}/{pod.memberCount} checked in today
              </p>
            </div>
          </Card>
        )}

        {/* AI Insight Card (placeholder) */}
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">AI Insight</h3>
              <p className="text-sm text-muted-foreground">
                Your best study days are Mon/Tue. You're 40% less consistent on Wednesdays.
                Consider shorter sessions on busy days.
              </p>
              <Button variant="link" size="sm" className="px-0 mt-2">
                See More
              </Button>
            </div>
          </div>
        </Card>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t py-2 px-4">
          <div className="max-w-2xl mx-auto flex justify-around">
            <Link href="/pods">
              <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2">
                <Users className="w-5 h-5" />
                <span className="text-xs">Home</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="flex-col gap-1 h-auto py-2"
              onClick={() => setCheckInOpen(true)}
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs">Check-In</span>
            </Button>
            <Link href={pod ? `/pods/${pod.id}` : '/pods'}>
              <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2">
                <Clock className="w-5 h-5" />
                <span className="text-xs">Pod</span>
              </Button>
            </Link>
          </div>
        </nav>
      </div>

      {/* Check-in Sheet */}
      {pod && membership && (
        <CheckInSheet
          open={checkInOpen}
          onOpenChange={setCheckInOpen}
          podId={pod.id}
          userId={userId || ''}
          currentStreak={membership.currentStreak}
        />
      )}
    </div>
  );
}
