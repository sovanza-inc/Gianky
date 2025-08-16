# User-Paid Game System

## Overview
The Gianky game now supports a **User-Paid System** where users pay the game fee from their own wallet and immediately receive their rewards automatically.

## How It Works

### 1. User Pays Game Fee
- User connects their wallet to the Polygon network
- User selects a card to flip
- User pays **5 Gianky tokens** from their wallet to the admin wallet
- Transaction is confirmed on the blockchain

### 2. Payment Confirmation
- Once the fee payment is confirmed, the system acknowledges success
- User can now see their reward revealed
- Card flips to show what they won

### 3. Reward Reveal
- The selected card is flipped to reveal the reward
- User sees exactly what they won (NFT, Gianky tokens, or MATIC)
- Game state is updated to show the revealed card

### 4. Automatic Reward Transfer
- After the reward is revealed, the admin wallet automatically sends the reward
- **NFT Rewards**: Minted directly to the user's wallet
- **Gianky Token Rewards**: Transferred from admin wallet to user
- **MATIC Rewards**: Sent from admin wallet to user (handled by backend)
- User receives their reward in their wallet immediately

## Contract Addresses

- **Network**: Polygon Mainnet
- **Gianky Token Contract**: `0x370806781689e670f85311700445449ac7c3ff7a`
- **NFT Contract**: `0xdc91E2fD661E88a9a1bcB1c826B5579232fc9898`
- **Admin Wallet**: `0x3dC4A08a56095186ce7200dEc812a1905b22F662`

## Game Flow

```
1. User selects card → 2. User pays 5 Gianky → 3. Payment confirmed → 4. Reward revealed → 5. Reward transferred to wallet
```

## Reward Types

### NFT Rewards
- 🎯 Starter NFT
- ⭐ Basic NFT  
- 🏅 Standard NFT
- 👑 VIP NFT
- 💎 Premium NFT
- 💍 Diamond NFT

### Token Rewards
- 🪙 10/20/25/50 Polygon (MATIC)
- 💰 10/20/25/30/50 Gianky Coins

## Technical Implementation

### Frontend (React/Next.js)
- `contractService.playGameAndReceiveReward()` - Handles payment and confirmation
- `contractService.transferRewardAfterReveal()` - Transfers reward after reveal
- User pays fee via `payGameFeeFromUser()`
- Reward transfer happens after payment confirmation and reveal

### Backend (Node.js)
- `/api/game/process-user-paid-fee` - Acknowledges user payment
- `/api/rewards/*` - Sends rewards from admin wallet
- Admin wallet service handles gasless transactions

### Smart Contracts
- Gianky token contract for fee collection
- NFT contract for minting rewards
- Admin wallet for reward distribution

## Benefits

1. **Immediate Rewards**: No waiting time for reward delivery
2. **Transparent**: All transactions visible on blockchain
3. **User Control**: Users pay from their own wallet
4. **Automatic**: No manual intervention needed
5. **Secure**: Smart contract-based transactions

## Requirements

- User must have sufficient Gianky tokens (minimum 5)
- User must be connected to Polygon network
- User wallet must approve token transfers
- Admin wallet must have sufficient funds for rewards

## Error Handling

- Insufficient balance: User needs more Gianky tokens
- Wrong network: User must switch to Polygon
- Transaction failed: Retry mechanism available
- Network issues: Clear error messages displayed
