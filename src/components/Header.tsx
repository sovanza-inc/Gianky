'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const pathname = usePathname();

  const handleConnect = async (connector: any) => {
    try {
      await connect({ connector });
      setShowWalletMenu(false);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">G</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Gianky Web3</h1>
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Home
            </Link>
            <Link
              href="/wheel"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/wheel') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              🎮 Wheel
            </Link>
          </nav>

          {/* Mobile Navigation Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowWalletMenu(!showWalletMenu)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Connect Wallet Button */}
          <div className="relative">
            {isConnected ? (
              <div className="flex items-center space-x-4">
                {/* Connected Address */}
                <div className="hidden sm:block">
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg font-mono">
                    {formatAddress(address || '')}
                  </span>
                </div>
                
                {/* Disconnect Button */}
                <button
                  onClick={() => disconnect()}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <span>💼</span>
                  Connect Wallet
                </button>

                {/* Wallet Menu Dropdown */}
                {showWalletMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">Choose Wallet</p>
                    </div>
                    
                    {connectors.map((connector) => {
                      const isInjected = connector.name === 'Injected';
                      const isWalletConnect = connector.name === 'WalletConnect';
                      
                      return (
                        <button
                          key={connector.id}
                          onClick={() => handleConnect(connector)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm transition-colors"
                        >
                          <span className="text-lg">
                            {isInjected && '🦊'}
                            {isWalletConnect && '🔗'}
                          </span>
                          <span className="font-medium text-gray-900">
                            {isInjected ? 'MetaMask' : connector.name}
                          </span>
                        </button>
                      );
                    })}
                    
                    <div className="px-4 py-2 border-t border-gray-100 mt-2">
                      <p className="text-xs text-gray-500">
                        🦊 Browser Wallet • 🔗 Mobile via QR
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showWalletMenu && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="space-y-2">
              <Link
                href="/"
                onClick={() => setShowWalletMenu(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Home
              </Link>
              <Link
                href="/wheel"
                onClick={() => setShowWalletMenu(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/wheel') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                🎮 Wheel
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showWalletMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowWalletMenu(false)}
        />
      )}
    </header>
  );
} 