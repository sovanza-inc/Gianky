/**
 * LocalStorage Service for User Activity Tracking
 * Tracks game plays, rewards, and generates real-time stats
 */

export interface GameActivity {
  id: string;
  timestamp: number;
  reward: string;
  rewardType: 'NFT' | 'Polygon' | 'Gianky';
  rewardValue: number;
  cardId: number;
  success: boolean;
}

export interface UserStats {
  totalGames: number;
  totalRewards: number;
  totalNFTs: number;
  totalPolygon: number;
  totalGianky: number;
  recentRewards: string[];
  weeklyActivity: WeeklyActivity[];
  rewardDistribution: RewardDistribution;
}

export interface WeeklyActivity {
  day: string;
  games: number;
  rewards: number;
  value: number;
}

export interface RewardDistribution {
  NFTs: number;
  Polygon: number;
  'Gianky Coins': number;
}

class LocalStorageService {
  private readonly STORAGE_KEY = 'gianky_user_activity';
  private readonly STATS_KEY = 'gianky_user_stats';

  /**
   * Record a new game activity
   */
  recordGameActivity(activity: Omit<GameActivity, 'id' | 'timestamp'>): void {
    try {
      const activities = this.getGameActivities();
      const newActivity: GameActivity = {
        ...activity,
        id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      
      activities.push(newActivity);
      this.saveGameActivities(activities);
      this.updateUserStats();
    } catch (error) {
      console.error('Error recording game activity:', error);
    }
  }

  /**
   * Get all game activities
   */
  getGameActivities(): GameActivity[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting game activities:', error);
      return [];
    }
  }

  /**
   * Save game activities to localStorage
   */
  private saveGameActivities(activities: GameActivity[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(activities));
    } catch (error) {
      console.error('Error saving game activities:', error);
    }
  }

  /**
   * Get user stats based on activity
   */
  getUserStats(): UserStats {
    try {
      const stored = localStorage.getItem(this.STATS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Generate stats from activities
      return this.generateStatsFromActivities();
    } catch (error) {
      console.error('Error getting user stats:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Update user stats based on current activities
   */
  private updateUserStats(): void {
    try {
      const stats = this.generateStatsFromActivities();
      localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  /**
   * Generate stats from game activities
   */
  private generateStatsFromActivities(): UserStats {
    const activities = this.getGameActivities();
    const successfulActivities = activities.filter(a => a.success);
    
    // Calculate totals
    const totalGames = activities.length;
    const totalRewards = successfulActivities.length;
    const totalNFTs = successfulActivities.filter(a => a.rewardType === 'NFT').length;
    const totalPolygon = successfulActivities
      .filter(a => a.rewardType === 'Polygon')
      .reduce((sum, a) => sum + a.rewardValue, 0);
    const totalGianky = successfulActivities
      .filter(a => a.rewardType === 'Gianky')
      .reduce((sum, a) => sum + a.rewardValue, 0);

    // Get recent rewards (last 10)
    const recentRewards = successfulActivities
      .slice(-10)
      .map(a => a.reward)
      .reverse();

    // Generate weekly activity
    const weeklyActivity = this.generateWeeklyActivity(activities);

    // Calculate reward distribution
    const rewardDistribution = this.calculateRewardDistribution(successfulActivities);

    return {
      totalGames,
      totalRewards,
      totalNFTs,
      totalPolygon,
      totalGianky,
      recentRewards,
      weeklyActivity,
      rewardDistribution,
    };
  }

  /**
   * Generate weekly activity data
   */
  private generateWeeklyActivity(activities: GameActivity[]): WeeklyActivity[] {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const weekStart = new Date(now.getTime() - (now.getDay() - 1) * 24 * 60 * 60 * 1000);
    
    return days.map((day, index) => {
      const dayStart = new Date(weekStart.getTime() + index * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayActivities = activities.filter(a => {
        const activityDate = new Date(a.timestamp);
        return activityDate >= dayStart && activityDate < dayEnd;
      });

      const successfulActivities = dayActivities.filter(a => a.success);
      
      return {
        day,
        games: dayActivities.length,
        rewards: successfulActivities.length,
        value: successfulActivities.reduce((sum, a) => sum + a.rewardValue, 0),
      };
    });
  }

  /**
   * Calculate reward distribution percentages
   */
  private calculateRewardDistribution(activities: GameActivity[]): RewardDistribution {
    const total = activities.length;
    if (total === 0) {
      return { NFTs: 0, Polygon: 0, 'Gianky Coins': 0 };
    }

    const nfts = activities.filter(a => a.rewardType === 'NFT').length;
    const polygon = activities.filter(a => a.rewardType === 'Polygon').length;
    const gianky = activities.filter(a => a.rewardType === 'Gianky').length;

    return {
      NFTs: Math.round((nfts / total) * 100),
      Polygon: Math.round((polygon / total) * 100),
      'Gianky Coins': Math.round((gianky / total) * 100),
    };
  }

  /**
   * Get default stats for new users
   */
  private getDefaultStats(): UserStats {
    return {
      totalGames: 0,
      totalRewards: 0,
      totalNFTs: 0,
      totalPolygon: 0,
      totalGianky: 0,
      recentRewards: [],
      weeklyActivity: [
        { day: 'Mon', games: 0, rewards: 0, value: 0 },
        { day: 'Tue', games: 0, rewards: 0, value: 0 },
        { day: 'Wed', games: 0, rewards: 0, value: 0 },
        { day: 'Thu', games: 0, rewards: 0, value: 0 },
        { day: 'Fri', games: 0, rewards: 0, value: 0 },
        { day: 'Sat', games: 0, rewards: 0, value: 0 },
        { day: 'Sun', games: 0, rewards: 0, value: 0 },
      ],
      rewardDistribution: { NFTs: 0, Polygon: 0, 'Gianky Coins': 0 },
    };
  }

  /**
   * Clear all user data
   */
  clearUserData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.STATS_KEY);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  /**
   * Get activities for a specific wallet address
   */
  getActivitiesForWallet(walletAddress: string): GameActivity[] {
    const activities = this.getGameActivities();
    // For now, return all activities since we're using localStorage
    // In a real app, you'd filter by wallet address
    return activities;
  }
}

export const localStorageService = new LocalStorageService();
