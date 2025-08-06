#!/usr/bin/env python3
"""
Setup script for Gianky Backend
Initializes database, creates tables, and performs initial setup
"""

import os
import sys
import logging
from pathlib import Path

# Add parent directory to path to import modules
sys.path.append(str(Path(__file__).parent.parent))

from config.settings import Config
from utils.database import Database
from utils.security import SecurityUtils

def setup_logging():
    """Setup logging configuration"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

def check_environment():
    """Check if environment is properly configured"""
    config = Config()
    
    print("🔍 Checking environment configuration...")
    
    # Check critical environment variables
    critical_vars = [
        'SECRET_KEY',
        'JWT_SECRET',
        'POLYGON_RPC_URL',
        'RELAYER_PRIVATE_KEY'
    ]
    
    missing_vars = []
    for var in critical_vars:
        if not getattr(config, var) or getattr(config, var) == 'your-secret-key-change-in-production':
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing or default values for: {', '.join(missing_vars)}")
        print("Please update your .env file with proper values.")
        return False
    
    print("✅ Environment configuration looks good!")
    return True

def setup_database():
    """Initialize database and create tables"""
    print("🗄️  Setting up database...")
    
    try:
        config = Config()
        db = Database(config.DATABASE_URL)
        
        # Initialize tables
        db.init_tables()
        
        # Get stats
        stats = db.get_stats()
        print(f"✅ Database setup complete!")
        print(f"   Users: {stats['total_users']}")
        print(f"   Rewards: {stats['total_rewards']}")
        print(f"   Transactions: {stats['total_transactions']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Database setup failed: {str(e)}")
        return False

def test_web3_connection():
    """Test Web3 connection to blockchain"""
    print("🌐 Testing Web3 connection...")
    
    try:
        from web3 import Web3
        config = Config()
        
        # Test Polygon connection
        w3 = Web3(Web3.HTTPProvider(config.POLYGON_RPC_URL))
        
        if w3.is_connected():
            latest_block = w3.eth.block_number
            print(f"✅ Connected to Polygon network (block: {latest_block})")
            return True
        else:
            print("❌ Failed to connect to Polygon network")
            return False
            
    except Exception as e:
        print(f"❌ Web3 connection failed: {str(e)}")
        return False

def check_relayer_balance():
    """Check relayer wallet balance"""
    print("💰 Checking relayer balance...")
    
    try:
        from services.gasless_service import GaslessService
        config = Config()
        
        gasless_service = GaslessService(config)
        
        if not gasless_service.relayer_address:
            print("❌ Relayer not configured")
            return False
        
        balance_wei = gasless_service.get_relayer_balance()
        balance_matic = Web3.fromWei(balance_wei, 'ether')
        
        print(f"   Relayer address: {gasless_service.relayer_address}")
        print(f"   Balance: {balance_matic:.4f} MATIC")
        
        if balance_matic < 0.1:
            print("⚠️  Warning: Relayer balance is low. Fund it with MATIC for gas fees.")
        else:
            print("✅ Relayer balance is sufficient")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to check relayer balance: {str(e)}")
        return False

def create_sample_data():
    """Create sample data for testing (optional)"""
    print("📝 Creating sample data...")
    
    try:
        config = Config()
        db = Database(config.DATABASE_URL)
        
        # Create a sample user
        sample_address = "0x1234567890123456789012345678901234567890"
        user = db.get_or_create_user(sample_address)
        
        print(f"✅ Created sample user: {sample_address}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create sample data: {str(e)}")
        return False

def main():
    """Main setup function"""
    setup_logging()
    
    print("🚀 Starting Gianky Backend Setup")
    print("=" * 50)
    
    success = True
    
    # Step 1: Check environment
    if not check_environment():
        success = False
    
    # Step 2: Setup database
    if not setup_database():
        success = False
    
    # Step 3: Test Web3 connection
    if not test_web3_connection():
        success = False
    
    # Step 4: Check relayer balance
    if not check_relayer_balance():
        success = False
    
    # Step 5: Create sample data (optional)
    create_sample_data()
    
    print("=" * 50)
    if success:
        print("🎉 Setup completed successfully!")
        print("\nNext steps:")
        print("1. Deploy smart contracts (NFT, Token, Forwarder)")
        print("2. Update contract addresses in .env file")
        print("3. Fund relayer wallet with MATIC")
        print("4. Start the server: python app.py")
    else:
        print("❌ Setup completed with errors. Please fix the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()