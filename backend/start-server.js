/**
 * Server Startup Script with Environment Check
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

function checkEnvironment() {
  console.log('🔍 Checking environment configuration...');
  
  const requiredVars = [
    'ADMIN_PRIVATE_KEY',
    'ADMIN_ADDRESS',
    'POLYGON_RPC_URL'
  ];
  
  let missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName] || process.env[varName].includes('your_')) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.log('❌ Missing or invalid environment variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('');
    console.log('📋 To fix this:');
    console.log('1. Edit the .env file');
    console.log('2. Replace placeholder values with real wallet details');
    console.log('3. Fund the admin wallet with tokens');
    console.log('');
    return false;
  }
  
  console.log('✅ Environment configuration is valid!');
  console.log(`📊 Admin wallet: ${process.env.ADMIN_ADDRESS}`);
  console.log('');
  return true;
}

function startServer() {
  if (!checkEnvironment()) {
    console.log('❌ Cannot start server with invalid configuration');
    process.exit(1);
  }
  
  console.log('🚀 Starting Gianky Game Backend...');
  console.log(`🌐 Server will run on port ${process.env.PORT || 5001}`);
  console.log('');
  
  // Import and start the server
  try {
    const server = require('./server.js');
    console.log('✅ Server started successfully!');
    console.log('🎮 Ready to process gasless transactions');
    console.log('');
    console.log('📱 Frontend should connect to: http://localhost:5001');
  } catch (error) {
    console.error('❌ Error starting server:', error.message);
    process.exit(1);
  }
}

startServer();
