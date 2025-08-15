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
}

export const contractService = new ContractService();
