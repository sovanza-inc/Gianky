/**
 * Update Admin Wallet to Contract Owner
 */

const { ethers } = require('ethers');
require('dotenv').config();

async function updateAdminWallet() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    
    // Get the actual contract owner
    const nftContractAddress = '0xdc91E2fD661E88a9a1bcB1c826B5579232fc9898';
    const nftContract = new ethers.Contract(nftContractAddress, [
      'function owner() view returns (address)'
    ], provider);
    
    const contractOwner = await nftContract.owner();
    console.log('🔍 Contract Owner:', contractOwner);
    
    // Check if we have the private key for the contract owner
    console.log('\n📋 Current Admin Wallet:', process.env.ADMIN_ADDRESS);
    console.log('⚠️  The admin wallet is not the contract owner!');
    
    console.log('\n💡 Solutions:');
    console.log('1. Get the private key for address:', contractOwner);
    console.log('2. Update the .env file with the correct private key');
    console.log('3. Or contact the contract owner to grant minting permissions');
    
    console.log('\n🔧 To fix this, you need to:');
    console.log(`   - Find the private key for: ${contractOwner}`);
    console.log(`   - Update ADMIN_PRIVATE_KEY in .env file`);
    console.log(`   - Update ADMIN_ADDRESS in .env file to: ${contractOwner}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateAdminWallet();
