"""
Gianky Web3 Backend - Flask API Server for Gasless Transactions
Handles meta-transactions, NFT minting, token transfers, and reward distribution
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from web3 import Web3
import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import hashlib
import hmac

# Import our custom modules
from services.gasless_service import GaslessService
from services.nft_service import NFTService
from services.token_service import TokenService
from services.reward_service import RewardService
from utils.security import SecurityUtils
from utils.database import Database
from config.settings import Config

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:3001"])  # Allow frontend origins

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize services
config = Config()
db = Database(config.DATABASE_URL)
security = SecurityUtils(config.JWT_SECRET)
gasless_service = GaslessService(config)
nft_service = NFTService(config)
token_service = TokenService(config)
reward_service = RewardService(config, db)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/wallet/connect', methods=['POST'])
def connect_wallet():
    """Handle wallet connection and user registration"""
    try:
        data = request.get_json()
        wallet_address = data.get('wallet_address')
        signature = data.get('signature')
        message = data.get('message')
        
        if not all([wallet_address, signature, message]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Verify signature
        if not security.verify_signature(wallet_address, message, signature):
            return jsonify({'error': 'Invalid signature'}), 401
        
        # Register or update user
        user = db.get_or_create_user(wallet_address)
        
        # Generate JWT token
        token = security.generate_jwt_token(wallet_address)
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'wallet_address': user['wallet_address'],
                'created_at': user['created_at'],
                'total_rewards': user['total_rewards']
            }
        })
        
    except Exception as e:
        logger.error(f"Error in connect_wallet: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/gasless/meta-transaction', methods=['POST'])
def execute_meta_transaction():
    """Execute a gasless meta-transaction"""
    try:
        # Verify JWT token
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Missing authorization token'}), 401
        
        user_address = security.verify_jwt_token(token)
        if not user_address:
            return jsonify({'error': 'Invalid token'}), 401
        
        data = request.get_json()
        transaction_data = data.get('transaction')
        signature = data.get('signature')
        
        if not all([transaction_data, signature]):
            return jsonify({'error': 'Missing transaction data or signature'}), 400
        
        # Execute the meta-transaction
        result = gasless_service.execute_meta_transaction(
            user_address, 
            transaction_data, 
            signature
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'transaction_hash': result['tx_hash'],
                'gas_used': result['gas_used']
            })
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        logger.error(f"Error in execute_meta_transaction: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/rewards/claim', methods=['POST'])
def claim_reward():
    """Claim a game reward (NFT, tokens, etc.)"""
    try:
        # Verify JWT token
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Missing authorization token'}), 401
        
        user_address = security.verify_jwt_token(token)
        if not user_address:
            return jsonify({'error': 'Invalid token'}), 401
        
        data = request.get_json()
        reward_type = data.get('reward_type')
        reward_value = data.get('reward_value')
        game_session_id = data.get('game_session_id')
        
        if not all([reward_type, reward_value, game_session_id]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Process the reward claim
        result = reward_service.claim_reward(
            user_address,
            reward_type,
            reward_value,
            game_session_id
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'transaction_hash': result.get('tx_hash'),
                'reward_id': result['reward_id'],
                'message': f'Successfully claimed {reward_value}'
            })
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        logger.error(f"Error in claim_reward: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/nft/mint', methods=['POST'])
def mint_nft():
    """Mint an NFT for the user"""
    try:
        # Verify JWT token
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Missing authorization token'}), 401
        
        user_address = security.verify_jwt_token(token)
        if not user_address:
            return jsonify({'error': 'Invalid token'}), 401
        
        data = request.get_json()
        nft_type = data.get('nft_type')
        metadata_uri = data.get('metadata_uri', '')
        
        if not nft_type:
            return jsonify({'error': 'Missing NFT type'}), 400
        
        # Mint the NFT using gasless transaction
        result = nft_service.mint_nft_gasless(
            user_address,
            nft_type,
            metadata_uri
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'transaction_hash': result['tx_hash'],
                'token_id': result['token_id'],
                'contract_address': result['contract_address']
            })
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        logger.error(f"Error in mint_nft: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/tokens/transfer', methods=['POST'])
def transfer_tokens():
    """Transfer tokens to user's wallet"""
    try:
        # Verify JWT token
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Missing authorization token'}), 401
        
        user_address = security.verify_jwt_token(token)
        if not user_address:
            return jsonify({'error': 'Invalid token'}), 401
        
        data = request.get_json()
        token_type = data.get('token_type')  # 'MATIC', 'GIANKY'
        amount = data.get('amount')
        
        if not all([token_type, amount]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Transfer tokens using gasless transaction
        result = token_service.transfer_tokens_gasless(
            user_address,
            token_type,
            amount
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'transaction_hash': result['tx_hash'],
                'amount_transferred': result['amount'],
                'token_type': token_type
            })
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        logger.error(f"Error in transfer_tokens: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/user/rewards', methods=['GET'])
def get_user_rewards():
    """Get user's reward history"""
    try:
        # Verify JWT token
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Missing authorization token'}), 401
        
        user_address = security.verify_jwt_token(token)
        if not user_address:
            return jsonify({'error': 'Invalid token'}), 401
        
        # Get user's rewards
        rewards = db.get_user_rewards(user_address)
        
        return jsonify({
            'success': True,
            'rewards': rewards,
            'total_count': len(rewards)
        })
        
    except Exception as e:
        logger.error(f"Error in get_user_rewards: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/gas/estimate', methods=['POST'])
def estimate_gas():
    """Estimate gas for a transaction"""
    try:
        data = request.get_json()
        transaction_data = data.get('transaction')
        
        if not transaction_data:
            return jsonify({'error': 'Missing transaction data'}), 400
        
        # Estimate gas
        gas_estimate = gasless_service.estimate_gas(transaction_data)
        
        return jsonify({
            'success': True,
            'gas_estimate': gas_estimate,
            'gas_price': gasless_service.get_current_gas_price(),
            'estimated_cost_wei': gas_estimate * gasless_service.get_current_gas_price()
        })
        
    except Exception as e:
        logger.error(f"Error in estimate_gas: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/relayer/balance', methods=['GET'])
def get_relayer_balance():
    """Get relayer wallet balance"""
    try:
        balance = gasless_service.get_relayer_balance()
        
        return jsonify({
            'success': True,
            'balance_wei': balance,
            'balance_eth': Web3.fromWei(balance, 'ether'),
            'relayer_address': gasless_service.relayer_address
        })
        
    except Exception as e:
        logger.error(f"Error in get_relayer_balance: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Initialize database tables
    db.init_tables()
    
    # Start the server
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Starting Gianky Backend Server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)