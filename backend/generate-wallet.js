/**
 * Admin Wallet Generator for Gianky Backend
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

function generateAdminWallet() {
  try {
    // Generate new wallet
    const wallet = ethers.Wallet.createRandom();
    
    console.log('🎉 Admin Wallet Generated Successfully!');
    console.log('');
    console.log('📋 Wallet Details:');
    console.log('Address:', wallet.address);
    console.log('Private Key:', wallet.privateKey);
    console.log('');
    console.log('💰 Funding Instructions:');
    console.log('1. Transfer Gianky tokens to:', wallet.address);
    console.log('   - Minimum: 1000 Gianky tokens');
    console.log('2. Transfer MATIC to:', wallet.address);
    console.log('   - Minimum: 10 MATIC for gas fees');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('1. Copy the private key and address above');
    console.log('2. Edit .env file with these values');
    console.log('3. Fund the wallet with tokens');
    console.log('4. Start the server with: npm start');
    console.log('');
    console.log('⚠️  SECURITY WARNING:');
    console.log('- Keep the private key secure');
    console.log('- Never share the private key');
    console.log('- Backup the wallet details');
    
    // Save wallet details to file
    const walletData = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase || 'N/A'
    };
    
    const walletPath = path.join(__dirname, 'admin-wallet.json');
    fs.writeFileSync(walletPath, JSON.stringify(walletData, null, 2));
    console.log('');
    console.log('💾 Wallet details saved to: admin-wallet.json');
    
  } catch (error) {
    console.error('❌ Error generating wallet:', error.message);
  }
}

generateAdminWallet();
