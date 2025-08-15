/**
 * Update Environment File with Generated Wallet
 */

const fs = require('fs');
const path = require('path');

// Read the generated wallet details
const walletPath = path.join(__dirname, 'admin-wallet.json');
const envPath = path.join(__dirname, '.env');

try {
  // Read wallet details
  const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  
  // Read current .env file
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Replace placeholder values with actual wallet details
  envContent = envContent.replace(
    'ADMIN_PRIVATE_KEY=your_admin_wallet_private_key_here',
    `ADMIN_PRIVATE_KEY=${walletData.privateKey}`
  );
  
  envContent = envContent.replace(
    'ADMIN_ADDRESS=your_admin_wallet_address_here',
    `ADMIN_ADDRESS=${walletData.address}`
  );
  
  // Write updated .env file
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ .env file updated successfully!');
  console.log('');
  console.log('📋 Updated values:');
  console.log(`   Admin Address: ${walletData.address}`);
  console.log(`   Private Key: ${walletData.privateKey.slice(0, 10)}...`);
  console.log('');
  console.log('💰 Next step: Fund the admin wallet');
  console.log(`   Send Gianky tokens to: ${walletData.address}`);
  console.log(`   Send MATIC to: ${walletData.address}`);
  console.log('');
  console.log('🚀 Ready to start server: npm start');
  
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
  console.log('');
  console.log('📋 Manual update required:');
  console.log('1. Open .env file');
  console.log('2. Replace placeholder values with:');
  console.log('   ADMIN_PRIVATE_KEY=0xcabfca1a16e4204247c5cd4f679ac650a7b2d7ffb1bcca9bdfcbd9ed321a9bef');
  console.log('   ADMIN_ADDRESS=0x3dC4A08a56095186ce7200dEc812a1905b22F662');
}
