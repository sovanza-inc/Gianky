"""
Reward Service
Handles game reward processing and distribution
"""

import json
import logging
from typing import Dict, Any, Optional, List
import uuid
import time
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class RewardService:
    """Service for handling game rewards"""
    
    def __init__(self, config, database):
        self.config = config
        self.db = database
        
        # Import services
        from services.nft_service import NFTService
        from services.token_service import TokenService
        
        self.nft_service = NFTService(config)
        self.token_service = TokenService(config)
        
        # Reward type mappings
        self.reward_mappings = {
            # NFT Rewards
            "🎯 Starter NFT": {"type": "nft", "value": "Starter NFT"},
            "⭐ Basic NFT": {"type": "nft", "value": "Basic NFT"},
            "🏅 Standard NFT": {"type": "nft", "value": "Standard NFT"},
            "👑 VIP NFT": {"type": "nft", "value": "VIP NFT"},
            "💎 Premium NFT": {"type": "nft", "value": "Premium NFT"},
            "💍 Diamond NFT": {"type": "nft", "value": "Diamond NFT"},
            
            # Polygon Token Rewards
            "🪙 10 Polygon": {"type": "token", "token": "MATIC", "amount": 10},
            "🪙 20 Polygon": {"type": "token", "token": "MATIC", "amount": 20},
            "🪙 25 Polygon": {"type": "token", "token": "MATIC", "amount": 25},
            "🪙 50 Polygon": {"type": "token", "token": "MATIC", "amount": 50},
            
            # Gianky Coin Rewards
            "💰 10 Gianky Coin": {"type": "token", "token": "GIANKY", "amount": 10},
            "💰 20 Gianky Coin": {"type": "token", "token": "GIANKY", "amount": 20},
            "💰 25 Gianky Coin": {"type": "token", "token": "GIANKY", "amount": 25},
            "💰 30 Gianky Coin": {"type": "token", "token": "GIANKY", "amount": 30},
            "💰 50 Gianky Coin": {"type": "token", "token": "GIANKY", "amount": 50}
        }
    
    def claim_reward(self, user_address: str, reward_type: str, reward_value: str, game_session_id: str) -> Dict[str, Any]:
        """Process and distribute a game reward"""
        try:
            # Validate reward
            if reward_value not in self.reward_mappings:
                return {'success': False, 'error': f'Invalid reward: {reward_value}'}
            
            # Check if reward was already claimed for this game session
            if self._is_reward_already_claimed(user_address, game_session_id):
                return {'success': False, 'error': 'Reward already claimed for this game session'}
            
            # Check daily limits
            if not self._check_daily_limits(user_address):
                return {'success': False, 'error': 'Daily reward limit exceeded'}
            
            reward_config = self.reward_mappings[reward_value]
            reward_id = str(uuid.uuid4())
            
            # Process the reward based on type
            if reward_config["type"] == "nft":
                result = self._process_nft_reward(user_address, reward_config, reward_id)
            elif reward_config["type"] == "token":
                result = self._process_token_reward(user_address, reward_config, reward_id)
            else:
                return {'success': False, 'error': 'Unknown reward type'}
            
            if result['success']:
                # Record the reward in database
                self._record_reward(
                    user_address, 
                    reward_id, 
                    reward_type, 
                    reward_value, 
                    game_session_id,
                    result.get('tx_hash', ''),
                    reward_config
                )
                
                return {
                    'success': True,
                    'reward_id': reward_id,
                    'tx_hash': result.get('tx_hash'),
                    'message': f'Successfully claimed {reward_value}'
                }
            else:
                return {'success': False, 'error': result['error']}
                
        except Exception as e:
            logger.error(f"Error claiming reward: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _process_nft_reward(self, user_address: str, reward_config: Dict[str, Any], reward_id: str) -> Dict[str, Any]:
        """Process NFT reward"""
        try:
            nft_type = reward_config["value"]
            
            # Mint NFT for user
            result = self.nft_service.mint_nft_gasless(user_address, nft_type)
            
            if result['success']:
                logger.info(f"NFT minted for {user_address}: {nft_type}")
                return {
                    'success': True,
                    'tx_hash': result['tx_hash'],
                    'token_id': result.get('token_id'),
                    'contract_address': result.get('contract_address')
                }
            else:
                return {'success': False, 'error': result['error']}
                
        except Exception as e:
            logger.error(f"Error processing NFT reward: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _process_token_reward(self, user_address: str, reward_config: Dict[str, Any], reward_id: str) -> Dict[str, Any]:
        """Process token reward"""
        try:
            token_type = reward_config["token"]
            amount = reward_config["amount"]
            
            # Transfer tokens to user
            result = self.token_service.transfer_tokens_gasless(user_address, token_type, amount)
            
            if result['success']:
                logger.info(f"Tokens transferred to {user_address}: {amount} {token_type}")
                return {
                    'success': True,
                    'tx_hash': result['tx_hash'],
                    'amount': result['amount'],
                    'token_type': result['token_type']
                }
            else:
                return {'success': False, 'error': result['error']}
                
        except Exception as e:
            logger.error(f"Error processing token reward: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _is_reward_already_claimed(self, user_address: str, game_session_id: str) -> bool:
        """Check if reward was already claimed for this game session"""
        try:
            existing_reward = self.db.get_reward_by_session(user_address, game_session_id)
            return existing_reward is not None
        except Exception as e:
            logger.error(f"Error checking reward claim status: {str(e)}")
            return False
    
    def _check_daily_limits(self, user_address: str) -> bool:
        """Check if user has exceeded daily reward limits"""
        try:
            # Get rewards from last 24 hours
            since_time = datetime.utcnow() - timedelta(hours=24)
            daily_rewards = self.db.get_user_rewards_since(user_address, since_time)
            
            # Check against configured limit
            max_daily_rewards = self.config.MAX_TRANSACTIONS_PER_USER_PER_DAY
            return len(daily_rewards) < max_daily_rewards
            
        except Exception as e:
            logger.error(f"Error checking daily limits: {str(e)}")
            return True  # Allow if check fails
    
    def _record_reward(self, user_address: str, reward_id: str, reward_type: str, 
                      reward_value: str, game_session_id: str, tx_hash: str, 
                      reward_config: Dict[str, Any]) -> None:
        """Record reward in database"""
        try:
            reward_data = {
                'reward_id': reward_id,
                'user_address': user_address,
                'reward_type': reward_type,
                'reward_value': reward_value,
                'game_session_id': game_session_id,
                'tx_hash': tx_hash,
                'reward_config': json.dumps(reward_config),
                'status': 'completed',
                'created_at': datetime.utcnow().isoformat()
            }
            
            self.db.create_reward(reward_data)
            
            # Update user's total rewards count
            self.db.increment_user_rewards(user_address)
            
        except Exception as e:
            logger.error(f"Error recording reward: {str(e)}")
    
    def get_user_reward_history(self, user_address: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get user's reward history"""
        try:
            rewards = self.db.get_user_rewards(user_address, limit)
            
            # Process rewards for response
            processed_rewards = []
            for reward in rewards:
                processed_reward = {
                    'reward_id': reward['reward_id'],
                    'reward_type': reward['reward_type'],
                    'reward_value': reward['reward_value'],
                    'tx_hash': reward['tx_hash'],
                    'status': reward['status'],
                    'created_at': reward['created_at']
                }
                
                # Add reward config details
                try:
                    reward_config = json.loads(reward['reward_config'])
                    processed_reward['details'] = reward_config
                except:
                    processed_reward['details'] = {}
                
                processed_rewards.append(processed_reward)
            
            return processed_rewards
            
        except Exception as e:
            logger.error(f"Error getting user reward history: {str(e)}")
            return []
    
    def get_reward_statistics(self, user_address: str) -> Dict[str, Any]:
        """Get reward statistics for user"""
        try:
            all_rewards = self.db.get_user_rewards(user_address)
            
            # Calculate statistics
            total_rewards = len(all_rewards)
            nft_rewards = len([r for r in all_rewards if 'NFT' in r['reward_value']])
            token_rewards = total_rewards - nft_rewards
            
            # Calculate token amounts
            matic_total = 0
            gianky_total = 0
            
            for reward in all_rewards:
                if 'Polygon' in reward['reward_value']:
                    # Extract amount from reward value (e.g., "🪙 10 Polygon" -> 10)
                    try:
                        amount = int(reward['reward_value'].split(' ')[1])
                        matic_total += amount
                    except:
                        pass
                elif 'Gianky Coin' in reward['reward_value']:
                    # Extract amount from reward value (e.g., "💰 10 Gianky Coin" -> 10)
                    try:
                        amount = int(reward['reward_value'].split(' ')[1])
                        gianky_total += amount
                    except:
                        pass
            
            # Get recent activity (last 7 days)
            since_time = datetime.utcnow() - timedelta(days=7)
            recent_rewards = self.db.get_user_rewards_since(user_address, since_time)
            
            return {
                'total_rewards': total_rewards,
                'nft_rewards': nft_rewards,
                'token_rewards': token_rewards,
                'matic_earned': matic_total,
                'gianky_earned': gianky_total,
                'recent_activity': len(recent_rewards),
                'last_reward_date': all_rewards[0]['created_at'] if all_rewards else None
            }
            
        except Exception as e:
            logger.error(f"Error getting reward statistics: {str(e)}")
            return {
                'total_rewards': 0,
                'nft_rewards': 0,
                'token_rewards': 0,
                'matic_earned': 0,
                'gianky_earned': 0,
                'recent_activity': 0,
                'last_reward_date': None
            }
    
    def validate_reward_claim(self, user_address: str, reward_value: str, game_session_id: str) -> Dict[str, Any]:
        """Validate if a reward claim is allowed"""
        try:
            # Check if reward exists
            if reward_value not in self.reward_mappings:
                return {'valid': False, 'reason': 'Invalid reward type'}
            
            # Check if already claimed
            if self._is_reward_already_claimed(user_address, game_session_id):
                return {'valid': False, 'reason': 'Already claimed for this session'}
            
            # Check daily limits
            if not self._check_daily_limits(user_address):
                return {'valid': False, 'reason': 'Daily limit exceeded'}
            
            # Check relayer balance (for gasless transactions)
            from services.gasless_service import GaslessService
            gasless_service = GaslessService(self.config)
            
            if not gasless_service.is_relayer_funded():
                return {'valid': False, 'reason': 'Service temporarily unavailable'}
            
            return {'valid': True, 'reason': 'Reward claim is valid'}
            
        except Exception as e:
            logger.error(f"Error validating reward claim: {str(e)}")
            return {'valid': False, 'reason': 'Validation error'}