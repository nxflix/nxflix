/**
 * Analytics Service - Tracks content engagement events and aggregates stats.
 *
 * Events are tracked in real-time and aggregated into epoch stats for
 * creator rewards calculation.
 */

import { v4 as uuid } from 'uuid';
import {
  contentEventsRepository,
  contentEpochStatsRepository,
  type EventType,
} from '../db/repositories/index.js';
import { epochService } from './epoch.js';
import type { ContentEvent, NewContentEvent, ContentEpochStat, NewContentEpochStat } from '../db/schema.js';

// Event weights for scoring
export const EVENT_WEIGHTS: Record<EventType, number> = {
  view: 1,
  study: 3,
  complete: 5,
  save: 2,
  share: 4,
};

export interface TrackEventRequest {
  contentId: string;
  contentType: string;
  userId?: string;
  eventType: EventType;
  eventData?: Record<string, unknown>;
}

export interface ContentStats {
  contentId: string;
  contentType: string;
  totalViews: number;
  totalStudies: number;
  totalCompletions: number;
  totalSaves: number;
  totalShares: number;
  uniqueUsers: number;
  weightedScore: number;
}

export interface CreatorPerformance {
  creatorId: string;
  totalViews: number;
  totalStudies: number;
  totalCompletions: number;
  totalSaves: number;
  totalShares: number;
  totalPoints: number;
  contentCount: number;
}

export interface LeaderboardEntry {
  contentId: string;
  contentType: string;
  creatorId?: string;
  score: number;
  viewCount: number;
  studyCount: number;
  completionCount: number;
}

export class AnalyticsService {
  /**
   * Track a content engagement event
   */
  async trackEvent(request: TrackEventRequest): Promise<ContentEvent> {
    const event: NewContentEvent = {
      id: uuid(),
      contentId: request.contentId,
      contentType: request.contentType,
      userId: request.userId,
      eventType: request.eventType,
      eventData: request.eventData || {},
    };

    const savedEvent = await contentEventsRepository.create(event);

    // Update epoch stats in the background (don't wait)
    this.updateEpochStats(request.contentId, request.contentType, request.eventType).catch(
      (err) => console.error('Error updating epoch stats:', err)
    );

    return savedEvent;
  }

  /**
   * Update epoch stats for content when an event is tracked
   */
  private async updateEpochStats(
    contentId: string,
    contentType: string,
    eventType: EventType
  ): Promise<void> {
    // Get current weekly epoch (primary for creator rewards)
    const weeklyEpoch = await epochService.getCurrentEpoch('weekly');

    // Find or create stats for this content in the current epoch
    let stats = await contentEpochStatsRepository.findByEpochIdAndContentId(
      weeklyEpoch.id,
      contentId
    );

    if (!stats) {
      // Create new stats entry
      const newStats: NewContentEpochStat = {
        id: uuid(),
        epochId: weeklyEpoch.id,
        contentId,
        contentType,
        viewCount: 0,
        studyCount: 0,
        completionCount: 0,
        saveCount: 0,
        shareCount: 0,
        uniqueUsers: 0,
      };
      stats = await contentEpochStatsRepository.create(newStats);
    }

    // Increment the appropriate counter
    const increments: Record<string, number> = {};
    switch (eventType) {
      case 'view':
        increments.viewCount = 1;
        break;
      case 'study':
        increments.studyCount = 1;
        break;
      case 'complete':
        increments.completionCount = 1;
        break;
      case 'save':
        increments.saveCount = 1;
        break;
      case 'share':
        increments.shareCount = 1;
        break;
    }

    await contentEpochStatsRepository.incrementCounts(stats.id, increments);

    // Update unique users count
    const uniqueUsers = await contentEventsRepository.countUniqueUsersByContentId(contentId);
    await contentEpochStatsRepository.update(stats.id, { uniqueUsers });
  }

  /**
   * Get stats for a specific content item
   */
  async getContentStats(contentId: string): Promise<ContentStats> {
    const viewCount = await contentEventsRepository.countByContentIdAndEventType(contentId, 'view');
    const studyCount = await contentEventsRepository.countByContentIdAndEventType(contentId, 'study');
    const completionCount = await contentEventsRepository.countByContentIdAndEventType(contentId, 'complete');
    const saveCount = await contentEventsRepository.countByContentIdAndEventType(contentId, 'save');
    const shareCount = await contentEventsRepository.countByContentIdAndEventType(contentId, 'share');
    const uniqueUsers = await contentEventsRepository.countUniqueUsersByContentId(contentId);

    // Get content type from events
    const events = await contentEventsRepository.findByContentId(contentId);
    const contentType = events[0]?.contentType || 'unknown';

    const weightedScore =
      viewCount * EVENT_WEIGHTS.view +
      studyCount * EVENT_WEIGHTS.study +
      completionCount * EVENT_WEIGHTS.complete +
      saveCount * EVENT_WEIGHTS.save +
      shareCount * EVENT_WEIGHTS.share;

    return {
      contentId,
      contentType,
      totalViews: viewCount,
      totalStudies: studyCount,
      totalCompletions: completionCount,
      totalSaves: saveCount,
      totalShares: shareCount,
      uniqueUsers,
      weightedScore,
    };
  }

  /**
   * Get performance stats for a creator
   */
  async getCreatorPerformance(creatorId: string, epochId?: string): Promise<CreatorPerformance> {
    let stats: ContentEpochStat[];

    if (epochId) {
      stats = await contentEpochStatsRepository.findByCreatorIdAndEpochId(creatorId, epochId);
    } else {
      stats = await contentEpochStatsRepository.findByCreatorId(creatorId);
    }

    const totals = stats.reduce(
      (acc, stat) => ({
        views: acc.views + stat.viewCount,
        studies: acc.studies + stat.studyCount,
        completions: acc.completions + stat.completionCount,
        saves: acc.saves + stat.saveCount,
        shares: acc.shares + stat.shareCount,
      }),
      { views: 0, studies: 0, completions: 0, saves: 0, shares: 0 }
    );

    const totalPoints =
      totals.views * EVENT_WEIGHTS.view +
      totals.studies * EVENT_WEIGHTS.study +
      totals.completions * EVENT_WEIGHTS.complete +
      totals.saves * EVENT_WEIGHTS.save +
      totals.shares * EVENT_WEIGHTS.share;

    return {
      creatorId,
      totalViews: totals.views,
      totalStudies: totals.studies,
      totalCompletions: totals.completions,
      totalSaves: totals.saves,
      totalShares: totals.shares,
      totalPoints,
      contentCount: stats.length,
    };
  }

  /**
   * Get leaderboard for an epoch
   */
  async getLeaderboard(
    epochId?: string,
    contentType?: string,
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    let targetEpochId = epochId;

    if (!targetEpochId) {
      const currentEpoch = await epochService.getCurrentEpoch('weekly');
      targetEpochId = currentEpoch.id;
    }

    const topContent = await contentEpochStatsRepository.findTopContentByEpoch(targetEpochId, limit);

    return topContent
      .filter((stat) => !contentType || stat.contentType === contentType)
      .map((stat) => ({
        contentId: stat.contentId,
        contentType: stat.contentType,
        creatorId: stat.creatorId || undefined,
        score:
          stat.viewCount * EVENT_WEIGHTS.view +
          stat.studyCount * EVENT_WEIGHTS.study +
          stat.completionCount * EVENT_WEIGHTS.complete +
          stat.saveCount * EVENT_WEIGHTS.save +
          stat.shareCount * EVENT_WEIGHTS.share,
        viewCount: stat.viewCount,
        studyCount: stat.studyCount,
        completionCount: stat.completionCount,
      }));
  }

  /**
   * Get epoch stats for a specific content item
   */
  async getContentEpochStats(contentId: string, epochId?: string): Promise<ContentEpochStat | null> {
    let targetEpochId = epochId;

    if (!targetEpochId) {
      const currentEpoch = await epochService.getCurrentEpoch('weekly');
      targetEpochId = currentEpoch.id;
    }

    const stats = await contentEpochStatsRepository.findByEpochIdAndContentId(targetEpochId, contentId);
    return stats || null;
  }

  /**
   * Get all stats for an epoch
   */
  async getEpochStats(epochId: string): Promise<ContentEpochStat[]> {
    return contentEpochStatsRepository.findByEpochId(epochId);
  }

  /**
   * Get recent events for a user
   */
  async getUserEvents(userId: string, limit: number = 50): Promise<ContentEvent[]> {
    const events = await contentEventsRepository.findByUserId(userId);
    return events.slice(0, limit);
  }

  /**
   * Get recent events for content
   */
  async getContentEvents(contentId: string, limit: number = 50): Promise<ContentEvent[]> {
    const events = await contentEventsRepository.findByContentId(contentId);
    return events.slice(0, limit);
  }

  /**
   * Aggregate stats for an epoch (called during epoch rollover)
   */
  async aggregateEpochStats(epochId: string): Promise<void> {
    const epoch = await epochService.getEpochById(epochId);
    if (!epoch) {
      throw new Error(`Epoch not found: ${epochId}`);
    }

    // Get all events for this epoch's date range
    const events = await contentEventsRepository.findByDateRange(
      new Date(epoch.startDate),
      new Date(epoch.endDate)
    );

    // Group events by content
    const contentStats = new Map<string, {
      contentType: string;
      views: number;
      studies: number;
      completions: number;
      saves: number;
      shares: number;
      users: Set<string>;
    }>();

    for (const event of events) {
      if (!contentStats.has(event.contentId)) {
        contentStats.set(event.contentId, {
          contentType: event.contentType,
          views: 0,
          studies: 0,
          completions: 0,
          saves: 0,
          shares: 0,
          users: new Set(),
        });
      }

      const stats = contentStats.get(event.contentId)!;
      if (event.userId) {
        stats.users.add(event.userId);
      }

      switch (event.eventType) {
        case 'view':
          stats.views++;
          break;
        case 'study':
          stats.studies++;
          break;
        case 'complete':
          stats.completions++;
          break;
        case 'save':
          stats.saves++;
          break;
        case 'share':
          stats.shares++;
          break;
      }
    }

    // Save aggregated stats
    for (const [contentId, stats] of contentStats) {
      const epochStat: NewContentEpochStat = {
        id: uuid(),
        epochId,
        contentId,
        contentType: stats.contentType,
        viewCount: stats.views,
        studyCount: stats.studies,
        completionCount: stats.completions,
        saveCount: stats.saves,
        shareCount: stats.shares,
        uniqueUsers: stats.users.size,
      };

      await contentEpochStatsRepository.upsert(epochStat);
    }

    console.log(`Aggregated stats for epoch ${epochId}: ${contentStats.size} content items`);
  }
}

export const analyticsService = new AnalyticsService();
