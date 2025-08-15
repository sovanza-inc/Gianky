/**
 * Simple NFT Minting Test
 */

const { ethers } = require('ethers');
require('dotenv').config();

async function testSimpleMint() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    
    const nftContractAddress = '0xdc91E2fD661E88a9a1bcB1c826B5579232fc9898';
    
    console.log('🔍 Testing Simple NFT Minting...\n');
    console.log('Admin Wallet:', adminWallet.address);
    console.log('NFT Contract:', nftContractAddress);
    
    // Try different ABI approaches
    const abiVersions = [
      // Version 1: Basic mint
      ['function mint(address to, uint256 tokenId)'],
      
      // Version 2: Safe mint
      ['function safeMint(address to, uint256 tokenId)'],
      
      // Version 3: With access control
      [
        'function mint(address to, uint256 tokenId)',
        'function hasRole(bytes32 role, address account) view returns (bool)',
        'function MINTER_ROLE() view returns (bytes32)'
      ],
      
      // Version 4: Owner only
      [
        'function mint(address to, uint256 tokenId)',
        'function owner() view returns (address)'
      ]
    ];
    
    for (let i = 0; i < abiVersions.length; i++) {
      console.log(`\n🧪 Testing ABI Version ${i + 1}:`);
      
      try {
        const contract = new ethers.Contract(nftContractAddress, abiVersions[i], adminWallet);
        
        // Check if we can read basic info
        if (abiVersions[i].includes('owner()')) {
          try {
            const owner = await contract.owner();
            console.log(`   Owner: ${owner}`);
            console.log(`   Is Admin Owner: ${owner.toLowerCase() === adminWallet.address.toLowerCase()}`);
          } catch (e) {
            console.log(`   ❌ Could not read owner: ${e.message}`);
          }
        }
        
        if (abiVersions[i].includes('hasRole')) {
          try {
            const minterRole = await contract.MINTER_ROLE();
            const hasRole = await contract.hasRole(minterRole, adminWallet.address);
            console.log(`   Has MINTER_ROLE: ${hasRole}`);
          } catch (e) {
            console.log(`   ❌ Could not check role: ${e.message}`);
          }
        }
        
        // Try to estimate gas for minting
        const tokenId = Date.now();
        const recipient = adminWallet.address;
        
        try {
          const gasEstimate = await contract.mint.estimateGas(recipient, tokenId);
          console.log(`   ✅ Mint gas estimate: ${gasEstimate.toString()}`);
          
          // Try actual mint
          console.log(`   🚀 Attempting to mint token ${tokenId}...`);
          const tx = await contract.mint(recipient, tokenId, {
            gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
          });
          
          console.log(`   📝 Transaction hash: ${tx.hash}`);
          const receipt = await tx.wait();
          console.log(`   ✅ Mint successful! Block: ${receipt.blockNumber}`);
          return; // Success!
          
        } catch (e) {
          console.log(`   ❌ Mint failed: ${e.message}`);
          
          // Try safeMint if available
          if (abiVersions[i].includes('safeMint')) {
            try {
              console.log(`   🚀 Trying safeMint...`);
              const safeTx = await contract.safeMint(recipient, tokenId, {
                gasLimit: 200000
              });
              console.log(`   ✅ SafeMint successful! Hash: ${safeTx.hash}`);
              return; // Success!
            } catch (safeError) {
              console.log(`   ❌ SafeMint failed: ${safeError.message}`);
            }
          }
        }
        
      } catch (e) {
        console.log(`   ❌ Contract creation failed: ${e.message}`);
      }
    }
    
    console.log('\n❌ All minting attempts failed');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testSimpleMint();
