/**
 * Contract Service for direct blockchain interactions
 * Handles token transfers, NFT minting, and balance checks
 */

import { readContract, writeContract, getAccount, getPublicClient } from 'wagmi/actions';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS, TOKEN_ABI, NFT_ABI, GAME_CONFIG, contractHelpers } from '@/lib/contracts';
import { config } from '@/lib/wagmi';

export interface ContractBalance {
  tokenBalance: string;
  nftCount: number;
  isEligible: boolean;
  shortfall: number;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  message?: string;
}

class ContractService {
  /**
   * Get user's token balance
   */
  async getTokenBalance(walletAddress: string): Promise<string> {
    try {
      const balance = await readContract(config, {
        address: CONTRACTS.TOKEN_CONTRACT as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`],
      });

      return formatEther(balance as bigint);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return '0';
    }
  }

  /**
   * Get user's NFT count
   */
  async getNFTCount(walletAddress: string): Promise<number> {
    try {
      const count = await readContract(config, {
        address: CONTRACTS.NFT_CONTRACT as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`],
      });

      return Number(count);
    } catch (error) {
      console.error('Error getting NFT count:', error);
      return 0;
    }
  }

  /**
   * Check if user can afford to play the game
   */
  async checkGameEligibility(walletAddress: string): Promise<ContractBalance> {
    const tokenBalance = await this.getTokenBalance(walletAddress);
    const nftCount = await this.getNFTCount(walletAddress);
    
    const balanceNumber = parseFloat(tokenBalance);
    const requiredFee = GAME_CONFIG.ENTRY_FEE;
    const isEligible = balanceNumber >= requiredFee;
    const shortfall = Math.max(0, requiredFee - balanceNumber);

    return {
      tokenBalance,
      nftCount,
      isEligible,
      shortfall,
    };
  }

  /**
   * Pay game entry fee (transfer tokens from user to game contract)
   */
  async payGameFee(walletAddress: string): Promise<TransactionResult> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      const feeAmount = parseEther(GAME_CONFIG.ENTRY_FEE.toString());
      
      const hash = await writeContract(config, {
        address: CONTRACTS.TOKEN_CONTRACT as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'transfer',
        args: [CONTRACTS.NFT_CONTRACT as `0x${string}`, feeAmount],
      });

      return {
        success: true,
        hash: hash,
      };
    } catch (error) {
      console.error('Error paying game fee:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Pay game entry fee from user wallet to admin wallet (NEW USER-PAID SYSTEM)
   */
  async payGameFeeFromUser(walletAddress: string): Promise<TransactionResult> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      const feeAmount = parseEther(GAME_CONFIG.ENTRY_FEE.toString());
      
      // Transfer from user to admin wallet instead of game contract
      const hash = await writeContract(config, {
        address: CONTRACTS.TOKEN_CONTRACT as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'transfer',
        args: [CONTRACTS.ADMIN_WALLET as `0x${string}`, feeAmount],
      });

      return {
        success: true,
        hash: hash,
      };
    } catch (error) {
      console.error('Error paying game fee from user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Mint NFT reward to user
   */
  async mintNFT(walletAddress: string, nftType: string): Promise<TransactionResult> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // Generate token ID based on NFT type
      const tokenId = this.generateTokenId(nftType);
      
      const hash = await writeContract(config, {
        address: CONTRACTS.NFT_CONTRACT as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'mint',
        args: [walletAddress as `0x${string}`, BigInt(tokenId)],
      });

      return {
        success: true,
        hash: hash,
      };
    } catch (error) {
      console.error('Error minting NFT:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Transfer token reward to user
   */
  async transferTokens(walletAddress: string, amount: number, tokenType: 'polygon' | 'gianky'): Promise<TransactionResult> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      const tokenAmount = parseEther(amount.toString());
      const contractAddress = tokenType === 'polygon' 
        ? '0x0000000000000000000000000000000000001010' // Native MATIC
        : CONTRACTS.TOKEN_CONTRACT as `0x${string}`;

      const hash = await writeContract(config, {
        address: contractAddress as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'transfer',
        args: [walletAddress as `0x${string}`, tokenAmount],
      });

      return {
        success: true,
        hash: hash,
      };
    } catch (error) {
      console.error('Error transferring tokens:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get token symbol and decimals
   */
  async getTokenInfo(): Promise<{ symbol: string; decimals: number }> {
    try {
      const [symbol, decimals] = await Promise.all([
        readContract(config, {
          address: CONTRACTS.TOKEN_CONTRACT as `0x${string}`,
          abi: TOKEN_ABI,
          functionName: 'symbol',
        }),
        readContract(config, {
          address: CONTRACTS.TOKEN_CONTRACT as `0x${string}`,
          abi: TOKEN_ABI,
          functionName: 'decimals',
        }),
      ]);

      return {
        symbol: symbol as string,
        decimals: Number(decimals),
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return {
        symbol: 'Gianky',
        decimals: 18,
      };
    }
  }

  /**
   * Generate unique token ID for NFT
   */
  private generateTokenId(nftType: string): number {
    const typeMap: Record<string, number> = {
      '🎯 Starter NFT': 1,
      '⭐ Basic NFT': 2,
      '🏅 Standard NFT': 3,
      '👑 VIP NFT': 4,
      '💎 Premium NFT': 5,
      '💍 Diamond NFT': 6,
    };

    const baseId = typeMap[nftType] || 1;
    const timestamp = Date.now();
    return baseId * 1000000 + (timestamp % 1000000);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(hash: string): Promise<boolean> {
    try {
      const publicClient = getPublicClient(config);
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
      return receipt.status === 'success';
    } catch (error) {
      console.error('Error waiting for transaction:', error);
      return false;
    }
  }

  /**
   * Complete user-paid game flow: User pays fee, then admin sends reward automatically
   */
  async playGameAndReceiveReward(
    walletAddress: string, 
    rewardType: 'NFT' | 'Polygon' | 'Gianky',
    rewardAmount?: number,
    rewardString?: string
  ): Promise<TransactionResult> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // Step 1: User pays the game fee to admin wallet
      console.log('Step 1: User paying game fee to admin wallet...');
      const feeResult = await this.payGameFeeFromUser(walletAddress);
      if (!feeResult.success) {
        return feeResult;
      }

      // Step 2: Wait for fee payment confirmation
      console.log('Step 2: Waiting for fee payment confirmation...');
      const feeConfirmed = await this.waitForTransaction(feeResult.hash!);
      if (!feeConfirmed) {
        return {
          success: false,
          error: 'Fee payment failed. Please try again.',
        };
      }

      // Step 3: Payment confirmed - reward can now be revealed
      console.log('Step 3: Payment confirmed! Reward can be revealed.');
      return {
        success: true,
        hash: feeResult.hash, // Return fee transaction hash
        message: 'Payment confirmed! Reward will be transferred after reveal.',
      };

    } catch (error) {
      console.error('Error in game payment flow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Transfer reward to user after payment confirmation and reward reveal
   */
  async transferRewardAfterReveal(
    walletAddress: string,
    rewardType: 'NFT' | 'Polygon' | 'Gianky',
    rewardAmount?: number,
    rewardString?: string
  ): Promise<TransactionResult> {
    try {
      console.log('Transferring reward to user after reveal...');
      let rewardResult: TransactionResult;

      if (rewardType === 'NFT') {
        // Mint NFT to user
        rewardResult = await this.mintNFT(walletAddress, rewardString || '🎯 Starter NFT');
      } else if (rewardType === 'Gianky') {
        // Transfer Gianky tokens from admin wallet to user
        rewardResult = await this.transferTokensFromAdmin(walletAddress, rewardAmount || 0, 'gianky');
      } else if (rewardType === 'Polygon') {
        // Transfer MATIC from admin wallet to user
        rewardResult = await this.transferTokensFromAdmin(walletAddress, rewardAmount || 0, 'polygon');
      } else {
        return {
          success: false,
          error: 'Unknown reward type',
        };
      }

      if (!rewardResult.success) {
        return rewardResult;
      }

      // Wait for reward transfer confirmation
      console.log('Waiting for reward transfer confirmation...');
      const rewardConfirmed = await this.waitForTransaction(rewardResult.hash!);
      if (!rewardConfirmed) {
        return {
          success: false,
          error: 'Reward transfer failed. Please try again.',
        };
      }

      // Success! Reward transferred
      return {
        success: true,
        hash: rewardResult.hash,
        message: 'Reward transferred successfully!',
      };

    } catch (error) {
      console.error('Error transferring reward:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send reward from admin wallet to user (called after user pays game fee)
   */
  async sendRewardFromAdmin(
    userAddress: string,
    rewardType: 'NFT' | 'Polygon' | 'Gianky',
    rewardAmount?: number,
    rewardString?: string
  ): Promise<TransactionResult> {
    try {
      // This method is called by the admin wallet service
      // The admin wallet must be connected to execute this
      
      if (rewardType === 'NFT') {
        // Mint NFT to user
        return await this.mintNFT(userAddress, rewardString || '🎯 Starter NFT');
      } else if (rewardType === 'Gianky') {
        // Transfer Gianky tokens from admin wallet to user
        return await this.transferTokensFromAdmin(userAddress, rewardAmount || 0, 'gianky');
      } else if (rewardType === 'Polygon') {
        // For MATIC, we need to use the gasless service since it's native token
        // This will be handled by the backend admin wallet service
        return {
          success: false,
          error: 'MATIC rewards handled by backend service',
        };
      } else {
        return {
          success: false,
          error: 'Unknown reward type',
        };
      }

    } catch (error) {
      console.error('Error sending reward from admin:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Transfer tokens from admin wallet to user (admin wallet must approve this)
   */
  async transferTokensFromAdmin(
    userAddress: string, 
    amount: number, 
    tokenType: 'polygon' | 'gianky'
  ): Promise<TransactionResult> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // For this to work, the admin wallet must have approved the user or contract
      // to spend tokens on their behalf, or we need to use a different approach
      
      if (tokenType === 'gianky') {
        // Transfer Gianky tokens from admin wallet to user
        const tokenAmount = parseEther(amount.toString());
        
        const hash = await writeContract(config, {
          address: CONTRACTS.TOKEN_CONTRACT as `0x${string}`,
          abi: TOKEN_ABI,
          functionName: 'transfer',
          args: [userAddress as `0x${string}`, tokenAmount],
        });

        return {
          success: true,
          hash: hash,
        };
      } else {
        // For MATIC, we need to use a different approach since it's native token
        // This would require the admin wallet to send MATIC directly
        return {
          success: false,
          error: 'MATIC transfer requires admin wallet approval',
        };
      }

    } catch (error) {
      console.error('Error transferring tokens from admin:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const contractService = new ContractService();
