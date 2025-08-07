'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';

function HeaderInner() {
  const { address, isConnected } = useAccount();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-800 hover:text-purple-600 transition-colors font-carlito">
              Gianky Web3
            </Link>
            
            <nav className="flex space-x-6">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-purple-600 px-2 py-1 rounded text-sm font-medium transition-colors font-carlito"
              >
                Home
              </Link>
              <Link 
                href="/wheel" 
                className="text-gray-600 hover:text-purple-600 px-2 py-1 rounded text-sm font-medium transition-colors font-carlito"
              >
                Wheel
              </Link>
            </nav>
          </div>
          
          {isConnected && address && (
            <div className="flex items-center space-x-3">
              <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-1">
                <span className="text-xs text-purple-600 font-carlito font-medium">
                  {formatAddress(address)}
                </span>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function Header() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent SSR issues - only render wagmi hooks after mounting
  if (!isMounted) {
    return (
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-bold text-gray-800 hover:text-indigo-600 transition-colors font-carlito">
                Gianky Web3
              </Link>
              
              <nav className="flex space-x-6">
                <Link 
                  href="/" 
                  className="text-gray-600 hover:text-indigo-600 px-2 py-1 rounded text-sm font-medium transition-colors font-carlito"
                >
                  Home
                </Link>
                <Link 
                  href="/wheel" 
                  className="text-gray-600 hover:text-indigo-600 px-2 py-1 rounded text-sm font-medium transition-colors font-carlito"
                >
                  Wheel
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return <HeaderInner />;
} 