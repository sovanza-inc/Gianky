#!/bin/bash

# Gianky Contract Setup Script
echo "🎮 Setting up Gianky Contracts..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp env.local.example .env.local
    echo "✅ .env.local created from template"
else
    echo "ℹ️  .env.local already exists"
fi

# Display contract information
echo ""
echo "📋 Contract Information:"
echo "========================="
echo "NFT Contract: 0xdc91E2fD661E88a9a1bcB1c826B5579232fc9898"
echo "Token Contract: 0x370806781689e670f85311700445449ac7c3ff7a"
echo "Game Fee: 50 Gianky tokens"
echo "Network: Polygon"
echo ""

# Check if WalletConnect Project ID is set
if grep -q "your-walletconnect-project-id" .env.local; then
    echo "⚠️  IMPORTANT: You need to set your WalletConnect Project ID"
    echo "   1. Go to https://cloud.walletconnect.com/"
    echo "   2. Create a new project"
    echo "   3. Copy the Project ID"
    echo "   4. Update NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local"
    echo ""
fi

# Display next steps
echo "🚀 Next Steps:"
echo "=============="
echo "1. Update .env.local with your WalletConnect Project ID"
echo "2. Run: npm install"
echo "3. Run: npm run dev"
echo "4. Connect your wallet"
echo "5. Ensure you have Gianky tokens"
echo "6. Play the game!"
echo ""

echo "📖 For detailed instructions, see: CONTRACT_USAGE_GUIDE.md"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "ℹ️  Dependencies already installed"
fi

echo ""
echo "🎉 Setup complete! Ready to play Gianky!"
