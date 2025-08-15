/**
 * Backend Server for Gianky Game
 * Handles gasless transactions via admin wallet
 */

const express = require('express');
const cors = require('cors');
const AdminWalletService = require('./admin-wallet-service');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize admin wallet service
const adminWalletService = new AdminWalletService();

// API Routes

/**
 * Process game fee payment (GASLESS)
 */
app.post('/api/game/process-fee', async (req, res) => {
  try {
    const { userAddress } = req.body;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing user address'
      });
    }
    
    console.log(`Processing game fee for ${userAddress}`);
    
    // Process game fee payment
    const result = await adminWalletService.processGameFee(userAddress);
    
    if (result.success) {
      res.json({
        success: true,
        feeTxHash: result.feeTxHash,
        message: 'Game fee processed successfully!'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Process user-paid game fee (USER PAYS, ADMIN SENDS REWARD)
 */
app.post('/api/game/process-user-paid-fee', async (req, res) => {
  try {
    const { userAddress } = req.body;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing user address'
      });
    }
    
    console.log(`Processing user-paid game fee for ${userAddress}`);
    
    // For user-paid system, we just acknowledge the payment
    // The actual payment happens on the frontend via user's wallet
    // This endpoint is called after user has already paid
    res.json({
      success: true,
      feeTxHash: 'user-paid',
      message: 'User payment acknowledged! Admin will send reward.'
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Process Gianky token reward (GASLESS)
 */
app.post('/api/rewards/gianky', async (req, res) => {
  try {
    const { userAddress, amount } = req.body;
    
    if (!userAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing user address or amount'
      });
    }
    
    console.log(`Processing Gianky reward: ${amount} GIANKY for ${userAddress}`);
    
    // Process Gianky reward
    const result = await adminWalletService.processGiankyReward(userAddress, amount);
    
    if (result.success) {
      res.json({
        success: true,
        rewardTxHash: result.rewardTxHash,
        amount: amount,
        message: `${amount} Gianky tokens sent successfully!`
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Process MATIC reward (GASLESS)
 */
app.post('/api/rewards/matic', async (req, res) => {
  try {
    const { userAddress, amount } = req.body;
    
    if (!userAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing user address or amount'
      });
    }
    
    console.log(`Processing MATIC reward: ${amount} MATIC for ${userAddress}`);
    
    // Process MATIC reward
    const result = await adminWalletService.processMaticReward(userAddress, amount);
    
    if (result.success) {
      res.json({
        success: true,
        rewardTxHash: result.rewardTxHash,
        amount: amount,
        message: `${amount} MATIC sent successfully!`
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Process NFT reward - Starter NFT (GASLESS)
 */
app.post('/api/rewards/nft/starter', async (req, res) => {
  try {
    const { userAddress } = req.body;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing user address'
      });
    }
    
    console.log(`Processing Starter NFT reward for ${userAddress}`);
    
    // Process Starter NFT reward
    const result = await adminWalletService.processNFTReward(userAddress, '🎯 Starter NFT');
    
    if (result.success) {
      res.json({
        success: true,
        rewardTxHash: result.rewardTxHash,
        nftType: '🎯 Starter NFT',
        message: 'Starter NFT sent successfully!'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Process NFT reward - Basic NFT (GASLESS)
 */
app.post('/api/rewards/nft/basic', async (req, res) => {
  try {
    const { userAddress } = req.body;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing user address'
      });
    }
    
    console.log(`Processing Basic NFT reward for ${userAddress}`);
    
    // Process Basic NFT reward
    const result = await adminWalletService.processNFTReward(userAddress, '⭐ Basic NFT');
    
    if (result.success) {
      res.json({
        success: true,
        rewardTxHash: result.rewardTxHash,
        nftType: '⭐ Basic NFT',
        message: 'Basic NFT sent successfully!'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Process NFT reward - Standard NFT (GASLESS)
 */
app.post('/api/rewards/nft/standard', async (req, res) => {
  try {
    const { userAddress } = req.body;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing user address'
      });
    }
    
    console.log(`Processing Standard NFT reward for ${userAddress}`);
    
    // Process Standard NFT reward
    const result = await adminWalletService.processNFTReward(userAddress, '🏅 Standard NFT');
    
    if (result.success) {
      res.json({
        success: true,
        rewardTxHash: result.rewardTxHash,
        nftType: '🏅 Standard NFT',
        message: 'Standard NFT sent successfully!'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Process NFT reward - VIP NFT (GASLESS)
 */
app.post('/api/rewards/nft/vip', async (req, res) => {
  try {
    const { userAddress } = req.body;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing user address'
      });
    }
    
    console.log(`Processing VIP NFT reward for ${userAddress}`);
    
    // Process VIP NFT reward
    const result = await adminWalletService.processNFTReward(userAddress, '👑 VIP NFT');
    
    if (result.success) {
      res.json({
        success: true,
        rewardTxHash: result.rewardTxHash,
        nftType: '👑 VIP NFT',
        message: 'VIP NFT sent successfully!'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Process NFT reward - Premium NFT (GASLESS)
 */
app.post('/api/rewards/nft/premium', async (req, res) => {
  try {
    const { userAddress } = req.body;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing user address'
      });
    }
    
    console.log(`Processing Premium NFT reward for ${userAddress}`);
    
    // Process Premium NFT reward
    const result = await adminWalletService.processNFTReward(userAddress, '💎 Premium NFT');
    
    if (result.success) {
      res.json({
        success: true,
        rewardTxHash: result.rewardTxHash,
        nftType: '💎 Premium NFT',
        message: 'Premium NFT sent successfully!'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Process NFT reward - Diamond NFT (GASLESS)
 */
app.post('/api/rewards/nft/diamond', async (req, res) => {
  try {
    const { userAddress } = req.body;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing user address'
      });
    }
    
    console.log(`Processing Diamond NFT reward for ${userAddress}`);
    
    // Process Diamond NFT reward
    const result = await adminWalletService.processNFTReward(userAddress, '💍 Diamond NFT');
    
    if (result.success) {
      res.json({
        success: true,
        rewardTxHash: result.rewardTxHash,
        nftType: '💍 Diamond NFT',
        message: 'Diamond NFT sent successfully!'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Check admin wallet balance
 */
app.get('/api/admin/balance', async (req, res) => {
  try {
    const allBalances = await adminWalletService.getAllBalances();
    const funds = await adminWalletService.checkAdminFunds();
    
    res.json({
      success: true,
      gianky: allBalances.gianky,
      matic: allBalances.matic,
      nft: allBalances.nft,
      giankyFormatted: allBalances.giankyFormatted,
      maticFormatted: allBalances.maticFormatted,
      nftFormatted: allBalances.nftFormatted,
      funds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Check admin wallet NFT status and balance
 */
app.get('/api/admin/nft-status', async (req, res) => {
  try {
    console.log('🔍 NFT Status Check Requested');
    
    const nftStatus = await adminWalletService.checkNFTStatus();
    
    if (nftStatus) {
      res.json({
        success: true,
        nftBalance: nftStatus.total,
        foundTokens: nftStatus.count,
        tokenIds: nftStatus.ownedTokens,
        message: `Found ${nftStatus.count} NFTs in admin wallet`
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to check NFT status'
      });
    }
    
  } catch (error) {
    console.error('NFT Status Check Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get detailed admin wallet NFT information
 */
app.get('/api/admin/nft-details', async (req, res) => {
  try {
    console.log('🔍 Detailed NFT Info Requested');
    
    const nftBalance = await adminWalletService.getAdminNFTBalance();
    
    res.json({
      success: true,
      totalBalance: nftBalance.total,
      ownedTokens: nftBalance.ownedTokens,
      tokenCount: nftBalance.count,
      details: {
        balance: nftBalance.total,
        foundTokens: nftBalance.count,
        tokenIds: nftBalance.ownedTokens,
        status: nftBalance.count > 0 ? 'Has NFTs' : 'No NFTs',
        sufficient: nftBalance.count >= 5 ? 'Sufficient' : 'Low'
      }
    });
    
  } catch (error) {
    console.error('NFT Details Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Quick NFT balance check (lightweight)
 */
app.get('/api/admin/nft-count', async (req, res) => {
  try {
    console.log('🔍 Quick NFT Count Requested');
    
    const nftBalance = await adminWalletService.getAdminNFTBalance();
    
    res.json({
      success: true,
      nftCount: nftBalance.count,
      totalBalance: nftBalance.total,
      message: `Admin wallet has ${nftBalance.count} NFTs`
    });
    
  } catch (error) {
    console.error('Quick NFT Count Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Debug NFT contract and find the issue
 */
app.get('/api/admin/nft-debug', async (req, res) => {
  try {
    console.log('🔍 NFT Debug Requested');
    
    // Get basic info
    const nftBalance = await adminWalletService.getAdminNFTBalance();
    
    // Try to find tokens manually
    console.log('🔍 Manual token search...');
    const manualSearch = await adminWalletService.findOwnedTokenIds();
    
    // Check contract directly
    let contractInfo = {};
    try {
      const totalSupply = await adminWalletService.nftContract.totalSupply();
      contractInfo.totalSupply = totalSupply.toString();
    } catch (error) {
      contractInfo.totalSupply = `Error: ${error.message}`;
    }
    
    res.json({
      success: true,
      debug: {
        contractBalance: nftBalance.total,
        foundTokens: nftBalance.count,
        manualSearch: manualSearch.length,
        tokenIds: manualSearch,
        contractInfo: contractInfo,
        adminAddress: adminWalletService.adminAddress,
        nftContract: adminWalletService.nftContract.target
      },
      message: 'Debug information collected'
    });
    
  } catch (error) {
    console.error('NFT Debug Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Gianky Game Backend is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * Provider health check endpoint
 */
app.get('/api/health/provider', async (req, res) => {
  try {
    console.log('🔍 Provider health check requested...');
    
    // Test provider connection
    const network = await adminWalletService.provider.getNetwork();
    const blockNumber = await adminWalletService.provider.getBlockNumber();
    
    res.json({
      success: true,
      provider: 'Connected',
      network: network.name,
      chainId: Number(network.chainId), // Convert BigInt to Number
      blockNumber: blockNumber.toString(), // Convert BigInt to String
      message: 'Provider is healthy'
    });
    
  } catch (error) {
    console.error('❌ Provider health check failed:', error.message);
    res.status(500).json({
      success: false,
      provider: 'Disconnected',
      error: error.message,
      message: 'Provider has issues'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('✅ Environment configuration is valid!');
  console.log('📊 Admin wallet:', adminWalletService.adminAddress);
  console.log('');
  console.log('🚀 Starting Gianky Game Backend...');
  console.log('🌐 Server will run on port', PORT);
  console.log('');
  console.log('✅ Server started successfully!');
  console.log('🎮 Ready to process gasless transactions');
  console.log('');
  console.log('📱 Frontend should connect to: http://localhost:' + PORT);
  console.log('🚀 Gianky Game Backend running on port', PORT);
  console.log('📊 Admin wallet:', adminWalletService.adminAddress);
});

module.exports = app;
