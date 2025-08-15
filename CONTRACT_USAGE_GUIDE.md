# Gianky Contract Usage Guide

## 📋 Overview

This guide explains how to use the Gianky smart contracts with the Web3 gaming platform.

### Contract Addresses
- **NFT Contract**: `0xdc91E2fD661E88a9a1bcB1c826B5579232fc9898`
- **Token Contract**: `0x370806781689e670f85311700445449ac7c3ff7a`

## 🎮 How the Game Works

### 1. **Game Entry Fee**
- Players must pay **50 Gianky tokens** to play the card flip game
- The fee is transferred from the player's wallet to the NFT contract
- This ensures only players with sufficient tokens can participate

### 2. **Reward System**
The game offers three types of rewards:

#### **NFT Rewards** (6 tiers)
- 🎯 Starter NFT
- ⭐ Basic NFT  
- 🏅 Standard NFT
- 👑 VIP NFT
- 💎 Premium NFT
- 💍 Diamond NFT

#### **Polygon Token Rewards** (4 amounts)
- 🪙 10 Polygon (MATIC)
- 🪙 20 Polygon (MATIC)
- 🪙 25 Polygon (MATIC)
- 🪙 50 Polygon (MATIC)

#### **Gianky Coin Rewards** (5 amounts)
- 💰 10 Gianky Coin
- 💰 20 Gianky Coin
- 💰 25 Gianky Coin
- 💰 30 Gianky Coin
- 💰 50 Gianky Coin

## 🔧 Technical Implementation

### **Step 1: Environment Setup**

Create a `.env.local` file in your project root:

```bash
# Frontend Environment Variables
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
NEXT_PUBLIC_API_URL=http://localhost:5001

# Contract Addresses
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0xdc91E2fD661E88a9a1bcB1c826B5579232fc9898
NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS=0x370806781689e670f85311700445449ac7c3ff7a

# Game Configuration
NEXT_PUBLIC_GAME_FEE=50
NEXT_PUBLIC_GAME_FEE_SYMBOL=Gianky

NODE_ENV=development
```

### **Step 2: Contract Configuration**

The contracts are configured in `src/lib/contracts.ts`:

```typescript
export const CONTRACTS = {
  NFT_CONTRACT: '0xdc91E2fD661E88a9a1bcB1c826B5579232fc9898',
  TOKEN_CONTRACT: '0x370806781689e670f85311700445449ac7c3ff7a',
};

export const GAME_CONFIG = {
  ENTRY_FEE: 50, // 50 Gianky tokens
  ENTRY_FEE_SYMBOL: 'Gianky',
  NETWORK: 'polygon',
};
```

### **Step 3: Using the Contract Service**

The `contractService` provides methods for all contract interactions:

```typescript
import { contractService } from '@/services/contractService';

// Check if user can play
const eligibility = await contractService.checkGameEligibility(walletAddress);

// Pay game fee
const paymentResult = await contractService.payGameFee(walletAddress);

// Mint NFT reward
const nftResult = await contractService.mintNFT(walletAddress, '🎯 Starter NFT');

// Transfer token reward
const tokenResult = await contractService.transferTokens(walletAddress, 50, 'gianky');
```

## 🎯 Game Flow

### **1. Connect Wallet**
```typescript
// User connects their wallet (MetaMask, WalletConnect, etc.)
const { address, isConnected } = useAccount();
```

### **2. Check Eligibility**
```typescript
// Check if user has enough Gianky tokens
const eligibility = await contractService.checkGameEligibility(address);
if (!eligibility.isEligible) {
  // Show payment screen
  console.log(`Need ${eligibility.shortfall} more Gianky tokens`);
}
```

### **3. Pay Entry Fee**
```typescript
// Transfer 50 Gianky tokens to game contract
const result = await contractService.payGameFee(address);
if (result.success) {
  // User can now play the game
  console.log('Payment successful:', result.hash);
}
```

### **4. Play Game**
```typescript
// User plays the 15-card flip game
// Selects a card and wins a reward
const selectedReward = "🎯 Starter NFT"; // or any other reward
```

### **5. Claim Reward**
```typescript
// Claim the reward based on type
if (selectedReward.includes('NFT')) {
  // Mint NFT to user's wallet
  await contractService.mintNFT(address, selectedReward);
} else if (selectedReward.includes('Polygon')) {
  // Transfer Polygon tokens
  const amount = parseInt(selectedReward.match(/\d+/)?.[0] || '0');
  await contractService.transferTokens(address, amount, 'polygon');
} else if (selectedReward.includes('Gianky')) {
  // Transfer Gianky tokens
  const amount = parseInt(selectedReward.match(/\d+/)?.[0] || '0');
  await contractService.transferTokens(address, amount, 'gianky');
}
```

## 🔍 Contract Functions

### **Token Contract Functions**

```typescript
// Check token balance
const balance = await contractService.getTokenBalance(walletAddress);

// Get token info
const { symbol, decimals } = await contractService.getTokenInfo();

// Transfer tokens
const result = await contractService.transferTokens(to, amount, 'gianky');
```

### **NFT Contract Functions**

```typescript
// Check NFT count
const nftCount = await contractService.getNFTCount(walletAddress);

// Mint new NFT
const result = await contractService.mintNFT(walletAddress, nftType);
```

## 🛡️ Security Features

### **1. Balance Validation**
- Checks user's token balance before allowing gameplay
- Prevents users from playing without sufficient funds

### **2. Transaction Confirmation**
- Waits for blockchain confirmation before proceeding
- Ensures transactions are successful

### **3. Error Handling**
- Comprehensive error handling for failed transactions
- User-friendly error messages

## 🚀 Getting Started

### **1. Install Dependencies**
```bash
npm install
```

### **2. Set Environment Variables**
Copy `env.local.example` to `.env.local` and fill in your values.

### **3. Get WalletConnect Project ID**
- Go to [cloud.walletconnect.com](https://cloud.walletconnect.com/)
- Create a new project
- Copy the Project ID to your `.env.local`

### **4. Run the Application**
```bash
npm run dev
```

### **5. Test the Contracts**
1. Connect your wallet
2. Ensure you have Gianky tokens
3. Try playing the game
4. Check your wallet for rewards

## 📊 Monitoring Transactions

### **Polygonscan Links**
- **NFT Contract**: https://polygonscan.com/address/0xdc91E2fD661E88a9a1bcB1c826B5579232fc9898
- **Token Contract**: https://polygonscan.com/address/0x370806781689e670f85311700445449ac7c3ff7a

### **Transaction Tracking**
```typescript
// Wait for transaction confirmation
const confirmed = await contractService.waitForTransaction(txHash);
if (confirmed) {
  console.log('Transaction confirmed on blockchain');
}
```

## 🔧 Troubleshooting

### **Common Issues**

1. **"Insufficient Balance"**
   - Ensure you have at least 50 Gianky tokens
   - Check your wallet balance

2. **"Transaction Failed"**
   - Check if you have enough MATIC for gas fees
   - Ensure you're on the Polygon network

3. **"Contract Not Found"**
   - Verify contract addresses are correct
   - Ensure you're connected to the right network

### **Debug Mode**
```typescript
// Enable debug logging
console.log('Contract addresses:', CONTRACTS);
console.log('Game config:', GAME_CONFIG);
```

## 📈 Future Enhancements

### **Planned Features**
- Gasless transactions using meta-transactions
- Batch reward claiming
- NFT marketplace integration
- Staking rewards
- Governance tokens

### **Contract Upgrades**
- Upgradeable contracts for new features
- Multi-chain support
- Advanced reward algorithms

---

## 🎉 Ready to Play!

Your Gianky game is now fully integrated with the smart contracts. Players can:

1. **Connect their wallet**
2. **Pay the 50 Gianky entry fee**
3. **Play the card flip game**
4. **Claim NFT and token rewards**
5. **View their rewards in their wallet**

The system ensures fair play, secure transactions, and transparent reward distribution through blockchain technology.
