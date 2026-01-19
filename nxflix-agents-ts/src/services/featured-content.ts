/**
 * Featured Content Service - Selects and manages daily featured content.
 *
 * Selection Algorithm (Weighted):
 * - Quality Score: 40% (engagement rate + completion rate)
 * - Engagement: 30% (recent studies/views)
 * - Freshness: 20% (newer content prioritized)
 * - Creator Diversity: 10% (rotate different creators)
 */

import { v4 as uuid } from 'uuid';
import {
  featuredContentRepository,
  contentEpochStatsRepository,
} from '../db/repositories/index.js';
import { epochService } from './epoch.js';
import type { FeaturedContent, NewFeaturedContent, ContentEpochStat } from '../db/schema.js';

// Selection weights
const SELECTION_WEIGHTS = {
  quality: 0.4,
  engagement: 0.3,
  freshness: 0.2,
  creatorDiversity: 0.1,
};

// Feature reasons
export const FEATURE_REASONS = [
  'Trending',
  'New Creator Spotlight',
  'High Engagement',
  'Most Studied',
  'Community Favorite',
  'Top Rated',
  'Rising Star',
];

export interface ContentCandidate {
  contentId: string;
  contentType: string;
  creatorId?: string;
  score: number;
  qualityScore: number;
  engagementScore: number;
  freshnessScore: number;
  diversityScore: number;
}

export class FeaturedContentService {
  /**
   * Get today's featured content
   */
  async getTodayFeatured(): Promise<FeaturedContent | null> {
    const featured = await featuredContentRepository.findToday();
    return featured || null;
  }

  /**
   * Get featured content for a specific date
   */
  async getFeaturedByDate(date: Date): Promise<FeaturedContent | null> {
    const featured = await featuredContentRepository.findByDate(date);
    return featured || null;
  }

  /**
   * Get recent featured content
   */
  async getRecentFeatured(days: number = 7): Promise<FeaturedContent[]> {
    return featuredContentRepository.findRecent(days);
  }

  /**
   * Select and set featured content for today
   */
  async selectTodayFeatured(): Promise<FeaturedContent> {
    // Check if already selected
    const existing = await this.getTodayFeatured();
    if (existing) {
      return existing;
    }

    // Get candidates
    const candidates = await this.getCandidates();

    if (candidates.length === 0) {
      throw new Error('No eligible content found for featuring');
    }

    // Select the best candidate
    const selected = candidates[0];

    // Determine feature reason based on scores
    const reason = this.determineFeatureReason(selected);

    // Create featured content record
    const featured: NewFeaturedContent = {
      id: uuid(),
      contentId: selected.contentId,
      contentType: selected.contentType,
      creatorId: selected.creatorId,
      featureDate: new Date(),
      featureReason: reason,
      impressions: 0,
      clicks: 0,
    };

    return featuredContentRepository.create(featured);
  }

  /**
   * Get candidates for featuring with scores
   */
  async getCandidates(limit: number = 50): Promise<ContentCandidate[]> {
    // Get current weekly epoch
    const epoch = await epochService.getCurrentEpoch('weekly');

    // Get top performing content from current epoch
    const stats = await contentEpochStatsRepository.findTopContentByEpoch(epoch.id, limit);

    if (stats.length === 0) {
      return [];
    }

    // Get recently featured creators to avoid
    const recentFeatured = await featuredContentRepository.findRecent(7);
    const recentCreators = new Set(recentFeatured.map((f) => f.creatorId).filter(Boolean));

    // Calculate scores for each candidate
    const candidates: ContentCandidate[] = [];

    const maxViews = Math.max(...stats.map((s) => s.viewCount));
    const maxStudies = Math.max(...stats.map((s) => s.studyCount));

    for (const stat of stats) {
      // Skip content that was recently featured
      const wasRecentlyFeatured = recentFeatured.some(
        (f) => f.contentId === stat.contentId
      );
      if (wasRecentlyFeatured) continue;

      // Calculate component scores (0-1 scale)
      const qualityScore = this.calculateQualityScore(stat);
      const engagementScore = this.calculateEngagementScore(stat, maxViews, maxStudies);
      const freshnessScore = this.calculateFreshnessScore(stat);
      const diversityScore = this.calculateDiversityScore(stat.creatorId, recentCreators);

      // Calculate weighted total score
      const score =
        qualityScore * SELECTION_WEIGHTS.quality +
        engagementScore * SELECTION_WEIGHTS.engagement +
        freshnessScore * SELECTION_WEIGHTS.freshness +
        diversityScore * SELECTION_WEIGHTS.creatorDiversity;

      candidates.push({
        contentId: stat.contentId,
        contentType: stat.contentType,
        creatorId: stat.creatorId || undefined,
        score,
        qualityScore,
        engagementScore,
        freshnessScore,
        diversityScore,
      });
    }

    // Sort by total score descending
    candidates.sort((a, b) => b.score - a.score);

    return candidates;
  }

  /**
   * Calculate quality score based on completion rate and engagement depth
   */
  private calculateQualityScore(stat: ContentEpochStat): number {
    if (stat.viewCount === 0) return 0;

    // Completion rate (how many who viewed also completed)
    const completionRate = stat.completionCount / stat.viewCount;

    // Study depth (how many who viewed also studied)
    const studyRate = stat.studyCount / stat.viewCount;

    // Save rate (indicates quality worth saving)
    const saveRate = stat.saveCount / stat.viewCount;

    // Weighted combination
    return completionRate * 0.5 + studyRate * 0.3 + saveRate * 0.2;
  }

  /**
   * Calculate engagement score based on raw numbers
   */
  private calculateEngagementScore(
    stat: ContentEpochStat,
    maxViews: number,
    maxStudies: number
  ): number {
    if (maxViews === 0 || maxStudies === 0) return 0;

    // Normalize views and studies
    const normalizedViews = stat.viewCount / maxViews;
    const normalizedStudies = stat.studyCount / maxStudies;

    // Studies matter more than views
    return normalizedViews * 0.4 + normalizedStudies * 0.6;
  }

  /**
   * Calculate freshness score based on creation date
   */
  private calculateFreshnessScore(stat: ContentEpochStat): number {
    const createdAt = new Date(stat.createdAt);
    const now = new Date();
    const daysSinceCreation =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    // Newer content gets higher scores, decaying over 30 days
    if (daysSinceCreation <= 1) return 1.0;
    if (daysSinceCreation <= 7) return 0.8;
    if (daysSinceCreation <= 14) return 0.6;
    if (daysSinceCreation <= 30) return 0.4;
    return 0.2;
  }

  /**
   * Calculate diversity score (prefer creators not recently featured)
   */
  private calculateDiversityScore(
    creatorId: string | null,
    recentCreators: Set<string>
  ): number {
    if (!creatorId) return 0.5; // Neutral for content without creator

    // If creator was recently featured, lower score
    if (recentCreators.has(creatorId)) return 0;

    return 1.0;
  }

  /**
   * Determine the feature reason based on candidate scores
   */
  private determineFeatureReason(candidate: ContentCandidate): string {
    const { qualityScore, engagementScore, freshnessScore, diversityScore } = candidate;

    // Find the highest scoring attribute
    const scores = [
      { score: qualityScore, reason: 'Community Favorite' },
      { score: engagementScore, reason: 'Most Studied' },
      { score: freshnessScore, reason: 'Rising Star' },
      { score: diversityScore, reason: 'New Creator Spotlight' },
    ];

    const maxScore = Math.max(...scores.map((s) => s.score));
    const topReasons = scores.filter((s) => s.score === maxScore);

    // If engagement is high overall, use "Trending"
    if (engagementScore > 0.7) return 'Trending';

    // Otherwise use the top reason
    return topReasons[0].reason;
  }

  /**
   * Record an impression (content was shown to user)
   */
  async recordImpression(featuredId: string): Promise<void> {
    await featuredContentRepository.incrementImpressions(featuredId);
  }

  /**
   * Record a click (user clicked on featured content)
   */
  async recordClick(featuredId: string): Promise<void> {
    await featuredContentRepository.incrementClicks(featuredId);
  }

  /**
   * Get featured content stats
   */
  async getFeaturedStats(
    featuredId: string
  ): Promise<{ impressions: number; clicks: number; ctr: number } | null> {
    const featured = await featuredContentRepository.findById(featuredId);
    if (!featured) return null;

    const ctr = featured.impressions > 0 ? featured.clicks / featured.impressions : 0;

    return {
      impressions: featured.impressions,
      clicks: featured.clicks,
      ctr: Math.round(ctr * 10000) / 100, // Percentage with 2 decimal places
    };
  }

  /**
   * Manually set featured content (admin override)
   */
  async setFeaturedContent(
    contentId: string,
    contentType: string,
    creatorId?: string,
    reason?: string
  ): Promise<FeaturedContent> {
    // Remove existing featured for today if any
    const existing = await this.getTodayFeatured();
    if (existing) {
      await featuredContentRepository.delete(existing.id);
    }

    const featured: NewFeaturedContent = {
      id: uuid(),
      contentId,
      contentType,
      creatorId,
      featureDate: new Date(),
      featureReason: reason || 'Editor\'s Pick',
      impressions: 0,
      clicks: 0,
    };

    return featuredContentRepository.create(featured);
  }

  /**
   * Get creator's featured history
   */
  async getCreatorFeaturedHistory(creatorId: string): Promise<FeaturedContent[]> {
    return featuredContentRepository.findByCreatorId(creatorId);
  }

  /**
   * Get content's featured history
   */
  async getContentFeaturedHistory(contentId: string): Promise<FeaturedContent[]> {
    return featuredContentRepository.findByContentId(contentId);
  }
}

export const featuredContentService = new FeaturedContentService();
