# Gianky Project Setup Guide

## 🎯 Project Overview

Gianky is a Web3 gaming platform with gasless transactions. Players can play the wheel game and claim rewards (NFTs, tokens) without paying gas fees through meta-transactions.

## 🏗️ Architecture

```
Gianky/
├── frontend/          # Next.js React app
│   ├── src/
│   │   ├── app/       # App router pages
│   │   ├── components/ # React components
│   │   └── services/  # API integration
├── backend/           # Python Flask API
│   ├── services/      # Business logic
│   ├── utils/         # Utilities
│   ├── config/        # Configuration
│   └── scripts/       # Setup scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Git

### 1. Clone and Setup

```bash
git clone <your-repo>
cd Gianky

# Make startup script executable
chmod +x start-dev.sh

# Run the startup script
./start-dev.sh
```

### 2. Manual Setup (Alternative)

#### Frontend Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp env.local.example .env.local

# Edit .env.local with your WalletConnect Project ID
# Get one from: https://cloud.walletconnect.com/
```

#### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp env.example .env

# Edit .env with your configuration (see below)

# Initialize database
python scripts/setup.py
```

### 3. Configuration

#### Backend Configuration (.env)

```bash
# Generate strong secrets
SECRET_KEY=your-super-secret-key-change-this
JWT_SECRET=your-jwt-secret-key-change-this

# Blockchain RPC URLs
POLYGON_RPC_URL=https://polygon-rpc.com
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Relayer wallet (create new wallet, fund with MATIC)
RELAYER_PRIVATE_KEY=0x...your-relayer-private-key
RELAYER_ADDRESS=0x...your-relayer-address

# Contract addresses (deploy first, see deployment section)
GIANKY_NFT_CONTRACT=0x...
GIANKY_TOKEN_CONTRACT=0x...
META_TRANSACTION_FORWARDER=0x...
```

#### Frontend Configuration (.env.local)

```bash
# Get from https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Smart Contract Deployment

**Note**: The current deployment script provides simulated contracts for demonstration. For production, deploy real Solidity contracts.

```bash
cd backend
python scripts/deploy_contracts.py
```

For production deployment:
1. Write and compile Solidity contracts (NFT, Token, Forwarder)
2. Deploy to Polygon network
3. Update contract addresses in `.env`
4. Verify contracts on Polygonscan

### 5. Start Development

```bash
# Option 1: Use startup script (recommended)
./start-dev.sh

# Option 2: Manual start
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd backend
source venv/bin/activate
python app.py
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

## 🎮 How It Works

### Game Flow

1. **Connect Wallet**: User connects wallet (MetaMask, WalletConnect)
2. **Authenticate**: User signs message for backend authentication
3. **Play Game**: User plays the 15-card wheel game
4. **Win Reward**: User selects a card and wins a reward
5. **Claim Gasless**: User claims reward without gas fees via backend

### Reward Types

**NFTs:**
- 🎯 Starter NFT
- ⭐ Basic NFT  
- 🏅 Standard NFT
- 👑 VIP NFT
- 💎 Premium NFT
- 💍 Diamond NFT

**Tokens:**
- 🪙 10-50 Polygon (MATIC)
- 💰 10-50 Gianky Coin

### Technical Flow

1. **Authentication**: Wallet signature → JWT token
2. **Game Session**: Generate unique session ID
3. **Reward Claim**: Backend processes gasless transaction
4. **Meta-Transaction**: Relayer pays gas, user gets reward
5. **Confirmation**: Transaction hash returned to frontend

## 🔧 Development

### API Endpoints

- `POST /api/wallet/connect` - Authenticate wallet
- `POST /api/rewards/claim` - Claim game reward
- `GET /api/user/rewards` - Get reward history
- `POST /api/nft/mint` - Mint NFT
- `POST /api/tokens/transfer` - Transfer tokens
- `GET /health` - Health check

### Frontend Integration

```typescript
import { apiService } from '@/services/api';

// Authenticate wallet
const response = await apiService.connectWallet({
  wallet_address: address,
  signature: signature,
  message: message
});

// Claim reward
const claimResponse = await apiService.claimReward({
  reward_type: 'nft',
  reward_value: '🎯 Starter NFT',
  game_session_id: sessionId
});
```

### Backend Services

- **GaslessService**: Meta-transaction handling
- **NFTService**: NFT minting and management
- **TokenService**: Token transfers
- **RewardService**: Game reward processing
- **SecurityUtils**: Authentication and validation
- **Database**: User and reward data

## 🚢 Deployment

### Development
```bash
# Frontend
npm run build
npm start

# Backend
cd backend
gunicorn --bind 0.0.0.0:5000 app:app
```

### Production (Docker)

```bash
# Backend
cd backend
docker build -t gianky-backend .
docker run -p 5000:5000 --env-file .env gianky-backend

# Or use docker-compose
docker-compose up -d
```

### Environment Setup

1. **Secrets**: Generate strong secrets, never commit private keys
2. **Database**: Use PostgreSQL in production
3. **SSL**: Enable HTTPS with SSL certificates
4. **Monitoring**: Add logging and monitoring
5. **Backup**: Regular database backups

## 🔐 Security

- JWT authentication with wallet signatures
- Input validation and sanitization
- Rate limiting protection
- Environment variable security
- CORS configuration
- Secure headers

## 🧪 Testing

```bash
# Frontend
npm run lint

# Backend
cd backend
python -m pytest tests/

# Health check
curl http://localhost:5000/health
```

## 📝 Troubleshooting

### Common Issues

1. **"Relayer not configured"**
   - Set valid `RELAYER_PRIVATE_KEY` in backend `.env`
   - Fund relayer wallet with MATIC

2. **"Web3 connection failed"**
   - Check `POLYGON_RPC_URL` is accessible
   - Verify network connectivity

3. **"Authentication failed"**
   - Ensure WalletConnect Project ID is set
   - Check wallet connection

4. **"Backend connection failed"**
   - Verify backend is running on port 5000
   - Check `NEXT_PUBLIC_API_URL` in frontend

### Debug Steps

1. Check all environment variables are set
2. Verify wallet has funds (for testing)
3. Check browser console for errors
4. Verify backend logs for API errors
5. Test API endpoints directly with curl

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes and test
4. Commit: `git commit -m "Add feature"`
5. Push: `git push origin feature-name`
6. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- Create GitHub issue for bugs
- Check troubleshooting section
- Review API documentation
- Test with provided examples

---

**Ready to build the future of gasless Web3 gaming! 🎮🚀**