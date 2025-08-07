/**
 * API service for communicating with Gianky Backend
 * Handles gasless transactions and reward claims
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export interface TokenBalance {
  success: boolean;
  balance?: number;
  balance_human?: number;
  decimals?: number;
  symbol?: string;
  error?: string;
}

export interface GameEligibility {
  success: boolean;
  can_play?: boolean;
  current_balance?: number;
  required_fee?: number;
  shortfall?: number;
  error?: string;
}

export interface PaymentResult {
  success: boolean;
  tx_hash?: string;
  amount_paid?: number;
  new_balance?: number;
  error?: string;
}

export interface TokenInfo {
  success: boolean;
  contract_address?: string;
  symbol?: string;
  decimals?: number;
  game_fee?: number;
  error?: string;
}

export interface GasEstimate {
  success: boolean;
  gas_estimate?: number;
  gas_price?: number;
  estimated_cost_wei?: number;
  estimated_cost_eth?: number;
  error?: string;
}

export interface UserStats {
  success: boolean;
  total_rewards?: number;
  claimed_rewards?: number;
  total_transactions?: number;
  total_nfts?: number;
  total_games?: number;
  recent_rewards?: any[];
  recent_transactions?: any[];
  error?: string;
}

export interface RewardDistribution {
  success: boolean;
  distribution?: Record<string, number>;
  error?: string;
}

export interface GameHistory {
  day: string;
  games: number;
  rewards: number;
  value: number;
}

export interface WeeklyProgress {
  week: string;
  games: number;
  rewards: number;
}

export interface ValueTrend {
  day: string;
  value: number;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Token Operations
  async getTokenBalance(walletAddress: string): Promise<TokenBalance> {
    return this.request<TokenBalance>(`/api/token/balance?wallet_address=${walletAddress}`);
  }

  async checkGameEligibility(walletAddress: string): Promise<GameEligibility> {
    return this.request<GameEligibility>(`/api/token/check-eligibility?wallet_address=${walletAddress}`);
  }

  async payGameFee(walletAddress: string, privateKey: string): Promise<PaymentResult> {
    return this.request<PaymentResult>('/api/token/pay-game-fee', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: walletAddress,
        private_key: privateKey,
      }),
    });
  }

  async getTokenInfo(): Promise<TokenInfo> {
    return this.request<TokenInfo>('/api/token/info');
  }

  async estimatePaymentGas(walletAddress: string): Promise<GasEstimate> {
    return this.request<GasEstimate>(`/api/token/estimate-gas?wallet_address=${walletAddress}`);
  }

  // User Statistics
  async getUserStats(walletAddress: string): Promise<UserStats> {
    return this.request<UserStats>(`/api/user/stats?wallet_address=${walletAddress}`);
  }

  async getRewardDistribution(walletAddress: string): Promise<RewardDistribution> {
    return this.request<RewardDistribution>(`/api/user/reward-distribution?wallet_address=${walletAddress}`);
  }

  async getUserRewards(walletAddress: string): Promise<any> {
    return this.request(`/api/user/rewards?wallet_address=${walletAddress}`);
  }

  // Game Operations
  async createGameSession(walletAddress: string, sessionId: string): Promise<any> {
    return this.request('/api/game/session', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: walletAddress,
        session_id: sessionId,
      }),
    });
  }

  async claimReward(walletAddress: string, rewardType: string, rewardValue: string, gameSessionId: string): Promise<any> {
    return this.request('/api/rewards/claim', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: walletAddress,
        reward_type: rewardType,
        reward_value: rewardValue,
        game_session_id: gameSessionId,
      }),
    });
  }

  // Health Check
  async healthCheck(): Promise<any> {
    return this.request('/health');
  }

  // Relayer Operations
  async getRelayerBalance(): Promise<any> {
    return this.request('/api/relayer/balance');
  }

  // Gas Operations
  async estimateGas(transactionData: any): Promise<any> {
    return this.request('/api/gas/estimate', {
      method: 'POST',
      body: JSON.stringify({
        transaction: transactionData,
      }),
    });
  }
}

export const apiService = new ApiService();