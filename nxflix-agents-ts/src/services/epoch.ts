/**
 * Epoch Service - Manages time-based periods for tracking and reward distribution.
 *
 * Epochs are fixed time periods used to:
 * - Calculate creator rewards based on content performance
 * - Reset leaderboards and create fresh competition
 * - Aggregate analytics for trends
 * - Distribute rewards at epoch end
 */

import {
  epochsRepository,
  type EpochType,
  type EpochStatus,
} from '../db/repositories/index.js';
import type { Epoch, NewEpoch } from '../db/schema.js';

export interface EpochConfig {
  type: EpochType;
  startDate: Date;
  endDate: Date;
}

export class EpochService {
  /**
   * Get or create the current epoch for a given type
   */
  async getCurrentEpoch(epochType: EpochType): Promise<Epoch> {
    const now = new Date();

    // Check if there's already an active epoch for this type
    const existing = await epochsRepository.findCurrentEpoch(epochType, now);
    if (existing) {
      return existing;
    }

    // Create a new epoch
    const config = this.calculateEpochDates(epochType, now);
    return this.createEpoch(config);
  }

  /**
   * Calculate epoch start and end dates based on type
   */
  calculateEpochDates(epochType: EpochType, referenceDate: Date = new Date()): EpochConfig {
    const startDate = new Date(referenceDate);
    const endDate = new Date(referenceDate);

    switch (epochType) {
      case 'daily':
        // Start at midnight, end at 23:59:59.999
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'weekly':
        // Start on Monday at midnight, end on Sunday at 23:59:59.999
        const dayOfWeek = startDate.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate.setDate(startDate.getDate() + daysUntilMonday);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'monthly':
        // Start on the 1st at midnight, end on the last day at 23:59:59.999
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of current month
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return { type: epochType, startDate, endDate };
  }

  /**
   * Create a new epoch
   */
  async createEpoch(config: EpochConfig): Promise<Epoch> {
    const id = `epoch-${config.type}-${this.formatDateId(config.startDate)}`;

    const newEpoch: NewEpoch = {
      id,
      epochType: config.type,
      startDate: config.startDate,
      endDate: config.endDate,
      status: 'active',
    };

    return epochsRepository.create(newEpoch);
  }

  /**
   * Format date as ID-friendly string (YYYY-MM-DD)
   */
  private formatDateId(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Check and rollover expired epochs
   * Returns list of epochs that were completed
   */
  async checkAndRolloverEpochs(): Promise<Epoch[]> {
    const now = new Date();
    const completedEpochs: Epoch[] = [];

    // Get all active epochs
    const activeEpochs = await epochsRepository.findByStatus('active');

    for (const epoch of activeEpochs) {
      if (new Date(epoch.endDate) < now) {
        // Epoch has ended, mark as processing
        await epochsRepository.updateStatus(epoch.id, 'processing');

        // Process the epoch (aggregate stats, calculate rewards)
        await this.processCompletedEpoch(epoch);

        // Mark as completed
        await epochsRepository.updateStatus(epoch.id, 'completed');
        completedEpochs.push(epoch);

        // Create the next epoch
        await this.getCurrentEpoch(epoch.epochType as EpochType);
      }
    }

    return completedEpochs;
  }

  /**
   * Process a completed epoch
   * This should aggregate stats and calculate creator rewards
   */
  async processCompletedEpoch(epoch: Epoch): Promise<void> {
    // This will be implemented in the rewards service
    // The epoch service just manages the epoch lifecycle
    console.log(`Processing completed epoch: ${epoch.id}`);
  }

  /**
   * Get epoch by ID
   */
  async getEpochById(id: string): Promise<Epoch | undefined> {
    return epochsRepository.findById(id);
  }

  /**
   * Get all epochs of a specific type
   */
  async getEpochsByType(epochType: EpochType): Promise<Epoch[]> {
    return epochsRepository.findByType(epochType);
  }

  /**
   * Get all epochs with a specific status
   */
  async getEpochsByStatus(status: EpochStatus): Promise<Epoch[]> {
    return epochsRepository.findByStatus(status);
  }

  /**
   * Get all epochs (recent first)
   */
  async getAllEpochs(): Promise<Epoch[]> {
    return epochsRepository.findAll();
  }

  /**
   * Check if a date falls within an epoch
   */
  isDateInEpoch(date: Date, epoch: Epoch): boolean {
    const d = date.getTime();
    const start = new Date(epoch.startDate).getTime();
    const end = new Date(epoch.endDate).getTime();
    return d >= start && d <= end;
  }

  /**
   * Get the active epoch for each type
   */
  async getActiveEpochs(): Promise<Record<EpochType, Epoch | null>> {
    const types: EpochType[] = ['daily', 'weekly', 'monthly'];
    const result: Record<EpochType, Epoch | null> = {
      daily: null,
      weekly: null,
      monthly: null,
    };

    for (const type of types) {
      result[type] = await epochsRepository.findActiveByType(type) || null;
    }

    return result;
  }

  /**
   * Initialize all epoch types (create if they don't exist)
   */
  async initializeEpochs(): Promise<void> {
    const types: EpochType[] = ['daily', 'weekly', 'monthly'];

    for (const type of types) {
      await this.getCurrentEpoch(type);
    }

    console.log('All epoch types initialized');
  }
}

export const epochService = new EpochService();
