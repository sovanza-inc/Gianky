"""
NFT Service
Handles NFT minting and management for game rewards
"""

from web3 import Web3
from eth_account import Account
import json
import logging
from typing import Dict, Any, Optional
import requests
import hashlib

logger = logging.getLogger(__name__)

class NFTService:
    """Service for handling NFT operations"""
    
    def __init__(self, config):
        self.config = config
        self.w3 = Web3(Web3.HTTPProvider(config.POLYGON_RPC_URL))
        
        # NFT contract ABI (ERC721 with meta-transaction support)
        self.nft_abi = self._load_nft_abi()
        
        # NFT metadata templates
        self.nft_metadata_templates = {
            "Starter NFT": {
                "name": "Gianky Starter NFT",
                "description": "A starter NFT for new Gianky players",
                "image": "https://your-cdn.com/nfts/starter.png",
                "attributes": [
                    {"trait_type": "Rarity", "value": "Common"},
                    {"trait_type": "Type", "value": "Starter"},
                    {"trait_type": "Power", "value": 10}
                ]
            },
            "Basic NFT": {
                "name": "Gianky Basic NFT",
                "description": "A basic NFT for Gianky players",
                "image": "https://your-cdn.com/nfts/basic.png",
                "attributes": [
                    {"trait_type": "Rarity", "value": "Common"},
                    {"trait_type": "Type", "value": "Basic"},
                    {"trait_type": "Power", "value": 25}
                ]
            },
            "Standard NFT": {
                "name": "Gianky Standard NFT",
                "description": "A standard NFT for dedicated Gianky players",
                "image": "https://your-cdn.com/nfts/standard.png",
                "attributes": [
                    {"trait_type": "Rarity", "value": "Uncommon"},
                    {"trait_type": "Type", "value": "Standard"},
                    {"trait_type": "Power", "value": 50}
                ]
            },
            "VIP NFT": {
                "name": "Gianky VIP NFT",
                "description": "A VIP NFT for premium Gianky players",
                "image": "https://your-cdn.com/nfts/vip.png",
                "attributes": [
                    {"trait_type": "Rarity", "value": "Rare"},
                    {"trait_type": "Type", "value": "VIP"},
                    {"trait_type": "Power", "value": 100}
                ]
            },
            "Premium NFT": {
                "name": "Gianky Premium NFT",
                "description": "A premium NFT for elite Gianky players",
                "image": "https://your-cdn.com/nfts/premium.png",
                "attributes": [
                    {"trait_type": "Rarity", "value": "Epic"},
                    {"trait_type": "Type", "value": "Premium"},
                    {"trait_type": "Power", "value": 200}
                ]
            },
            "Diamond NFT": {
                "name": "Gianky Diamond NFT",
                "description": "The ultimate Diamond NFT for legendary Gianky players",
                "image": "https://your-cdn.com/nfts/diamond.png",
                "attributes": [
                    {"trait_type": "Rarity", "value": "Legendary"},
                    {"trait_type": "Type", "value": "Diamond"},
                    {"trait_type": "Power", "value": 500}
                ]
            }
        }
    
    def _load_nft_abi(self):
        """Load the NFT contract ABI"""
        # Simplified ERC721 ABI with meta-transaction support
        return [
            {
                "inputs": [
                    {"name": "to", "type": "address"},
                    {"name": "tokenId", "type": "uint256"},
                    {"name": "uri", "type": "string"}
                ],
                "name": "mint",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "to", "type": "address"},
                    {"name": "uri", "type": "string"}
                ],
                "name": "safeMint",
                "outputs": [{"name": "tokenId", "type": "uint256"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "tokenId", "type": "uint256"}],
                "name": "tokenURI",
                "outputs": [{"name": "", "type": "string"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"name": "owner", "type": "address"}],
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
            }
        ]
    
    def mint_nft_gasless(self, user_address: str, nft_type: str, metadata_uri: str = '') -> Dict[str, Any]:
        """Mint an NFT for the user using gasless transaction"""
        try:
            if not self.config.GIANKY_NFT_CONTRACT:
                return {'success': False, 'error': 'NFT contract not configured'}
            
            # Get or create metadata URI
            if not metadata_uri:
                metadata_uri = self._create_metadata_uri(nft_type, user_address)
            
            # Get NFT contract
            nft_contract = self.w3.eth.contract(
                address=self.config.GIANKY_NFT_CONTRACT,
                abi=self.nft_abi
            )
            
            # Get next token ID
            try:
                total_supply = nft_contract.functions.totalSupply().call()
                next_token_id = total_supply + 1
            except:
                # Fallback if totalSupply is not available
                next_token_id = int(time.time())  # Use timestamp as token ID
            
            # Prepare transaction data for meta-transaction
            transaction_data = nft_contract.functions.safeMint(
                user_address,
                metadata_uri
            ).buildTransaction({
                'gas': 200000,
                'gasPrice': 0,  # Will be set by gasless service
                'nonce': 0,     # Will be set by gasless service
                'chainId': 137  # Polygon
            })
            
            # Import gasless service to execute the transaction
            from services.gasless_service import GaslessService
            gasless_service = GaslessService(self.config)
            
            # Create a signature for the meta-transaction (simplified)
            signature = self._create_mint_signature(user_address, metadata_uri)
            
            # Execute via gasless service
            result = gasless_service.execute_meta_transaction(
                user_address,
                {
                    'to': self.config.GIANKY_NFT_CONTRACT,
                    'data': transaction_data['data'],
                    'value': 0,
                    'gas': 200000,
                    'chainId': 137
                },
                signature
            )
            
            if result['success']:
                return {
                    'success': True,
                    'tx_hash': result['tx_hash'],
                    'token_id': next_token_id,
                    'contract_address': self.config.GIANKY_NFT_CONTRACT,
                    'metadata_uri': metadata_uri
                }
            else:
                return {'success': False, 'error': result['error']}
                
        except Exception as e:
            logger.error(f"Error minting NFT: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _create_metadata_uri(self, nft_type: str, user_address: str) -> str:
        """Create metadata URI for the NFT"""
        try:
            # Get metadata template
            if nft_type not in self.nft_metadata_templates:
                nft_type = "Starter NFT"  # Default fallback
            
            metadata = self.nft_metadata_templates[nft_type].copy()
            
            # Add unique attributes
            metadata['attributes'].append({
                "trait_type": "Owner",
                "value": user_address[:10] + "..."
            })
            metadata['attributes'].append({
                "trait_type": "Minted Date",
                "value": str(int(time.time()))
            })
            
            # Upload to IPFS (simplified - in production, use proper IPFS client)
            metadata_json = json.dumps(metadata)
            ipfs_hash = self._upload_to_ipfs(metadata_json)
            
            return f"{self.config.IPFS_GATEWAY_URL}{ipfs_hash}"
            
        except Exception as e:
            logger.error(f"Error creating metadata URI: {str(e)}")
            # Return a fallback URI
            return f"https://api.gianky.com/nft-metadata/{nft_type.replace(' ', '-').lower()}"
    
    def _upload_to_ipfs(self, content: str) -> str:
        """Upload content to IPFS (simplified implementation)"""
        try:
            # In production, use proper IPFS client like ipfshttpclient
            # This is a simplified version using a hash as placeholder
            content_hash = hashlib.sha256(content.encode()).hexdigest()
            
            # For now, return a mock IPFS hash
            # In production, implement actual IPFS upload
            return f"Qm{content_hash[:44]}"  # Mock IPFS hash format
            
        except Exception as e:
            logger.error(f"Error uploading to IPFS: {str(e)}")
            return "QmYourDefaultHashHere"
    
    def _create_mint_signature(self, user_address: str, metadata_uri: str) -> str:
        """Create a signature for the mint transaction (simplified)"""
        try:
            # In production, implement proper EIP-712 signature
            # This is a simplified version for demonstration
            message = f"mint:{user_address}:{metadata_uri}"
            message_hash = Web3.keccak(text=message)
            
            # For demo purposes, return a mock signature
            # In production, this should be signed by the user's wallet
            return "0x" + "0" * 130  # Mock signature format
            
        except Exception as e:
            logger.error(f"Error creating signature: {str(e)}")
            return "0x" + "0" * 130
    
    def get_user_nfts(self, user_address: str) -> Dict[str, Any]:
        """Get all NFTs owned by a user"""
        try:
            if not self.config.GIANKY_NFT_CONTRACT:
                return {'success': False, 'error': 'NFT contract not configured'}
            
            nft_contract = self.w3.eth.contract(
                address=self.config.GIANKY_NFT_CONTRACT,
                abi=self.nft_abi
            )
            
            # Get user's NFT balance
            balance = nft_contract.functions.balanceOf(user_address).call()
            
            # In a full implementation, you would iterate through token IDs
            # For now, return the balance
            return {
                'success': True,
                'balance': balance,
                'contract_address': self.config.GIANKY_NFT_CONTRACT
            }
            
        except Exception as e:
            logger.error(f"Error getting user NFTs: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_nft_metadata(self, token_id: int) -> Dict[str, Any]:
        """Get metadata for a specific NFT"""
        try:
            if not self.config.GIANKY_NFT_CONTRACT:
                return {'success': False, 'error': 'NFT contract not configured'}
            
            nft_contract = self.w3.eth.contract(
                address=self.config.GIANKY_NFT_CONTRACT,
                abi=self.nft_abi
            )
            
            # Get token URI
            token_uri = nft_contract.functions.tokenURI(token_id).call()
            
            # Fetch metadata from URI
            if token_uri.startswith('http'):
                response = requests.get(token_uri, timeout=10)
                metadata = response.json()
            else:
                metadata = {'error': 'Invalid token URI'}
            
            return {
                'success': True,
                'token_id': token_id,
                'token_uri': token_uri,
                'metadata': metadata
            }
            
        except Exception as e:
            logger.error(f"Error getting NFT metadata: {str(e)}")
            return {'success': False, 'error': str(e)}