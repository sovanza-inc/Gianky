/**
 * Contract Configuration for Gianky Game
 * Centralized contract addresses and helper functions
 */

// Contract Addresses
export const CONTRACTS = {
  NFT_CONTRACT: '0xdc91E2fD661E88a9a1bcB1c826B5579232fc9898',
  TOKEN_CONTRACT: '0x370806781689e670f85311700445449ac7c3ff7a',
  ADMIN_WALLET: '0x3dC4A08a56095186ce7200dEc812a1905b22F662',
} as const;

// Game Configuration
export const GAME_CONFIG = {
  ENTRY_FEE: 5, // 5 Gianky tokens (for testing, 50 for production)
  ENTRY_FEE_SYMBOL: 'Gianky',
  NETWORK: 'polygon', // Polygon network
} as const;

// NFT Reward Types
export const NFT_REWARDS = {
  STARTER: '🎯 Starter NFT',
  BASIC: '⭐ Basic NFT',
  STANDARD: '🏅 Standard NFT',
  VIP: '👑 VIP NFT',
  PREMIUM: '💎 Premium NFT',
  DIAMOND: '💍 Diamond NFT',
} as const;

// Token Reward Types
export const TOKEN_REWARDS = {
  POLYGON: ['🪙 10 Polygon', '🪙 20 Polygon', '🪙 25 Polygon', '🪙 50 Polygon'],
  GIANKY: ['💰 10 Gianky Coin', '💰 20 Gianky Coin', '💰 25 Gianky Coin', '💰 30 Gianky Coin', '💰 50 Gianky Coin'],
} as const;

// Contract ABI (simplified for common functions)
export const TOKEN_ABI = [
  // ERC20 standard functions
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_spender", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  }
] as const;

export const NFT_ABI = [
  // ERC721 standard functions
  {
    "constant": true,
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"name": "", "type": "address"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "tokenId", "type": "uint256"}
    ],
    "name": "mint",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "from", "type": "address"},
      {"name": "to", "type": "address"},
      {"name": "tokenId", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  }
] as const;

// Helper functions for contract interactions
export const contractHelpers = {
  /**
   * Format token amount with decimals
   */
  formatTokenAmount: (amount: bigint, decimals: number = 18): string => {
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const fraction = amount % divisor;
    return `${whole}.${fraction.toString().padStart(decimals, '0')}`;
  },

  /**
   * Parse token amount from string to bigint
   */
  parseTokenAmount: (amount: string, decimals: number = 18): bigint => {
    const [whole, fraction = '0'] = amount.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole + paddedFraction);
  },

  /**
   * Get contract address by type
   */
  getContractAddress: (type: 'nft' | 'token'): string => {
    return type === 'nft' ? CONTRACTS.NFT_CONTRACT : CONTRACTS.TOKEN_CONTRACT;
  },

  /**
   * Validate wallet address format
   */
  isValidAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  /**
   * Get reward type from reward string
   */
  getRewardType: (reward: string): 'nft' | 'token' => {
    if (reward.includes('NFT')) return 'nft';
    if (reward.includes('Polygon') || reward.includes('Gianky')) return 'token';
    return 'token'; // default
  }
} as const;
