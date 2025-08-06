'use client';

import WalletConnect from "@/components/WalletConnect";
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface DatabaseUser {
  id: string;
  walletAddress: string;
  games: Array<{
    id: string;
    rewardWon: string | null;
    playedAt: string;
  }>;
  rewards: Array<{
    id: string;
    rewardName: string;
    rewardType: string;
    rewardValue: number | null;
    earnedAt: string;
  }>;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const [totalRewards, setTotalRewards] = useState<string[]>([]);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [dbUser, setDbUser] = useState<DatabaseUser | null>(null);

  // Load data from database when wallet is connected
  const fetchUserData = async (walletAddress: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/user?walletAddress=${encodeURIComponent(walletAddress)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      if (data.user) {
        setDbUser(data.user);
        setTotalRewards(data.user.rewards.map((r: any) => r.rewardName));
        setGamesPlayed(data.user.games.length);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
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

  // Effect to load data based on wallet connection status
  useEffect(() => {
    if (isConnected && address) {
      fetchUserData(address);
    } else {
      setDbUser(null);
      loadLocalStorageData();
    }
  }, [isConnected, address]);

  // Calculate statistics
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
  const rarePercentage = totalRewards.length > 0 ? Math.round((rareRewards / totalRewards.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pt-20 pb-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Welcome & Wallet */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                  Welcome to Gianky Web3
                </h1>
                <p className="text-gray-600">
                  Your Web3 Gaming Dashboard
                </p>
              </div>
              
              <WalletConnect />
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Powered by WalletConnect & Wagmi
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6 flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">🎮 Quick Stats</h3>
              
              {/* Loading State */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Games Played:</span>
                    <span className="font-bold text-blue-600">{gamesPlayed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Rewards:</span>
                    <span className="font-bold text-purple-600">{totalRewards.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rare Rewards:</span>
                    <span className="font-bold text-green-600">{rareRewards}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-bold text-orange-600">{rarePercentage}%</span>
                  </div>
                </div>
              )}

              {/* Data Source Indicator */}
              <div className="mt-4 text-center">
                {isConnected ? (
                  <div className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
                    💾 Data from Database
                  </div>
                ) : (
                  <div className="text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded-full inline-block">
                    💡 Local Storage Data
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Dashboard */}
          <div className="lg:col-span-2 flex flex-col">
            
            {/* Dashboard Header */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">🏆 Your Gaming Dashboard</h2>
                <div className="flex justify-center items-center gap-4 text-sm">
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-full">
                    <span className="font-semibold text-purple-700">Total Rewards: {totalRewards.length}</span>
                  </div>
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-full">
                    <span className="font-semibold text-green-700">Games Played: {gamesPlayed}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">{nftCount}</div>
                <div className="text-xs text-gray-600">NFTs Collected</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">{polygonTotal}</div>
                <div className="text-xs text-gray-600">Polygon Tokens</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">{giankyTotal}</div>
                <div className="text-xs text-gray-600">Gianky Coins</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">{rarePercentage}%</div>
                <div className="text-xs text-gray-600">Rare Rate</div>
              </div>
            </div>

            {/* Visual Charts Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">📊 Reward Analytics</h3>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Collection Progress</span>
                  <span>{totalRewards.length}/50 rewards</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((totalRewards.length / 50) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-3 text-center">Reward Distribution</div>
                <div className="flex justify-between items-end h-20 gap-2">
                  {/* NFT Bar */}
                  <div className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-purple-500 to-purple-300 rounded-t transition-all duration-500"
                      style={{ height: `${Math.max((nftCount / Math.max(totalRewards.length, 1)) * 100, 5)}%` }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2">NFT</div>
                    <div className="text-xs font-bold text-purple-600">{nftCount}</div>
                  </div>
                  
                  {/* Polygon Bar */}
                  <div className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t transition-all duration-500"
                      style={{ height: `${Math.max((polygonTotal / Math.max(polygonTotal + giankyTotal, 1)) * 100, 5)}%` }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2">MATIC</div>
                    <div className="text-xs font-bold text-blue-600">{polygonTotal}</div>
                  </div>
                  
                  {/* Gianky Bar */}
                  <div className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-orange-500 to-orange-300 rounded-t transition-all duration-500"
                      style={{ height: `${Math.max((giankyTotal / Math.max(polygonTotal + giankyTotal, 1)) * 100, 5)}%` }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2">GKY</div>
                    <div className="text-xs font-bold text-orange-600">{giankyTotal}</div>
                  </div>
                  
                  {/* Rare Bar */}
                  <div className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t transition-all duration-500"
                      style={{ height: `${Math.max((rareRewards / Math.max(totalRewards.length, 1)) * 100, 5)}%` }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2">Rare</div>
                    <div className="text-xs font-bold text-green-600">{rareRewards}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rewards Collection */}
            {totalRewards.length > 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">🎁 Recent Rewards</h3>
                
                {/* Rewards Categories */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* NFT Collection */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-bold text-purple-800 mb-2 text-center text-sm">🎯 NFT Collection</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {totalRewards.filter(reward => reward.includes('NFT')).slice(-5).map((reward, index) => (
                        <div key={index} className="bg-white rounded p-2 text-center text-xs font-medium text-purple-700 shadow-sm">
                          {reward}
                        </div>
                      ))}
                      {totalRewards.filter(reward => reward.includes('NFT')).length === 0 && (
                        <p className="text-xs text-purple-600 text-center italic">No NFTs yet</p>
                      )}
                    </div>
                  </div>

                  {/* Polygon Tokens */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-bold text-blue-800 mb-2 text-center text-sm">🪙 Polygon Tokens</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {totalRewards.filter(reward => reward.includes('Polygon')).slice(-5).map((reward, index) => (
                        <div key={index} className="bg-white rounded p-2 text-center text-xs font-medium text-blue-700 shadow-sm">
                          {reward}
                        </div>
                      ))}
                      {totalRewards.filter(reward => reward.includes('Polygon')).length === 0 && (
                        <p className="text-xs text-blue-600 text-center italic">No Polygon yet</p>
                      )}
                    </div>
                  </div>

                  {/* Gianky Coins */}
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-bold text-orange-800 mb-2 text-center text-sm">💰 Gianky Coins</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {totalRewards.filter(reward => reward.includes('Gianky')).slice(-5).map((reward, index) => (
                        <div key={index} className="bg-white rounded p-2 text-center text-xs font-medium text-orange-700 shadow-sm">
                          {reward}
                        </div>
                      ))}
                      {totalRewards.filter(reward => reward.includes('Gianky')).length === 0 && (
                        <p className="text-xs text-orange-600 text-center italic">No Gianky yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Achievement Badges */}
                <div className="mt-4 text-center space-y-2">
                  {totalRewards.length >= 5 && (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full shadow-lg text-sm">
                      <span>🎖️</span>
                      <span className="font-bold">Collector!</span>
                    </div>
                  )}
                  {rareRewards >= 3 && (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full shadow-lg text-sm ml-2">
                      <span>👑</span>
                      <span className="font-bold">Legendary Hunter!</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎮</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Start Your Journey!</h3>
                  <p className="text-gray-600 mb-4">Play the 15-Card Reward Game to start collecting rewards!</p>
                  <a 
                    href="/wheel" 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    🎮 Play Now
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
