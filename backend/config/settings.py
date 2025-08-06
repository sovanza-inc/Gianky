"""
Configuration settings for Gianky Backend
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Application configuration"""
    
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    JWT_SECRET = os.getenv('JWT_SECRET', 'your-jwt-secret-change-in-production')
    
    # Database settings
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///gianky.db')
    
    # Web3 settings
    POLYGON_RPC_URL = os.getenv('POLYGON_RPC_URL', 'https://polygon-rpc.com')
    ETHEREUM_RPC_URL = os.getenv('ETHEREUM_RPC_URL', 'https://eth-mainnet.g.alchemy.com/v2/your-api-key')
    
    # Relayer wallet settings (NEVER commit real private keys!)
    RELAYER_PRIVATE_KEY = os.getenv('RELAYER_PRIVATE_KEY', '0x' + '0' * 64)  # Placeholder
    RELAYER_ADDRESS = os.getenv('RELAYER_ADDRESS', '')
    
    # Contract addresses (deploy these contracts first)
    GIANKY_NFT_CONTRACT = os.getenv('GIANKY_NFT_CONTRACT', '')
    GIANKY_TOKEN_CONTRACT = os.getenv('GIANKY_TOKEN_CONTRACT', '')
    META_TRANSACTION_FORWARDER = os.getenv('META_TRANSACTION_FORWARDER', '')
    
    # Gas settings
    MAX_GAS_PRICE_GWEI = int(os.getenv('MAX_GAS_PRICE_GWEI', '50'))
    MAX_GAS_LIMIT = int(os.getenv('MAX_GAS_LIMIT', '500000'))
    
    # Rate limiting
    MAX_TRANSACTIONS_PER_USER_PER_DAY = int(os.getenv('MAX_TRANSACTIONS_PER_USER_PER_DAY', '10'))
    
    # Redis settings (for caching and rate limiting)
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    
    # IPFS settings (for NFT metadata)
    IPFS_API_URL = os.getenv('IPFS_API_URL', 'https://ipfs.infura.io:5001')
    IPFS_GATEWAY_URL = os.getenv('IPFS_GATEWAY_URL', 'https://ipfs.infura.io/ipfs/')
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    # Environment
    ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
    
    @property
    def is_development(self):
        return self.ENVIRONMENT == 'development'
    
    @property
    def is_production(self):
        return self.ENVIRONMENT == 'production'