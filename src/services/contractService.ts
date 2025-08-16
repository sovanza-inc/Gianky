/**
 * Contract Service for direct blockchain interactions
 * Handles token transfers, NFT transfers (from admin wallet), and balance checks
 * Note: NFT minting requires contract permissions, so we use transfers instead
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

      // Check if user is on the correct network first
      const networkInfo = await this.detectUserNetwork();
      if (!networkInfo.isCorrect) {
        return {
          success: false,
          error: `Wrong network detected! You're on ${networkInfo.networkName} (Chain ID: ${networkInfo.chainId}), but need Polygon Mainnet (Chain ID: 137).`,
          message: `Please switch to Polygon Mainnet in MetaMask. Current network: ${networkInfo.networkName}`,
        };
      }

      const feeAmount = parseEther(GAME_CONFIG.ENTRY_FEE.toString());
      
      console.log('🔍 Payment Debug Info:');
      console.log('- User wallet:', account.address);
      console.log('- Admin wallet:', CONTRACTS.ADMIN_WALLET);
      console.log('- Token contract:', CONTRACTS.TOKEN_CONTRACT);
      console.log('- Fee amount:', feeAmount.toString());
      console.log('- Fee in tokens:', GAME_CONFIG.ENTRY_FEE);
      console.log('- Network:', networkInfo.networkName);
      
      // Check user balance first
      const userBalance = await this.getTokenBalance(account.address);
      console.log('- User balance:', userBalance);
      
      if (parseFloat(userBalance) < GAME_CONFIG.ENTRY_FEE) {
        return {
          success: false,
          error: `Insufficient balance. Need ${GAME_CONFIG.ENTRY_FEE} Gianky, have ${userBalance}`,
        };
      }
      
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
      
      // Check specific error types
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('insufficient funds')) {
        return {
          success: false,
          error: 'Insufficient funds for gas fee',
        };
      }
      
      if (errorMessage.includes('user rejected')) {
        return {
          success: false,
          error: 'Transaction was rejected by user',
        };
      }
      
      if (errorMessage.includes('Internal JSON-RPC error')) {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.',
        };
      }
      
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
   * Transfer NFT reward from admin wallet to user (when minting is not available)
   */
  async transferNFTReward(walletAddress: string, nftType: string): Promise<TransactionResult> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // Get the token ID for this NFT type
      const tokenId = this.getNFTTokenId(nftType);
      
      // Check if admin wallet owns this NFT
      const isAvailable = await this.checkNFTAvailability(nftType);
      if (!isAvailable) {
        return {
          success: false,
          error: 'Please contact support to add more rewards in the pool',
          message: 'This NFT reward is currently unavailable. Please contact support to add more rewards in the pool.',
        };
      }
      
      // Transfer NFT from admin wallet to user using transferFrom
      const hash = await writeContract(config, {
        address: CONTRACTS.NFT_CONTRACT as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'transferFrom',
        args: [
          CONTRACTS.ADMIN_WALLET as `0x${string}`, // from: admin wallet
          walletAddress as `0x${string}`,           // to: user wallet
          BigInt(tokenId)                           // tokenId: specific NFT ID
        ],
      });

      return {
        success: true,
        hash: hash,
        message: `${nftType} transferred successfully!`,
      };
    } catch (error) {
      console.error('Error transferring NFT:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to transfer NFT. Please try again or contact support.',
      };
    }
  }

  /**
   * Check if admin wallet has specific NFT available for transfer
   */
  async checkNFTAvailability(nftType: string): Promise<boolean> {
    try {
      const tokenId = this.getNFTTokenId(nftType);
      
      const owner = await readContract(config, {
        address: CONTRACTS.NFT_CONTRACT as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'ownerOf',
        args: [BigInt(tokenId)],
      }) as string;
      
      // Check if admin wallet still owns this NFT
      return owner.toLowerCase() === CONTRACTS.ADMIN_WALLET.toLowerCase();
    } catch (error) {
      console.error('Error checking NFT availability:', error);
      return false;
    }
  }

  /**
   * Get hardcoded token ID for NFT type
   */
  private getNFTTokenId(nftType: string): number {
    const tokenIdMap: Record<string, number> = {
      '🎯 Starter NFT': 1,
      '⭐ Basic NFT': 2,
      '🏅 Standard NFT': 3,
      '👑 VIP NFT': 4,
      '💎 Premium NFT': 5,
      '💍 Diamond NFT': 6,
    };
    
    const tokenId = tokenIdMap[nftType];
    if (!tokenId) {
      throw new Error(`Unknown NFT type: ${nftType}`);
    }
    
    return tokenId;
  }

  /**
   * Get all available NFTs in admin wallet for inventory management
   */
  async getAdminWalletNFTInventory(): Promise<Array<{type: string, tokenId: number, available: boolean}>> {
    const nftTypes = [
      '🎯 Starter NFT',
      '⭐ Basic NFT', 
      '🏅 Standard NFT',
      '👑 VIP NFT',
      '💎 Premium NFT',
      '💍 Diamond NFT'
    ];
    
    const inventory = await Promise.all(
      nftTypes.map(async (nftType) => {
        const tokenId = this.getNFTTokenId(nftType);
        const available = await this.checkNFTAvailability(nftType);
        
        return {
          type: nftType,
          tokenId,
          available
        };
      })
    );
    
    return inventory;
  }

  /**
   * Get count of available NFTs by type
   */
  async getAvailableNFTCount(nftType: string): Promise<number> {
    try {
      const isAvailable = await this.checkNFTAvailability(nftType);
      return isAvailable ? 1 : 0;
    } catch (error) {
      console.error('Error getting available NFT count:', error);
      return 0;
    }
  }

  /**
   * Check network health and detect mismatches
   */
  async checkNetworkHealth(): Promise<{
    isHealthy: boolean;
    currentNetwork: string;
    expectedNetwork: string;
    chainId: number;
    expectedChainId: number;
    isCorrectNetwork: boolean;
    details: string;
  }> {
    try {
      const publicClient = getPublicClient(config);
      const blockNumber = await publicClient.getBlockNumber();
      
      // Get current chain ID from the config
      const currentChainId = 137; // Polygon Mainnet from wagmi config
      const expectedChainId = 137; // Polygon Mainnet
      
      const isCorrectNetwork = currentChainId === expectedChainId;
      
      console.log('🌐 Network Health Check:');
      console.log('- Current Chain ID:', currentChainId);
      console.log('- Expected Chain ID:', expectedChainId);
      console.log('- Block Number:', blockNumber.toString());
      console.log('- Is Correct Network:', isCorrectNetwork);
      
      let details = '';
      if (isCorrectNetwork) {
        details = `✅ Connected to Polygon Mainnet (Chain ID: ${currentChainId})`;
      } else {
        details = `❌ Wrong network! Connected to Chain ID: ${currentChainId}, but need Polygon Mainnet (Chain ID: ${expectedChainId})`;
      }
      
      return {
        isHealthy: true,
        currentNetwork: 'Polygon Mainnet',
        expectedNetwork: 'Polygon Mainnet',
        chainId: currentChainId,
        expectedChainId,
        isCorrectNetwork,
        details
      };
    } catch (error) {
      console.error('❌ Network health check failed:', error);
      return {
        isHealthy: false,
        currentNetwork: 'Unknown',
        expectedNetwork: 'Polygon Mainnet',
        chainId: 0,
        expectedChainId: 137,
        isCorrectNetwork: false,
        details: `❌ Network check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check if user is on the correct network
   */
  async isOnCorrectNetwork(): Promise<boolean> {
    try {
      const networkInfo = await this.checkNetworkHealth();
      return networkInfo.isCorrectNetwork;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  }

  /**
   * Detect actual user network from MetaMask
   */
  async detectUserNetwork(): Promise<{
    chainId: number;
    networkName: string;
    isCorrect: boolean;
    needsSwitch: boolean;
  }> {
    try {
      // Check if MetaMask is available
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        return {
          chainId: 0,
          networkName: 'No Wallet',
          isCorrect: false,
          needsSwitch: true
        };
      }

      const ethereum = (window as any).ethereum;
      
      // Get current chain ID
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainId, 16);
      
      // Map chain IDs to network names
      const networkMap: Record<number, string> = {
        1: 'Ethereum Mainnet',
        137: 'Polygon Mainnet',
        80001: 'Polygon Mumbai Testnet',
        56: 'BSC Mainnet',
        42161: 'Arbitrum One',
        10: 'Optimism',
        8453: 'Base',
        11155111: 'Sepolia Testnet'
      };
      
      const networkName = networkMap[currentChainId] || `Unknown Network (${currentChainId})`;
      const isCorrect = currentChainId === 137; // Polygon Mainnet
      
      console.log('🔍 User Network Detection:');
      console.log('- Detected Chain ID:', currentChainId);
      console.log('- Network Name:', networkName);
      console.log('- Is Correct Network:', isCorrect);
      console.log('- Needs Switch:', !isCorrect);
      
      return {
        chainId: currentChainId,
        networkName,
        isCorrect,
        needsSwitch: !isCorrect
      };
    } catch (error) {
      console.error('❌ Error detecting user network:', error);
      return {
        chainId: 0,
        networkName: 'Detection Failed',
        isCorrect: false,
        needsSwitch: true
      };
    }
  }

  /**
   * Get network switching instructions
   */
  getNetworkSwitchingInstructions(): string {
    return `
🌐 Network Switch Instructions:

1. Open MetaMask
2. Click on the network dropdown (top of MetaMask)
3. Select "Polygon Mainnet" or "Polygon"
4. If not listed, click "Add Network" and enter:
   - Network Name: Polygon Mainnet
   - RPC URL: https://polygon-rpc.com
   - Chain ID: 137
   - Currency Symbol: MATIC
   - Block Explorer: https://polygonscan.com

5. Click "Save" and switch to the new network
    `;
  }

  /**
   * Attempt to switch user to Polygon Mainnet
   */
  async switchToPolygonNetwork(): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        return {
          success: false,
          message: 'MetaMask not found. Please install MetaMask first.',
          error: 'No wallet detected'
        };
      }

      const ethereum = (window as any).ethereum;
      
      // Try to switch to Polygon Mainnet
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x89' }], // 137 in hex
      });
      
      return {
        success: true,
        message: 'Successfully switched to Polygon Mainnet! 🎉'
      };
      
          } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            // Add Polygon Mainnet to MetaMask
            await (window as any).ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x89', // 137 in hex
                chainName: 'Polygon Mainnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18
                },
                rpcUrls: ['https://polygon-rpc.com'],
                blockExplorerUrls: ['https://polygonscan.com']
              }]
            });
            
            return {
              success: true,
              message: 'Polygon Mainnet added and switched successfully! 🎉'
            };
            
          } catch (addError) {
            return {
              success: false,
              message: 'Failed to add Polygon Mainnet. Please add it manually.',
              error: addError instanceof Error ? addError.message : 'Unknown error'
            };
          }
        }
        
        return {
          success: false,
          message: 'Failed to switch networks. Please switch manually.',
          error: switchError instanceof Error ? switchError.message : 'Unknown error'
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
        // Transfer NFT from admin wallet to user
        rewardResult = await this.transferNFTReward(walletAddress, rewardString || '🎯 Starter NFT');
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
        // Transfer NFT from admin wallet to user
        return await this.transferNFTReward(userAddress, rewardString || '🎯 Starter NFT');
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
