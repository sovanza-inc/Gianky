#!/bin/bash

# Gianky Development Startup Script
# This script starts both the frontend and backend in development mode

echo "🚀 Starting Gianky Development Environment"
echo "========================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3.11+ and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js 18+ and try again."
    exit 1
fi

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found."
    echo "Please ensure you're running this from the project root."
    exit 1
fi

# Setup backend if not already done
if [ ! -f "backend/.env" ]; then
    echo "⚙️  Setting up backend for first time..."
    
    # Copy environment template
    if [ -f "backend/env.example" ]; then
        cp backend/env.example backend/.env
        echo "📝 Created backend/.env from template"
        echo "⚠️  Please edit backend/.env with your configuration before proceeding."
        read -p "Press Enter after you've configured backend/.env..."
    fi
    
    # Setup Python virtual environment
    echo "🐍 Setting up Python virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    
    # Run setup script
    echo "🗄️  Initializing database..."
    python scripts/setup.py
    
    cd ..
fi

# Setup frontend if not already done
if [ ! -f ".env.local" ] && [ -f ".env.local.example" ]; then
    echo "📝 Creating frontend .env.local from template..."
    cp .env.local.example .env.local
    echo "⚠️  Please edit .env.local with your WalletConnect Project ID"
fi

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start both frontend and backend
echo "🎮 Starting frontend and backend..."
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Use npm script to run both concurrently
npm run dev:full