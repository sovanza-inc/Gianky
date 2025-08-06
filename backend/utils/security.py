"""
Security utilities for authentication and signature verification
"""

import jwt
import hashlib
import hmac
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from web3 import Web3
from eth_account.messages import encode_defunct
from eth_account import Account

logger = logging.getLogger(__name__)

class SecurityUtils:
    """Utility class for security operations"""
    
    def __init__(self, jwt_secret: str):
        self.jwt_secret = jwt_secret
        self.jwt_algorithm = 'HS256'
        self.jwt_expiry_hours = 24
    
    def generate_jwt_token(self, wallet_address: str) -> str:
        """Generate JWT token for authenticated user"""
        try:
            payload = {
                'wallet_address': wallet_address.lower(),
                'exp': datetime.utcnow() + timedelta(hours=self.jwt_expiry_hours),
                'iat': datetime.utcnow(),
                'iss': 'gianky-backend'
            }
            
            token = jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)
            return token
            
        except Exception as e:
            logger.error(f"Error generating JWT token: {str(e)}")
            return ''
    
    def verify_jwt_token(self, token: str) -> Optional[str]:
        """Verify JWT token and return wallet address"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            return payload.get('wallet_address')
            
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid JWT token: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error verifying JWT token: {str(e)}")
            return None
    
    def verify_signature(self, wallet_address: str, message: str, signature: str) -> bool:
        """Verify wallet signature for authentication"""
        try:
            # Create the message hash
            message_hash = encode_defunct(text=message)
            
            # Recover the address from signature
            recovered_address = Account.recover_message(message_hash, signature=signature)
            
            # Compare addresses (case insensitive)
            return recovered_address.lower() == wallet_address.lower()
            
        except Exception as e:
            logger.error(f"Error verifying signature: {str(e)}")
            return False
    
    def create_auth_message(self, wallet_address: str, nonce: str = None) -> str:
        """Create authentication message for wallet signing"""
        if not nonce:
            nonce = str(int(datetime.utcnow().timestamp()))
        
        message = f"""Welcome to Gianky!

Sign this message to authenticate with your wallet.

Wallet: {wallet_address}
Nonce: {nonce}
Timestamp: {datetime.utcnow().isoformat()}

This request will not trigger a blockchain transaction or cost any gas fees."""
        
        return message
    
    def hash_data(self, data: str) -> str:
        """Hash data using SHA256"""
        return hashlib.sha256(data.encode()).hexdigest()
    
    def create_hmac(self, data: str, key: str = None) -> str:
        """Create HMAC signature for data"""
        if not key:
            key = self.jwt_secret
        
        return hmac.new(
            key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
    
    def verify_hmac(self, data: str, signature: str, key: str = None) -> bool:
        """Verify HMAC signature"""
        try:
            expected_signature = self.create_hmac(data, key)
            return hmac.compare_digest(signature, expected_signature)
        except Exception as e:
            logger.error(f"Error verifying HMAC: {str(e)}")
            return False
    
    def sanitize_address(self, address: str) -> str:
        """Sanitize and validate Ethereum address"""
        try:
            # Remove any whitespace
            address = address.strip()
            
            # Check if it's a valid Ethereum address
            if not Web3.isAddress(address):
                raise ValueError("Invalid Ethereum address")
            
            # Return checksummed address
            return Web3.toChecksumAddress(address)
            
        except Exception as e:
            logger.error(f"Error sanitizing address: {str(e)}")
            raise ValueError("Invalid address format")
    
    def validate_transaction_data(self, tx_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate transaction data for security"""
        try:
            validation_result = {
                'valid': True,
                'errors': []
            }
            
            # Check required fields
            required_fields = ['to', 'data']
            for field in required_fields:
                if field not in tx_data:
                    validation_result['errors'].append(f"Missing required field: {field}")
            
            # Validate 'to' address
            if 'to' in tx_data:
                try:
                    self.sanitize_address(tx_data['to'])
                except ValueError:
                    validation_result['errors'].append("Invalid 'to' address")
            
            # Validate gas limit
            if 'gas' in tx_data:
                try:
                    gas = int(tx_data['gas'])
                    if gas > 1000000:  # 1M gas limit
                        validation_result['errors'].append("Gas limit too high")
                    if gas < 21000:  # Minimum gas for transfer
                        validation_result['errors'].append("Gas limit too low")
                except ValueError:
                    validation_result['errors'].append("Invalid gas value")
            
            # Validate value
            if 'value' in tx_data:
                try:
                    value = int(tx_data['value'])
                    if value < 0:
                        validation_result['errors'].append("Value cannot be negative")
                except ValueError:
                    validation_result['errors'].append("Invalid value")
            
            # Check for suspicious data patterns
            if 'data' in tx_data:
                data = tx_data['data']
                if len(data) > 10000:  # Arbitrary limit for data size
                    validation_result['errors'].append("Transaction data too large")
            
            validation_result['valid'] = len(validation_result['errors']) == 0
            return validation_result
            
        except Exception as e:
            logger.error(f"Error validating transaction data: {str(e)}")
            return {
                'valid': False,
                'errors': ['Validation error occurred']
            }
    
    def rate_limit_check(self, identifier: str, limit: int, window_seconds: int = 3600) -> bool:
        """Simple rate limiting check (in production, use Redis)"""
        # This is a simplified implementation
        # In production, implement proper rate limiting with Redis
        try:
            # For now, always return True (no rate limiting)
            # TODO: Implement proper rate limiting
            return True
            
        except Exception as e:
            logger.error(f"Error in rate limit check: {str(e)}")
            return False
    
    def generate_nonce(self) -> str:
        """Generate a unique nonce"""
        import uuid
        return str(uuid.uuid4())
    
    def is_valid_chain_id(self, chain_id: int) -> bool:
        """Check if chain ID is supported"""
        supported_chains = [1, 137, 80001]  # Mainnet, Polygon, Mumbai
        return chain_id in supported_chains