/**
 * Gasless Transaction Service
 * Handles automatic payments without user wallet confirmation
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export interface GaslessPaymentResult {
  success: boolean;
  feeTxHash?: string;
  rewardTxHash?: string;
  message?: string;
  error?: string;
}

class GaslessService {
  /**
   * Process game fee payment
   */
  async processGameFee(userAddress: string): Promise<GaslessPaymentResult> {
    try {
      console.log('Processing game fee...');
      
      const response = await fetch(`${API_BASE_URL}/api/game/process-fee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          feeTxHash: result.feeTxHash,
          message: result.message
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Game fee error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  }

  /**
   * Process Gianky token reward
   */
  async processGiankyReward(userAddress: string, amount: number): Promise<GaslessPaymentResult> {
    try {
      console.log(`Processing Gianky reward: ${amount} GIANKY`);
      
      const response = await fetch(`${API_BASE_URL}/api/rewards/gianky`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress,
          amount
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          rewardTxHash: result.rewardTxHash,
          message: result.message
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Gianky reward error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  }

  /**
   * Process MATIC reward
   */
  async processMaticReward(userAddress: string, amount: number): Promise<GaslessPaymentResult> {
    try {
      console.log(`Processing MATIC reward: ${amount} MATIC`);
      
      const response = await fetch(`${API_BASE_URL}/api/rewards/matic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress,
          amount
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          rewardTxHash: result.rewardTxHash,
          message: result.message
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('MATIC reward error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  }

  /**
   * Process NFT reward
   */
  async processNFTReward(userAddress: string, nftType: string): Promise<GaslessPaymentResult> {
    try {
      console.log(`Processing NFT reward: ${nftType}`);
      
      // Map NFT type to endpoint
      let endpoint = '';
      switch (nftType) {
        case '🎯 Starter NFT':
          endpoint = 'starter';
          break;
        case '⭐ Basic NFT':
          endpoint = 'basic';
          break;
        case '🏅 Standard NFT':
          endpoint = 'standard';
          break;
        case '👑 VIP NFT':
          endpoint = 'vip';
          break;
        case '💎 Premium NFT':
          endpoint = 'premium';
          break;
        case '💍 Diamond NFT':
          endpoint = 'diamond';
          break;
        default:
          throw new Error('Unknown NFT type');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/rewards/nft/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          rewardTxHash: result.rewardTxHash,
          message: result.message
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('NFT reward error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  }

  /**
   * Process game payment and reward (legacy method for backward compatibility)
   */
  async processGamePayment(
    userAddress: string, 
    rewardType: string, 
    rewardAmount?: number,
    rewardString?: string
  ): Promise<GaslessPaymentResult> {
    try {
      console.log('Processing gasless payment with new API endpoints...');
      
      // First, process game fee
      const feeResult = await this.processGameFee(userAddress);
      if (!feeResult.success) {
        return feeResult;
      }
      
      // Then, process the specific reward
      if (rewardType === 'NFT') {
        return await this.processNFTReward(userAddress, rewardString || '🎯 Starter NFT');
      } else if (rewardType === 'Gianky') {
        return await this.processGiankyReward(userAddress, rewardAmount || 0);
      } else if (rewardType === 'Polygon') {
        return await this.processMaticReward(userAddress, rewardAmount || 0);
      } else {
        return {
          success: false,
          error: 'Unknown reward type'
        };
      }
      
    } catch (error) {
      console.error('Gasless payment error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  }

  /**
   * Process user-paid game fee and reward (NEW USER-PAID SYSTEM)
   * User pays the fee, then admin wallet sends the reward
   */
  async processUserPaidGamePayment(
    userAddress: string, 
    rewardType: string, 
    rewardAmount?: number,
    rewardString?: string
  ): Promise<GaslessPaymentResult> {
    try {
      console.log('Processing user-paid game payment...');
      
      // First, process user-paid game fee (user transfers to admin wallet)
      const feeResult = await this.processUserPaidGameFee(userAddress);
      if (!feeResult.success) {
        return feeResult;
      }
      
      // Then, process the specific reward (admin wallet sends reward)
      if (rewardType === 'NFT') {
        return await this.processNFTReward(userAddress, rewardString || '🎯 Starter NFT');
      } else if (rewardType === 'Gianky') {
        return await this.processGiankyReward(userAddress, rewardAmount || 0);
      } else if (rewardType === 'Polygon') {
        return await this.processMaticReward(userAddress, rewardAmount || 0);
      } else {
        return {
          success: false,
          error: 'Unknown reward type'
        };
      }
      
    } catch (error) {
      console.error('User-paid game payment error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  }

  /**
   * Process user-paid game fee (user transfers to admin wallet)
   */
  async processUserPaidGameFee(userAddress: string): Promise<GaslessPaymentResult> {
    try {
      console.log('Processing user-paid game fee...');
      
      const response = await fetch(`${API_BASE_URL}/api/game/process-user-paid-fee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          feeTxHash: result.feeTxHash,
          message: result.message
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('User-paid game fee error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  }

  /**
   * Check admin wallet balance
   */
  async checkAdminBalance(): Promise<{ balance: number; sufficient: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/balance`);
      const result = await response.json();
      
      if (result.success) {
        return {
          balance: result.gianky,
          sufficient: result.funds.sufficient
        };
      } else {
        return {
          balance: 0,
          sufficient: false
        };
      }
    } catch (error) {
      console.error('Error checking admin balance:', error);
      return {
        balance: 0,
        sufficient: false
      };
    }
  }

  /**
   * Health check for backend
   */
  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}

export const gaslessService = new GaslessService();
