# 🚀 Quick Start Guide - Gianky Web3 Game

## ✅ **Fixed Issues**
- ✅ Removed backend API dependencies
- ✅ Updated to use contract service directly
- ✅ Fixed TypeScript errors
- ✅ Ready to work with your smart contracts

## 🎮 **Your Contract Addresses**
- **NFT Contract**: `0xdc91E2fD661E88a9a1bcB1c826B5579232fc9898`
- **Token Contract**: `0x370806781689e670f85311700445449ac7c3ff7a`

## 📋 **Setup Steps**

### 1. **Environment Setup**
```bash
# Copy environment template
cp env.local.example .env.local
```

### 2. **Get WalletConnect Project ID**
1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID
4. Update `.env.local`:
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-actual-project-id
```

### 3. **Install Dependencies**
```bash
npm install
```

### 4. **Start the Application**
```bash
npm run dev
```

### 5. **Access the Application**
Open [http://localhost:3000](http://localhost:3000)

## 🎯 **How to Test**

### **1. Connect Wallet**
- Click "Connect with WalletConnect"
- Scan QR code with your mobile wallet
- Or use MetaMask browser extension

### **2. Check Balance**
- The dashboard will show your Gianky token balance
- You need at least 50 Gianky tokens to play

### **3. Play the Game**
- Click "Play Reward Game" button
- If you have enough tokens, you can play immediately
- If not, you'll see the payment screen

### **4. Win Rewards**
- Play the 15-card flip game
- Select a card to reveal your reward
- Claim NFTs or tokens directly to your wallet

## 🔧 **What's Working Now**

### ✅ **Contract Integration**
- Direct blockchain interactions
- Real-time balance checking
- Token transfers
- NFT minting
- Transaction confirmation

### ✅ **Game Features**
- Wallet connection
- Balance validation
- Payment processing
- Reward claiming
- Transaction tracking

### ✅ **UI Components**
- Dashboard with stats
- Game interface
- Payment screens
- Reward modals
- Charts and analytics

## 🛠️ **Technical Details**

### **No Backend Required**
- All interactions go directly to blockchain
- Uses Wagmi v2 for Web3 integration
- Contract service handles all transactions
- Real-time balance updates

### **Smart Contract Functions**
- `balanceOf()` - Check token balance
- `transfer()` - Pay game fees
- `mint()` - Create NFT rewards
- `waitForTransaction()` - Confirm transactions

## 🎉 **Ready to Play!**

Your Gianky Web3 game is now fully functional with:
- ✅ Direct contract integration
- ✅ No backend dependencies
- ✅ Real blockchain transactions
- ✅ NFT and token rewards
- ✅ Beautiful UI/UX

**Start playing and earning rewards!** 🎮💰
