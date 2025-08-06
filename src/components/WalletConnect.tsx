'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [totalRewards, setTotalRewards] = useState<string[]>([]);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data from database when wallet is connected
  const fetchUserData = async (walletAddress: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/user?walletAddress=${encodeURIComponent(walletAddress)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      if (data.user) {
        setTotalRewards(data.user.rewards.map((r: any) => r.rewardName));
        setGamesPlayed(data.user.games.length);
      } else {
        setTotalRewards([]);
        setGamesPlayed(0);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setTotalRewards([]);
      setGamesPlayed(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data from localStorage when wallet is not connected
  const loadLocalStorageData = () => {
    if (typeof window !== 'undefined') {
      const savedRewards = localStorage.getItem('gianky-rewards');
      const savedGames = localStorage.getItem('gianky-games-played');
      
      if (savedRewards) {
        setTotalRewards(JSON.parse(savedRewards));
      }
      if (savedGames) {
        setGamesPlayed(parseInt(savedGames));
      }
    }
  };

  useEffect(() => {
    setIsMounted(true);
    
    // Load stats based on connection status
    if (isConnected && address) {
      fetchUserData(address);
    } else {
      loadLocalStorageData();
    }
  }, [isConnected, address]);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    if (typeof window === 'undefined') return false;
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
  };

  const handleConnect = async (connector: any) => {
    setIsConnecting(true);
    try {
      await connect({ connector });
      setShowWalletMenu(false);
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Calculate stats
  const nftCount = totalRewards.filter(reward => reward.includes('NFT')).length;
  const polygonTotal = totalRewards.filter(reward => reward.includes('Polygon')).reduce((sum, reward) => {
    const match = reward.match(/(\d+)\s+Polygon/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);
  const giankyTotal = totalRewards.filter(reward => reward.includes('Gianky')).reduce((sum, reward) => {
    const match = reward.match(/(\d+)\s+Gianky/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);
  const rareRewards = totalRewards.filter(reward => reward.includes('💎') || reward.includes('💍') || reward.includes('👑')).length;

  // Show loading state during SSR
  if (!isMounted) {
    return (
      <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Loading Wallet Options...</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Connected state
  if (isConnected) {
    return (
      <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-md">
        {/* Connection Status */}
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Wallet Connected!</h2>
          <p className="text-sm text-gray-600 mb-4 font-mono bg-gray-100 px-3 py-2 rounded">
            {formatAddress(address || '')}
          </p>
          <button
            onClick={handleDisconnect}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>

        {/* Stats when connected */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-600">Loading stats...</span>
          </div>
        ) : totalRewards.length > 0 ? (
          <div className="w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">📊 Your Progress</h3>
            
            {/* Mini Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-purple-600">{totalRewards.length}</div>
                <div className="text-xs text-purple-700">Total Rewards</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-600">{gamesPlayed}</div>
                <div className="text-xs text-blue-700">Games Played</div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalRewards.length / 20) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 text-center">
              Progress: {totalRewards.length}/20 rewards collected
            </p>

            {/* Mini Chart Visualization */}
            <div className="mt-4 bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-2 text-center">Reward Distribution</div>
              <div className="flex justify-between items-end h-16 gap-1">
                {/* NFT Bar */}
                <div className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-purple-500 to-purple-300 rounded-t transition-all duration-500"
                    style={{ height: `${Math.max((nftCount / Math.max(totalRewards.length, 1)) * 100, 5)}%` }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-1">NFT</div>
                  <div className="text-xs font-bold text-purple-600">{nftCount}</div>
                </div>
                
                {/* Polygon Bar */}
                <div className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t transition-all duration-500"
                    style={{ height: `${Math.max((polygonTotal / Math.max(polygonTotal + giankyTotal, 1)) * 100, 5)}%` }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-1">MATIC</div>
                  <div className="text-xs font-bold text-blue-600">{polygonTotal}</div>
                </div>
                
                {/* Gianky Bar */}
                <div className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-orange-500 to-orange-300 rounded-t transition-all duration-500"
                    style={{ height: `${Math.max((giankyTotal / Math.max(polygonTotal + giankyTotal, 1)) * 100, 5)}%` }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-1">GKY</div>
                  <div className="text-xs font-bold text-orange-600">{giankyTotal}</div>
                </div>
                
                {/* Rare Bar */}
                <div className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t transition-all duration-500"
                    style={{ height: `${Math.max((rareRewards / Math.max(totalRewards.length, 1)) * 100, 5)}%` }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-1">Rare</div>
                  <div className="text-xs font-bold text-green-600">{rareRewards}</div>
                </div>
              </div>
            </div>

            {/* Achievement Indicator */}
            {totalRewards.length >= 5 && (
              <div className="mt-3 text-center">
                <div className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs">
                  <span>🎖️</span>
                  <span className="font-bold">Collector Status!</span>
                </div>
              </div>
            )}

            {/* Database indicator */}
            <div className="mt-3 text-center">
              <div className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
                💾 Data from Database
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-sm text-gray-500 mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="text-2xl mb-2">🎮</div>
            <p className="font-semibold">No rewards yet!</p>
            <p>Start playing to earn your first rewards.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-md">
      {/* Stats Overview when disconnected */}
      {totalRewards.length > 0 && (
        <div className="w-full mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">📊 Your Progress</h3>
          
          {/* Mini Stats Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-purple-600">{totalRewards.length}</div>
              <div className="text-xs text-purple-700">Total Rewards</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-blue-600">{gamesPlayed}</div>
              <div className="text-xs text-blue-700">Games Played</div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((totalRewards.length / 20) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 text-center">
            Progress: {totalRewards.length}/20 rewards collected
          </p>

          {/* Mini Chart Visualization */}
          <div className="mt-4 bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-semibold text-gray-700 mb-2 text-center">Reward Distribution</div>
            <div className="flex justify-between items-end h-16 gap-1">
              {/* NFT Bar */}
              <div className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-purple-500 to-purple-300 rounded-t transition-all duration-500"
                  style={{ height: `${Math.max((nftCount / Math.max(totalRewards.length, 1)) * 100, 5)}%` }}
                ></div>
                <div className="text-xs text-gray-600 mt-1">NFT</div>
                <div className="text-xs font-bold text-purple-600">{nftCount}</div>
              </div>
              
              {/* Polygon Bar */}
              <div className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t transition-all duration-500"
                  style={{ height: `${Math.max((polygonTotal / Math.max(polygonTotal + giankyTotal, 1)) * 100, 5)}%` }}
                ></div>
                <div className="text-xs text-gray-600 mt-1">MATIC</div>
                <div className="text-xs font-bold text-blue-600">{polygonTotal}</div>
              </div>
              
              {/* Gianky Bar */}
              <div className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-orange-500 to-orange-300 rounded-t transition-all duration-500"
                  style={{ height: `${Math.max((giankyTotal / Math.max(polygonTotal + giankyTotal, 1)) * 100, 5)}%` }}
                ></div>
                <div className="text-xs text-gray-600 mt-1">GKY</div>
                <div className="text-xs font-bold text-orange-600">{giankyTotal}</div>
              </div>
              
              {/* Rare Bar */}
              <div className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t transition-all duration-500"
                  style={{ height: `${Math.max((rareRewards / Math.max(totalRewards.length, 1)) * 100, 5)}%` }}
                ></div>
                <div className="text-xs text-gray-600 mt-1">Rare</div>
                <div className="text-xs font-bold text-green-600">{rareRewards}</div>
              </div>
            </div>
          </div>

          {/* Achievement Indicator */}
          {totalRewards.length >= 5 && (
            <div className="mt-3 text-center">
              <div className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs">
                <span>🎖️</span>
                <span className="font-bold">Collector Status!</span>
              </div>
            </div>
          )}
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
      
      {error && (
        <div className="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          <strong>Connection Error:</strong> {error.message}
        </div>
      )}

      {/* Show MetaMask installation prompt if not installed */}
      {!isMetaMaskInstalled() && (
        <div className="w-full p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg text-sm">
          <strong>Install MetaMask:</strong> For the best experience, install MetaMask browser extension.
          <a 
            href="https://metamask.io/download/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-2 text-blue-600 underline hover:text-blue-800"
          >
            Install MetaMask →
          </a>
        </div>
      )}

      <div className="space-y-3 w-full">
        {connectors.map((connector) => {
          const isInjected = connector.name === 'Injected';
          const isWalletConnect = connector.name === 'WalletConnect';
          
          return (
            <button
              key={connector.id}
              onClick={() => handleConnect(connector)}
              disabled={isConnecting || isPending}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isInjected && '🦊'}
              {isWalletConnect && '🔗'}
              
              {isConnecting || isPending
                ? 'Connecting...'
                : isInjected 
                  ? `Connect with ${isMetaMaskInstalled() ? 'MetaMask' : 'Browser Wallet'}`
                  : `Connect with ${connector.name}`
              }
            </button>
          );
        })}
      </div>

      {(isConnecting || isPending) && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <p>Please check your wallet app...</p>
        </div>
      )}

      {/* Motivational Message */}
      {totalRewards.length === 0 ? (
        <div className="text-center text-xs text-gray-500 mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="text-2xl mb-2">🚀</div>
          <p className="font-semibold">Ready to start your Web3 journey?</p>
          <p>Connect your wallet and play games to earn rewards!</p>
        </div>
      ) : (
        <div className="text-center text-xs text-gray-500 mt-4">
          <p>🔒 Connect wallet to secure your {totalRewards.length} rewards</p>
        </div>
      )}
    </div>
  );
} 