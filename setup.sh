#!/bin/bash

echo "🚀 Setting up Gianky Web3 Wallet Connect..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp env.example .env.local
    echo "✅ .env.local created!"
    echo "⚠️  Please edit .env.local and add your WalletConnect Project ID"
    echo "   Get your Project ID from: https://cloud.walletconnect.com/"
else
    echo "✅ .env.local already exists"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed!"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local and add your WalletConnect Project ID"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo ""
echo "Happy coding! 🚀" 