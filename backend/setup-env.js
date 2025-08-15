/**
 * Environment Setup Script for Gianky Backend
 */

const fs = require('fs');
const path = require('path');

const envContent = `# Admin Wallet Configuration
ADMIN_PRIVATE_KEY=your_admin_wallet_private_key_here
ADMIN_ADDRESS=your_admin_wallet_address_here

# Polygon Network Configuration
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_CHAIN_ID=137

# Server Configuration
PORT=5001
NODE_ENV=development

# Security
CORS_ORIGIN=http://localhost:3000
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Edit .env file with your admin wallet details');
  console.log('2. Create admin wallet and fund it');
  console.log('3. Run: npm start');
  console.log('');
  console.log('⚠️  IMPORTANT: Replace the placeholder values in .env file!');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
}
