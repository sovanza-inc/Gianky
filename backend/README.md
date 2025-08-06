# Gianky Backend - Gasless Web3 Transactions

A Python Flask API server that handles gasless web3 transactions for the Gianky game platform. This backend enables users to claim rewards (NFTs, tokens) without paying gas fees through meta-transactions.

## Features

- 🚀 **Gasless Transactions**: Meta-transaction support for NFT minting and token transfers
- 🎯 **Game Rewards**: Automated reward distribution for game wins
- 🔐 **Wallet Authentication**: Secure wallet-based authentication with JWT
- 💎 **NFT Support**: Dynamic NFT minting with metadata
- 🪙 **Token Support**: MATIC and custom token transfers
- 📊 **Analytics**: User reward tracking and statistics
- 🐳 **Docker Ready**: Full containerization support
- 🔄 **Rate Limiting**: Protection against abuse

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js (for frontend integration)
- PostgreSQL (optional, SQLite by default)
- Redis (optional, for production)

### Installation

1. **Clone and setup the backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Setup database and check configuration:**
   ```bash
   python scripts/setup.py
   ```

4. **Start the development server:**
   ```bash
   python app.py
   ```

The API will be available at `http://localhost:5000`

## Configuration

### Environment Variables

Key configuration in `.env` file:

```bash
# Security
SECRET_KEY=your-super-secret-key
JWT_SECRET=your-jwt-secret

# Blockchain
POLYGON_RPC_URL=https://polygon-rpc.com
RELAYER_PRIVATE_KEY=0x...  # Relayer wallet private key
RELAYER_ADDRESS=0x...      # Relayer wallet address

# Contracts (deploy first)
GIANKY_NFT_CONTRACT=0x...
GIANKY_TOKEN_CONTRACT=0x...
META_TRANSACTION_FORWARDER=0x...
```

### Smart Contract Deployment

Deploy the required smart contracts:

```bash
python scripts/deploy_contracts.py
```

**Note**: The deployment script provides simulated contracts for demonstration. In production, deploy real Solidity contracts.

## API Endpoints

### Authentication

- `POST /api/wallet/connect` - Connect wallet and get JWT token
- `GET /health` - Health check

### Gasless Transactions

- `POST /api/gasless/meta-transaction` - Execute meta-transaction
- `POST /api/gas/estimate` - Estimate gas for transaction

### Rewards

- `POST /api/rewards/claim` - Claim game reward
- `GET /api/user/rewards` - Get user reward history

### NFTs

- `POST /api/nft/mint` - Mint NFT for user

### Tokens

- `POST /api/tokens/transfer` - Transfer tokens to user

### Utilities

- `GET /api/relayer/balance` - Check relayer balance

## Game Integration

The backend integrates with the existing wheel game:

### Reward Types Supported

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

### Frontend Integration

Update your frontend to use the backend API:

```javascript
// Connect wallet and get token
const connectResponse = await fetch('/api/wallet/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet_address: address,
    signature: signature,
    message: message
  })
});

// Claim reward
const claimResponse = await fetch('/api/rewards/claim', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    reward_type: 'nft',
    reward_value: '🎯 Starter NFT',
    game_session_id: sessionId
  })
});
```

## Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

```bash
# Build production image
docker build -t gianky-backend .

# Run with environment variables
docker run -d \
  -p 5000:5000 \
  --env-file .env \
  gianky-backend
```

## Architecture

```
backend/
├── app.py                 # Main Flask application
├── config/
│   └── settings.py        # Configuration management
├── services/
│   ├── gasless_service.py # Meta-transaction handling
│   ├── nft_service.py     # NFT minting and management
│   ├── token_service.py   # Token transfer operations
│   └── reward_service.py  # Game reward processing
├── utils/
│   ├── security.py        # Authentication and security
│   └── database.py        # Database operations
└── scripts/
    ├── setup.py           # Initial setup
    └── deploy_contracts.py # Contract deployment
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Signature Verification**: Wallet signature validation
- **Rate Limiting**: Protection against spam
- **Input Validation**: Comprehensive data validation
- **Secure Headers**: CORS and security headers
- **Environment Isolation**: Secure configuration management

## Monitoring and Maintenance

### Health Checks

```bash
curl http://localhost:5000/health
```

### Relayer Balance

Monitor relayer wallet balance:

```bash
curl http://localhost:5000/api/relayer/balance
```

### Database Stats

Check database statistics in the setup script:

```bash
python scripts/setup.py
```

## Production Considerations

1. **Security**:
   - Use strong secrets and rotate them regularly
   - Never commit private keys to version control
   - Use environment variables for all secrets
   - Enable HTTPS with SSL certificates

2. **Scalability**:
   - Use PostgreSQL instead of SQLite
   - Add Redis for caching and rate limiting
   - Use multiple worker processes with Gunicorn
   - Implement proper logging and monitoring

3. **Blockchain**:
   - Deploy real smart contracts
   - Verify contracts on block explorer
   - Monitor gas prices and adjust limits
   - Keep relayer wallet funded

4. **Backup**:
   - Regular database backups
   - Backup private keys securely
   - Monitor transaction logs

## Troubleshooting

### Common Issues

1. **"Relayer not configured"**
   - Set valid `RELAYER_PRIVATE_KEY` in `.env`
   - Fund relayer wallet with MATIC

2. **"Database connection failed"**
   - Check `DATABASE_URL` in `.env`
   - Run `python scripts/setup.py`

3. **"Web3 connection failed"**
   - Verify `POLYGON_RPC_URL` is accessible
   - Check network connectivity

4. **"Contract not configured"**
   - Deploy contracts with `python scripts/deploy_contracts.py`
   - Update contract addresses in `.env`

### Logs

Check application logs for detailed error information:

```bash
# Development
python app.py

# Production (with Gunicorn)
gunicorn --bind 0.0.0.0:5000 --workers 4 app:app
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation