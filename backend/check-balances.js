/**
 * Check Admin Wallet Balances
 * Displays Gianky coin and MATIC balances
 */

const AdminWalletService = require('./admin-wallet-service');
require('dotenv').config();

async function checkBalances() {
  try {
    console.log('🔍 Checking Admin Wallet Balances...\n');
    
    const adminService = new AdminWalletService();
    
    // Get all balances
    const balances = await adminService.getAllBalances();
    
    console.log('📊 Admin Wallet Balance Report');
    console.log('================================');
    console.log(`🏦 Admin Address: ${adminService.adminAddress}`);
    console.log(`🪙 Gianky Coins: ${balances.giankyFormatted} GIANKY`);
    console.log(`💎 MATIC Balance: ${balances.maticFormatted} MATIC`);
    console.log('');
    
    // Check if sufficient funds for operations
    const fundsCheck = await adminService.checkAdminFunds();
    console.log('💰 Funds Status:');
    console.log(`   Required: ${fundsCheck.required} GIANKY`);
    console.log(`   Available: ${fundsCheck.balance} GIANKY`);
    console.log(`   Sufficient: ${fundsCheck.sufficient ? '✅ Yes' : '❌ No'}`);
    
    if (!fundsCheck.sufficient) {
      console.log('\n⚠️  Warning: Admin wallet has insufficient Gianky tokens for game operations!');
    }
    
    console.log('\n✅ Balance check completed!');
    
  } catch (error) {
    console.error('❌ Error checking balances:', error.message);
    process.exit(1);
  }
}

// Run the balance check
checkBalances();
