/**
 * Check NFT Contract Permissions and Functions
 */

const { ethers } = require('ethers');
require('dotenv').config();

async function checkNFTContract() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    
    const nftContractAddress = '0xdc91E2fD661E88a9a1bcB1c826B5579232fc9898';
    
    // Extended ABI with more functions
    const extendedABI = [
      'function mint(address to, uint256 tokenId)',
      'function safeMint(address to, uint256 tokenId)',
      'function mintTo(address to, uint256 tokenId)',
      'function mintNFT(address to, uint256 tokenId)',
      'function createToken(address to, uint256 tokenId)',
      'function balanceOf(address owner) view returns (uint256)',
      'function ownerOf(uint256 tokenId) view returns (address)',
      'function tokenURI(uint256 tokenId) view returns (string)',
      'function totalSupply() view returns (uint256)',
      'function tokenByIndex(uint256 index) view returns (uint256)',
      'function owner() view returns (address)',
      'function hasRole(bytes32 role, address account) view returns (bool)',
      'function getRoleMember(bytes32 role, uint256 index) view returns (address)',
      'function getRoleMemberCount(bytes32 role) view returns (uint256)',
      'function MINTER_ROLE() view returns (bytes32)',
      'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
      'function paused() view returns (bool)',
      'function name() view returns (string)',
      'function symbol() view returns (string)'
    ];
    
    const nftContract = new ethers.Contract(nftContractAddress, extendedABI, adminWallet);
    
    console.log('🔍 Checking NFT Contract...\n');
    
    // Check basic contract info
    try {
      const name = await nftContract.name();
      const symbol = await nftContract.symbol();
      const totalSupply = await nftContract.totalSupply();
      const paused = await nftContract.paused();
      
      console.log('📋 Contract Info:');
      console.log(`   Name: ${name}`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Total Supply: ${totalSupply.toString()}`);
      console.log(`   Paused: ${paused}`);
    } catch (error) {
      console.log('❌ Could not read basic contract info:', error.message);
    }
    
    // Check ownership and roles
    try {
      const owner = await nftContract.owner();
      console.log(`\n👑 Contract Owner: ${owner}`);
      console.log(`   Admin Wallet: ${adminWallet.address}`);
      console.log(`   Is Owner: ${owner.toLowerCase() === adminWallet.address.toLowerCase()}`);
    } catch (error) {
      console.log('❌ Could not check ownership:', error.message);
    }
    
    // Check roles
    try {
      const minterRole = await nftContract.MINTER_ROLE();
      const adminRole = await nftContract.DEFAULT_ADMIN_ROLE();
      
      const hasMinterRole = await nftContract.hasRole(minterRole, adminWallet.address);
      const hasAdminRole = await nftContract.hasRole(adminRole, adminWallet.address);
      
      console.log('\n🔐 Role Permissions:');
      console.log(`   MINTER_ROLE: ${hasMinterRole}`);
      console.log(`   ADMIN_ROLE: ${hasAdminRole}`);
    } catch (error) {
      console.log('❌ Could not check roles:', error.message);
    }
    
    // Test different minting functions
    console.log('\n🧪 Testing Minting Functions:');
    
    const testTokenId = Date.now();
    const testAddress = adminWallet.address;
    
    const functions = [
      { name: 'mint', params: [testAddress, testTokenId] },
      { name: 'safeMint', params: [testAddress, testTokenId] },
      { name: 'mintTo', params: [testAddress, testTokenId] },
      { name: 'mintNFT', params: [testAddress, testTokenId] },
      { name: 'createToken', params: [testAddress, testTokenId] }
    ];
    
    for (const func of functions) {
      try {
        console.log(`\n   Testing ${func.name}...`);
        const gasEstimate = await nftContract[func.name].estimateGas(...func.params);
        console.log(`   ✅ ${func.name} - Gas estimate: ${gasEstimate.toString()}`);
      } catch (error) {
        console.log(`   ❌ ${func.name} - Failed: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking NFT contract:', error);
  }
}

checkNFTContract();
