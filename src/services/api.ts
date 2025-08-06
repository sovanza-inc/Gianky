/**
 * API service for communicating with Gianky Backend
 * Handles gasless transactions and reward claims
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WalletConnectRequest {
  wallet_address: string;
  signature: string;
  message: string;
}

export interface WalletConnectResponse {
  success: boolean;
  token: string;
  user: {
    wallet_address: string;
    created_at: string;
    total_rewards: number;
  };
}

export interface RewardClaimRequest {
  reward_type: string;
  reward_value: string;
  game_session_id: string;
}

export interface RewardClaimResponse {
  success: boolean;
  transaction_hash?: string;
  reward_id: string;
  message: string;
}

export interface UserReward {
  reward_id: string;
  reward_type: string;
  reward_value: string;
  tx_hash: string;
  status: string;
  created_at: string;
  details?: any;
}

export interface RewardHistory {
  success: boolean;
  rewards: UserReward[];
  total_count: number;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('gianky_auth_token');
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('gianky_auth_token', token);
    }
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gianky_auth_token');
    }
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }

  /**
   * Connect wallet and authenticate
   */
  async connectWallet(request: WalletConnectRequest): Promise<ApiResponse<WalletConnectResponse>> {
    const response = await this.request<WalletConnectResponse>('/api/wallet/connect', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    // Store token if connection successful
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  /**
   * Claim a game reward
   */
  async claimReward(request: RewardClaimRequest): Promise<ApiResponse<RewardClaimResponse>> {
    return this.request<RewardClaimResponse>('/api/rewards/claim', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get user's reward history
   */
  async getUserRewards(): Promise<ApiResponse<RewardHistory>> {
    return this.request<RewardHistory>('/api/user/rewards');
  }

  /**
   * Mint NFT for user
   */
  async mintNFT(nft_type: string, metadata_uri?: string): Promise<ApiResponse> {
    return this.request('/api/nft/mint', {
      method: 'POST',
      body: JSON.stringify({
        nft_type,
        metadata_uri,
      }),
    });
  }

  /**
   * Transfer tokens to user
   */
  async transferTokens(token_type: string, amount: number): Promise<ApiResponse> {
    return this.request('/api/tokens/transfer', {
      method: 'POST',
      body: JSON.stringify({
        token_type,
        amount,
      }),
    });
  }

  /**
   * Execute meta-transaction
   */
  async executeMetaTransaction(transaction: any, signature: string): Promise<ApiResponse> {
    return this.request('/api/gasless/meta-transaction', {
      method: 'POST',
      body: JSON.stringify({
        transaction,
        signature,
      }),
    });
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(transaction: any): Promise<ApiResponse> {
    return this.request('/api/gas/estimate', {
      method: 'POST',
      body: JSON.stringify({
        transaction,
      }),
    });
  }

  /**
   * Get relayer balance
   */
  async getRelayerBalance(): Promise<ApiResponse> {
    return this.request('/api/relayer/balance');
  }

  /**
   * Generate authentication message for wallet signing
   */
  generateAuthMessage(walletAddress: string): string {
    const nonce = Date.now().toString();
    return `Welcome to Gianky!

Sign this message to authenticate with your wallet.

Wallet: ${walletAddress}
Nonce: ${nonce}
Timestamp: ${new Date().toISOString()}

This request will not trigger a blockchain transaction or cost any gas fees.`;
  }

  /**
   * Generate unique game session ID
   */
  generateGameSessionId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export types for use in components
export type { ApiResponse, WalletConnectRequest, WalletConnectResponse, RewardClaimRequest, RewardClaimResponse, UserReward, RewardHistory };