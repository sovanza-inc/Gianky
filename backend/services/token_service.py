"""
Token Service
Handles token transfers and management for game rewards
"""

from web3 import Web3
from eth_account import Account
import json
import logging
from typing import Dict, Any, Optional
import time

logger = logging.getLogger(__name__)

class TokenService:
    """Service for handling token operations"""
    
    def __init__(self, config):
        self.config = config
        self.w3 = Web3(Web3.HTTPProvider(config.POLYGON_RPC_URL))
        
        # ERC20 token ABI
        self.token_abi = self._load_token_abi()
        
        # Token configurations
        self.token_configs = {
            'MATIC': {
                'address': '0x0000000000000000000000000000000000001010',  # Native MATIC
                'decimals': 18,
                'symbol': 'MATIC',
                'name': 'Polygon'
            },
            'GIANKY': {
                'address': self.config.GIANKY_TOKEN_CONTRACT,
                'decimals': 18,
                'symbol': 'GIANKY',
                'name': 'Gianky Token'
            }
        }
    
    def _load_token_abi(self):
        """Load the ERC20 token contract ABI"""
        return [
            {
                "inputs": [
                    {"name": "to", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "name": "transfer",
                "outputs": [{"name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "from", "type": "address"},
                    {"name": "to", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "name": "transferFrom",
                "outputs": [{"name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "account", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "totalSupply",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "symbol",
                "outputs": [{"name": "", "type": "string"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
    
    def transfer_tokens_gasless(self, user_address: str, token_type: str, amount: float) -> Dict[str, Any]:
        """Transfer tokens to user's wallet using gasless transaction"""
        try:
            if token_type not in self.token_configs:
                return {'success': False, 'error': f'Unsupported token type: {token_type}'}
            
            token_config = self.token_configs[token_type]
            
            # Convert amount to wei (considering token decimals)
            amount_wei = int(amount * (10 ** token_config['decimals']))
            
            if token_type == 'MATIC':
                # For native MATIC, use direct transfer
                return self._transfer_native_matic(user_address, amount_wei)
            else:
                # For ERC20 tokens, use contract transfer
                return self._transfer_erc20_token(user_address, token_config, amount_wei)
                
        except Exception as e:
            logger.error(f"Error transferring tokens: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _transfer_native_matic(self, user_address: str, amount_wei: int) -> Dict[str, Any]:
        """Transfer native MATIC tokens"""
        try:
            # Import gasless service
            from services.gasless_service import GaslessService
            gasless_service = GaslessService(self.config)
            
            if not gasless_service.relayer_account:
                return {'success': False, 'error': 'Relayer not configured'}
            
            # Check relayer balance
            relayer_balance = gasless_service.get_relayer_balance()
            if relayer_balance < amount_wei + Web3.toWei(0.01, 'ether'):  # Keep some for gas
                return {'success': False, 'error': 'Insufficient relayer balance'}
            
            # Prepare transaction
            transaction = {
                'to': user_address,
                'value': amount_wei,
                'gas': 21000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(gasless_service.relayer_address)
            }
            
            # Sign and send transaction
            signed_tx = gasless_service.relayer_account.sign_transaction(transaction)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            # Wait for confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status == 1:
                return {
                    'success': True,
                    'tx_hash': tx_hash.hex(),
                    'amount': Web3.fromWei(amount_wei, 'ether'),
                    'token_type': 'MATIC'
                }
            else:
                return {'success': False, 'error': 'Transaction failed'}
                
        except Exception as e:
            logger.error(f"Error transferring native MATIC: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _transfer_erc20_token(self, user_address: str, token_config: Dict[str, Any], amount_wei: int) -> Dict[str, Any]:
        """Transfer ERC20 tokens"""
        try:
            if not token_config['address']:
                return {'success': False, 'error': 'Token contract address not configured'}
            
            # Get token contract
            token_contract = self.w3.eth.contract(
                address=token_config['address'],
                abi=self.token_abi
            )
            
            # Prepare transaction data
            transaction_data = token_contract.functions.transfer(
                user_address,
                amount_wei
            ).buildTransaction({
                'gas': 100000,
                'gasPrice': 0,  # Will be set by gasless service
                'nonce': 0,     # Will be set by gasless service
                'chainId': 137  # Polygon
            })
            
            # Import gasless service
            from services.gasless_service import GaslessService
            gasless_service = GaslessService(self.config)
            
            # Create signature for the transfer (simplified)
            signature = self._create_transfer_signature(user_address, amount_wei)
            
            # Execute via gasless service
            result = gasless_service.execute_meta_transaction(
                gasless_service.relayer_address,  # Relayer executes the transfer
                {
                    'to': token_config['address'],
                    'data': transaction_data['data'],
                    'value': 0,
                    'gas': 100000,
                    'chainId': 137
                },
                signature
            )
            
            if result['success']:
                return {
                    'success': True,
                    'tx_hash': result['tx_hash'],
                    'amount': amount_wei / (10 ** token_config['decimals']),
                    'token_type': token_config['symbol']
                }
            else:
                return {'success': False, 'error': result['error']}
                
        except Exception as e:
            logger.error(f"Error transferring ERC20 token: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _create_transfer_signature(self, user_address: str, amount_wei: int) -> str:
        """Create a signature for the transfer transaction (simplified)"""
        try:
            # In production, implement proper EIP-712 signature
            # This is a simplified version for demonstration
            message = f"transfer:{user_address}:{amount_wei}"
            message_hash = Web3.keccak(text=message)
            
            # For demo purposes, return a mock signature
            return "0x" + "0" * 130  # Mock signature format
            
        except Exception as e:
            logger.error(f"Error creating transfer signature: {str(e)}")
            return "0x" + "0" * 130
    
    def get_token_balance(self, user_address: str, token_type: str) -> Dict[str, Any]:
        """Get token balance for a user"""
        try:
            if token_type not in self.token_configs:
                return {'success': False, 'error': f'Unsupported token type: {token_type}'}
            
            token_config = self.token_configs[token_type]
            
            if token_type == 'MATIC':
                # Get native MATIC balance
                balance_wei = self.w3.eth.get_balance(user_address)
                balance = Web3.fromWei(balance_wei, 'ether')
            else:
                # Get ERC20 token balance
                if not token_config['address']:
                    return {'success': False, 'error': 'Token contract address not configured'}
                
                token_contract = self.w3.eth.contract(
                    address=token_config['address'],
                    abi=self.token_abi
                )
                
                balance_wei = token_contract.functions.balanceOf(user_address).call()
                balance = balance_wei / (10 ** token_config['decimals'])
            
            return {
                'success': True,
                'balance': balance,
                'token_type': token_config['symbol'],
                'contract_address': token_config.get('address', 'native')
            }
            
        except Exception as e:
            logger.error(f"Error getting token balance: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_token_info(self, token_type: str) -> Dict[str, Any]:
        """Get token information"""
        try:
            if token_type not in self.token_configs:
                return {'success': False, 'error': f'Unsupported token type: {token_type}'}
            
            token_config = self.token_configs[token_type]
            
            if token_type == 'MATIC':
                return {
                    'success': True,
                    'token_info': {
                        'symbol': token_config['symbol'],
                        'name': token_config['name'],
                        'decimals': token_config['decimals'],
                        'type': 'native'
                    }
                }
            else:
                if not token_config['address']:
                    return {'success': False, 'error': 'Token contract address not configured'}
                
                token_contract = self.w3.eth.contract(
                    address=token_config['address'],
                    abi=self.token_abi
                )
                
                # Get token info from contract
                try:
                    symbol = token_contract.functions.symbol().call()
                    decimals = token_contract.functions.decimals().call()
                    total_supply = token_contract.functions.totalSupply().call()
                except:
                    # Fallback to config values
                    symbol = token_config['symbol']
                    decimals = token_config['decimals']
                    total_supply = 0
                
                return {
                    'success': True,
                    'token_info': {
                        'symbol': symbol,
                        'name': token_config['name'],
                        'decimals': decimals,
                        'total_supply': total_supply / (10 ** decimals),
                        'contract_address': token_config['address'],
                        'type': 'erc20'
                    }
                }
                
        except Exception as e:
            logger.error(f"Error getting token info: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def estimate_transfer_cost(self, token_type: str, amount: float) -> Dict[str, Any]:
        """Estimate the cost of a token transfer"""
        try:
            if token_type not in self.token_configs:
                return {'success': False, 'error': f'Unsupported token type: {token_type}'}
            
            # Get current gas price
            gas_price = self.w3.eth.gas_price
            
            if token_type == 'MATIC':
                # Native transfer uses 21000 gas
                gas_estimate = 21000
            else:
                # ERC20 transfer uses ~65000 gas
                gas_estimate = 65000
            
            # Calculate cost in wei and ETH
            cost_wei = gas_estimate * gas_price
            cost_eth = Web3.fromWei(cost_wei, 'ether')
            
            return {
                'success': True,
                'gas_estimate': gas_estimate,
                'gas_price_wei': gas_price,
                'gas_price_gwei': Web3.fromWei(gas_price, 'gwei'),
                'cost_wei': cost_wei,
                'cost_matic': cost_eth,
                'token_type': token_type
            }
            
        except Exception as e:
            logger.error(f"Error estimating transfer cost: {str(e)}")
            return {'success': False, 'error': str(e)}