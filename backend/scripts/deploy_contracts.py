#!/usr/bin/env python3
"""
Smart Contract Deployment Script for Gianky Backend
Deploys NFT, Token, and Meta-Transaction Forwarder contracts
"""

import os
import sys
import json
import logging
from pathlib import Path
from web3 import Web3
from eth_account import Account

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from config.settings import Config

def setup_logging():
    """Setup logging configuration"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

def get_contract_bytecode_and_abi(contract_name):
    """Get contract bytecode and ABI"""
    # In a real deployment, you would compile Solidity contracts
    # For this example, we'll provide simplified contract templates
    
    contracts = {
        "GiankyNFT": {
            "abi": [
                {
                    "inputs": [{"name": "name", "type": "string"}, {"name": "symbol", "type": "string"}],
                    "stateMutability": "nonpayable",
                    "type": "constructor"
                },
                {
                    "inputs": [{"name": "to", "type": "address"}, {"name": "uri", "type": "string"}],
                    "name": "safeMint",
                    "outputs": [{"name": "tokenId", "type": "uint256"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ],
            "bytecode": "0x608060405234801561001057600080fd5b50..."  # Simplified bytecode
        },
        "GiankyToken": {
            "abi": [
                {
                    "inputs": [{"name": "name", "type": "string"}, {"name": "symbol", "type": "string"}],
                    "stateMutability": "nonpayable",
                    "type": "constructor"
                },
                {
                    "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
                    "name": "transfer",
                    "outputs": [{"name": "", "type": "bool"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ],
            "bytecode": "0x608060405234801561001057600080fd5b50..."  # Simplified bytecode
        },
        "MetaTransactionForwarder": {
            "abi": [
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
                    "outputs": [{"name": "success", "type": "bool"}, {"name": "returndata", "type": "bytes"}],
                    "stateMutability": "payable",
                    "type": "function"
                }
            ],
            "bytecode": "0x608060405234801561001057600080fd5b50..."  # Simplified bytecode
        }
    }
    
    return contracts.get(contract_name, {"abi": [], "bytecode": "0x"})

def deploy_contract(w3, deployer_account, contract_name, constructor_args=None):
    """Deploy a smart contract"""
    print(f"📄 Deploying {contract_name}...")
    
    try:
        contract_data = get_contract_bytecode_and_abi(contract_name)
        
        # In a real deployment, you would use compiled contract artifacts
        # For this example, we'll simulate the deployment
        print(f"⚠️  Note: This is a simulation. In production, deploy real contracts.")
        
        # Simulate contract address (in reality, this would be the actual deployed address)
        import hashlib
        import time
        
        # Generate a mock contract address
        mock_data = f"{contract_name}{deployer_account.address}{time.time()}"
        mock_hash = hashlib.sha256(mock_data.encode()).hexdigest()
        mock_address = f"0x{mock_hash[:40]}"
        
        print(f"✅ {contract_name} deployed at: {mock_address}")
        return {
            "address": mock_address,
            "abi": contract_data["abi"],
            "tx_hash": f"0x{mock_hash}"
        }
        
    except Exception as e:
        print(f"❌ Failed to deploy {contract_name}: {str(e)}")
        return None

def update_env_file(contract_addresses):
    """Update .env file with deployed contract addresses"""
    print("📝 Updating .env file with contract addresses...")
    
    try:
        env_file = Path(__file__).parent.parent / ".env"
        
        # Read existing .env file
        env_content = ""
        if env_file.exists():
            with open(env_file, 'r') as f:
                env_content = f.read()
        
        # Update contract addresses
        for key, address in contract_addresses.items():
            # Replace existing line or add new line
            lines = env_content.split('\n')
            updated = False
            
            for i, line in enumerate(lines):
                if line.startswith(f"{key}="):
                    lines[i] = f"{key}={address}"
                    updated = True
                    break
            
            if not updated:
                lines.append(f"{key}={address}")
            
            env_content = '\n'.join(lines)
        
        # Write updated content
        with open(env_file, 'w') as f:
            f.write(env_content)
        
        print("✅ .env file updated successfully!")
        
    except Exception as e:
        print(f"❌ Failed to update .env file: {str(e)}")

def save_deployment_info(deployment_info):
    """Save deployment information to file"""
    print("💾 Saving deployment information...")
    
    try:
        deployment_file = Path(__file__).parent.parent / "deployment.json"
        
        with open(deployment_file, 'w') as f:
            json.dump(deployment_info, f, indent=2)
        
        print(f"✅ Deployment info saved to: {deployment_file}")
        
    except Exception as e:
        print(f"❌ Failed to save deployment info: {str(e)}")

def main():
    """Main deployment function"""
    setup_logging()
    
    print("🚀 Starting Smart Contract Deployment")
    print("=" * 50)
    
    try:
        config = Config()
        
        # Setup Web3 connection
        w3 = Web3(Web3.HTTPProvider(config.POLYGON_RPC_URL))
        
        if not w3.isConnected():
            print("❌ Failed to connect to Polygon network")
            return
        
        print(f"✅ Connected to Polygon network (block: {w3.eth.block_number})")
        
        # Setup deployer account
        if not config.RELAYER_PRIVATE_KEY or config.RELAYER_PRIVATE_KEY == '0x' + '0' * 64:
            print("❌ Please set a valid RELAYER_PRIVATE_KEY in .env file")
            return
        
        deployer_account = Account.from_key(config.RELAYER_PRIVATE_KEY)
        deployer_balance = w3.eth.get_balance(deployer_account.address)
        
        print(f"👤 Deployer address: {deployer_account.address}")
        print(f"💰 Deployer balance: {Web3.fromWei(deployer_balance, 'ether')} MATIC")
        
        if deployer_balance < Web3.toWei(0.1, 'ether'):
            print("❌ Insufficient balance for deployment. Please fund the deployer account.")
            return
        
        deployment_info = {
            "network": "Polygon",
            "deployer": deployer_account.address,
            "timestamp": str(int(time.time())),
            "contracts": {}
        }
        
        # Deploy contracts
        contracts_to_deploy = [
            ("GiankyNFT", ["Gianky NFT", "GNFT"]),
            ("GiankyToken", ["Gianky Token", "GIANKY"]),
            ("MetaTransactionForwarder", [])
        ]
        
        contract_addresses = {}
        
        for contract_name, constructor_args in contracts_to_deploy:
            result = deploy_contract(w3, deployer_account, contract_name, constructor_args)
            
            if result:
                deployment_info["contracts"][contract_name] = result
                
                # Map to environment variable names
                if contract_name == "GiankyNFT":
                    contract_addresses["GIANKY_NFT_CONTRACT"] = result["address"]
                elif contract_name == "GiankyToken":
                    contract_addresses["GIANKY_TOKEN_CONTRACT"] = result["address"]
                elif contract_name == "MetaTransactionForwarder":
                    contract_addresses["META_TRANSACTION_FORWARDER"] = result["address"]
        
        # Update .env file
        if contract_addresses:
            update_env_file(contract_addresses)
        
        # Save deployment info
        save_deployment_info(deployment_info)
        
        print("=" * 50)
        print("🎉 Contract deployment completed!")
        print("\nDeployed contracts:")
        for name, info in deployment_info["contracts"].items():
            print(f"  {name}: {info['address']}")
        
        print("\n⚠️  Important Notes:")
        print("1. These are simulated deployments for demonstration")
        print("2. In production, compile and deploy real Solidity contracts")
        print("3. Verify contracts on Polygonscan")
        print("4. Test all contract functions before going live")
        
    except Exception as e:
        print(f"❌ Deployment failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()