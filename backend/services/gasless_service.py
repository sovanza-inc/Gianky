"""
Gasless Transaction Service
Handles meta-transactions and relayer functionality
"""

from web3 import Web3
from eth_account import Account
from eth_utils import to_checksum_address
import json
import logging
from typing import Dict, Any, Optional
import time

logger = logging.getLogger(__name__)

class GaslessService:
    """Service for handling gasless transactions using meta-transactions"""
    
    def __init__(self, config):
        self.config = config
        
        # Initialize Web3 connections
        self.polygon_w3 = Web3(Web3.HTTPProvider(config.POLYGON_RPC_URL))
        self.ethereum_w3 = Web3(Web3.HTTPProvider(config.ETHEREUM_RPC_URL))
        
        # Initialize relayer account
        if config.RELAYER_PRIVATE_KEY and config.RELAYER_PRIVATE_KEY != '0x' + '0' * 64:
            self.relayer_account = Account.from_key(config.RELAYER_PRIVATE_KEY)
            self.relayer_address = self.relayer_account.address
        else:
            logger.warning("No valid relayer private key provided. Gasless transactions will not work.")
            self.relayer_account = None
            self.relayer_address = None
        
        # Load meta-transaction forwarder ABI
        self.forwarder_abi = self._load_forwarder_abi()
        
    def _load_forwarder_abi(self):
        """Load the meta-transaction forwarder contract ABI"""
        # Minimal forwarder ABI for EIP-2771 meta-transactions
        return [
            {
                "inputs": [
                    {
                        "components": [
                            {"name": "from", "type": "address"},
                            {"name": "to", "type": "address"},
                            {"name": "value", "type": "uint256"},
                            {"name": "gas", "type": "uint256"},
                            {"name": "nonce", "type": "uint256"},
                            {"name": "data", "type": "bytes"}
                        ],
                        "name": "req",
                        "type": "tuple"
                    },
                    {"name": "signature", "type": "bytes"}
                ],
                "name": "execute",
                "outputs": [
                    {"name": "success", "type": "bool"},
                    {"name": "returndata", "type": "bytes"}
                ],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [{"name": "from", "type": "address"}],
                "name": "getNonce",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
    
    def execute_meta_transaction(self, user_address: str, transaction_data: Dict[str, Any], signature: str) -> Dict[str, Any]:
        """Execute a meta-transaction on behalf of the user"""
        try:
            if not self.relayer_account:
                return {'success': False, 'error': 'Relayer not configured'}
            
            # Validate transaction data
            required_fields = ['to', 'data', 'value', 'gas']
            if not all(field in transaction_data for field in required_fields):
                return {'success': False, 'error': 'Missing required transaction fields'}
            
            # Get the appropriate Web3 instance based on chain
            chain_id = transaction_data.get('chainId', 137)  # Default to Polygon
            w3 = self.polygon_w3 if chain_id == 137 else self.ethereum_w3
            
            # Get forwarder contract
            if not self.config.META_TRANSACTION_FORWARDER:
                return {'success': False, 'error': 'Meta-transaction forwarder not configured'}
            
            forwarder_contract = w3.eth.contract(
                address=self.config.META_TRANSACTION_FORWARDER,
                abi=self.forwarder_abi
            )
            
            # Get user's nonce
            user_nonce = forwarder_contract.functions.getNonce(user_address).call()
            
            # Prepare the forward request
            forward_request = {
                'from': user_address,
                'to': transaction_data['to'],
                'value': int(transaction_data.get('value', 0)),
                'gas': int(transaction_data['gas']),
                'nonce': user_nonce,
                'data': transaction_data['data']
            }
            
            # Verify the signature (simplified - in production, implement full EIP-712 verification)
            if not self._verify_meta_transaction_signature(forward_request, signature, user_address):
                return {'success': False, 'error': 'Invalid signature'}
            
            # Check gas price and limits
            current_gas_price = w3.eth.gas_price
            max_gas_price = Web3.toWei(self.config.MAX_GAS_PRICE_GWEI, 'gwei')
            
            if current_gas_price > max_gas_price:
                return {'success': False, 'error': 'Gas price too high'}
            
            if forward_request['gas'] > self.config.MAX_GAS_LIMIT:
                return {'success': False, 'error': 'Gas limit too high'}
            
            # Execute the meta-transaction
            tx_data = forwarder_contract.functions.execute(
                forward_request,
                signature
            ).buildTransaction({
                'from': self.relayer_address,
                'gas': forward_request['gas'] + 50000,  # Add overhead for forwarder
                'gasPrice': current_gas_price,
                'nonce': w3.eth.get_transaction_count(self.relayer_address)
            })
            
            # Sign and send the transaction
            signed_tx = self.relayer_account.sign_transaction(tx_data)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            # Wait for transaction receipt
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status == 1:
                return {
                    'success': True,
                    'tx_hash': tx_hash.hex(),
                    'gas_used': receipt.gasUsed,
                    'block_number': receipt.blockNumber
                }
            else:
                return {'success': False, 'error': 'Transaction failed'}
                
        except Exception as e:
            logger.error(f"Error executing meta-transaction: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _verify_meta_transaction_signature(self, forward_request: Dict[str, Any], signature: str, expected_signer: str) -> bool:
        """Verify the meta-transaction signature (simplified implementation)"""
        try:
            # In production, implement full EIP-712 signature verification
            # This is a simplified version for demonstration
            
            # Create the message hash (this should follow EIP-712 standard)
            message_hash = Web3.keccak(
                text=f"{forward_request['from']}{forward_request['to']}{forward_request['nonce']}"
            )
            
            # Recover signer from signature
            recovered_address = Account.recover_message(
                message_hash,
                signature=signature
            )
            
            return recovered_address.lower() == expected_signer.lower()
            
        except Exception as e:
            logger.error(f"Error verifying signature: {str(e)}")
            return False
    
    def estimate_gas(self, transaction_data: Dict[str, Any]) -> int:
        """Estimate gas for a transaction"""
        try:
            chain_id = transaction_data.get('chainId', 137)
            w3 = self.polygon_w3 if chain_id == 137 else self.ethereum_w3
            
            # Estimate gas for the transaction
            gas_estimate = w3.eth.estimate_gas({
                'to': transaction_data.get('to'),
                'data': transaction_data.get('data', '0x'),
                'value': int(transaction_data.get('value', 0)),
                'from': transaction_data.get('from', self.relayer_address)
            })
            
            # Add overhead for meta-transaction forwarder
            return gas_estimate + 50000
            
        except Exception as e:
            logger.error(f"Error estimating gas: {str(e)}")
            return self.config.MAX_GAS_LIMIT
    
    def get_current_gas_price(self) -> int:
        """Get current gas price"""
        try:
            return self.polygon_w3.eth.gas_price
        except Exception as e:
            logger.error(f"Error getting gas price: {str(e)}")
            return Web3.toWei(30, 'gwei')  # Fallback gas price
    
    def get_relayer_balance(self) -> int:
        """Get relayer wallet balance"""
        try:
            if not self.relayer_address:
                return 0
            return self.polygon_w3.eth.get_balance(self.relayer_address)
        except Exception as e:
            logger.error(f"Error getting relayer balance: {str(e)}")
            return 0
    
    def is_relayer_funded(self, min_balance_eth: float = 0.1) -> bool:
        """Check if relayer has sufficient funds"""
        try:
            balance_wei = self.get_relayer_balance()
            balance_eth = Web3.fromWei(balance_wei, 'ether')
            return balance_eth >= min_balance_eth
        except Exception as e:
            logger.error(f"Error checking relayer funding: {str(e)}")
            return False