'use client';

import WalletConnect from "@/components/WalletConnect";
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiService, TokenBalance, GameEligibility, UserStats, RewardDistribution } from '@/services/api';

function DashboardInner() {
  const { address, isConnected } = useAccount();
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [gameEligibility, setGameEligibility] = useState<GameEligibility | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [rewardDistribution, setRewardDistribution] = useState<RewardDistribution | null>(null);
  const [loading, setLoading] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Fetch user data when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      fetchUserData();
    }
  }, [isConnected, address]);

  const fetchUserData = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      // Fetch token balance and game eligibility
      const [balanceResult, eligibilityResult] = await Promise.all([
        apiService.getTokenBalance(address),
        apiService.checkGameEligibility(address)
      ]);
      
      setTokenBalance(balanceResult);
      setGameEligibility(eligibilityResult);

      // Fetch user stats and reward distribution
      try {
        const [statsResult, distributionResult] = await Promise.all([
          apiService.getUserStats(address),
          apiService.getRewardDistribution(address)
        ]);
        
        setUserStats(statsResult);
        setRewardDistribution(distributionResult);
      } catch (error) {
        console.log('User stats not available yet');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sample data for charts (fallback when no real data)
  const gameHistory = [
    { day: 'Mon', games: 3, rewards: 2, value: 15 },
    { day: 'Tue', games: 5, rewards: 3, value: 25 },
    { day: 'Wed', games: 2, rewards: 1, value: 8 },
    { day: 'Thu', games: 4, rewards: 2, value: 18 },
    { day: 'Fri', games: 6, rewards: 4, value: 32 },
    { day: 'Sat', games: 8, rewards: 5, value: 45 },
    { day: 'Sun', games: 4, rewards: 2, value: 22 },
  ];

  // Use real reward distribution if available, otherwise fallback
  const rewardTypes = rewardDistribution?.success && rewardDistribution.distribution
    ? Object.entries(rewardDistribution.distribution).map(([name, value], index) => ({
        name,
        value,
        color: ['#8B5CF6', '#3B82F6', '#10B981'][index % 3]
      }))
    : [
        { name: 'NFTs', value: 35, color: '#8B5CF6' },
        { name: 'Polygon', value: 40, color: '#3B82F6' },
        { name: 'Gianky Coins', value: 25, color: '#10B981' },
      ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 p-4 pt-20">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 font-carlito">
            Welcome to Gianky Web3
          </h1>
          <p className="text-gray-600 font-carlito">
            Your gateway to decentralized gaming and rewards
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Wallet Status Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 font-carlito">Wallet Status</h3>
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
            {isConnected ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 font-carlito">Connected Address:</p>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-indigo-700 font-carlito font-medium">
                    {formatAddress(address || '')}
                  </span>
                </div>
                
                {/* Token Balance */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 font-carlito">Gianky Balance:</span>
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    ) : (
                      <span className="font-bold text-gray-800 font-carlito">
                        {tokenBalance?.success ? `${tokenBalance.balance_human?.toFixed(2)} ${tokenBalance.symbol}` : 'Loading...'}
                      </span>
                    )}
                  </div>
                  
                  {/* Game Eligibility */}
                  {gameEligibility?.success && (
                    <div className={`text-xs px-2 py-1 rounded font-carlito ${
                      gameEligibility.can_play 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {gameEligibility.can_play 
                        ? `✅ Can play (${gameEligibility.required_fee} ${tokenBalance?.symbol} fee)`
                        : `❌ Need ${gameEligibility.shortfall} more ${tokenBalance?.symbol}`
                      }
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 font-carlito">No wallet connected</p>
                <WalletConnect />
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 font-carlito">Quick Actions</h3>
            <div className="space-y-3">
              <Link 
                href="/wheel" 
                className={`block w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 font-carlito text-center ${
                  gameEligibility?.success && gameEligibility.can_play
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
              >
                🎮 Play Reward Game
              </Link>
              {isConnected && (
                <button className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 font-carlito">
                  💰 View Rewards
                </button>
              )}
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 font-carlito">Game Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-carlito">Games Played:</span>
                <span className="text-lg font-bold text-indigo-600 font-carlito">
                  {userStats?.success ? userStats.total_games : '12'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-carlito">Rewards Won:</span>
                <span className="text-lg font-bold text-green-600 font-carlito">
                  {userStats?.success ? userStats.total_rewards : '6'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-carlito">Total Value:</span>
                <span className="text-lg font-bold text-purple-600 font-carlito">
                  {userStats?.success ? `$${(userStats.total_rewards || 0) * 7.5}` : '$45.20'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="text-xl font-bold text-gray-800 font-carlito">Recent Rewards</h3>
            <p className="text-sm text-gray-600 font-carlito">Your latest wins from the card game</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Sample rewards - in real app these would come from state/storage */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3 text-center text-sm text-gray-700 shadow-sm font-carlito">
              🎯 Starter NFT
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3 text-center text-sm text-gray-700 shadow-sm font-carlito">
              🪙 10 Polygon
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3 text-center text-sm text-gray-700 shadow-sm font-carlito">
              💰 20 Gianky Coin
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3 text-center text-sm text-gray-700 shadow-sm font-carlito">
              ⭐ Basic NFT
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3 text-center text-sm text-gray-700 shadow-sm font-carlito">
              🪙 25 Polygon
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3 text-center text-sm text-gray-700 shadow-sm font-carlito">
              💰 30 Gianky Coin
            </div>
          </div>
          <div className="text-center mt-4">
            <Link 
              href="/wheel" 
              className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 font-carlito text-sm"
            >
              Play More Games
            </Link>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Game Activity Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 font-carlito">Weekly Game Activity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={gameHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="games" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="rewards" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Reward Distribution Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 font-carlito">Reward Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={rewardTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {rewardTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>



        {/* Features Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 font-carlito">Platform Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="text-3xl mb-2">🎮</div>
              <h4 className="font-bold text-gray-800 mb-2 font-carlito">Gaming</h4>
              <p className="text-sm text-gray-600 font-carlito">Play exciting card games and win rewards</p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">💎</div>
              <h4 className="font-bold text-gray-800 mb-2 font-carlito">NFTs</h4>
              <p className="text-sm text-gray-600 font-carlito">Collect unique digital assets</p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">🪙</div>
              <h4 className="font-bold text-gray-800 mb-2 font-carlito">Tokens</h4>
              <p className="text-sm text-gray-600 font-carlito">Earn Polygon and Gianky tokens</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500 font-carlito">
            Powered by WalletConnect & Wagmi
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-carlito">Loading...</p>
        </div>
      </div>
    );
  }

  return <DashboardInner />;
}
