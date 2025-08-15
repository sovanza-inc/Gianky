'use client';

import WalletConnect from "@/components/WalletConnect";
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { contractService, ContractBalance, TransactionResult } from '@/services/contractService';
import { localStorageService, UserStats as LocalUserStats, WeeklyActivity, RewardDistribution as LocalRewardDistribution } from '@/services/localStorageService';
import { CONTRACTS } from '@/lib/contracts';

// Define local interfaces to avoid API dependency
interface TokenBalance {
  success: boolean;
  balance?: number;
  balance_human?: number;
  decimals?: number;
  symbol?: string;
  error?: string;
}

interface GameEligibility {
  success: boolean;
  can_play?: boolean;
  current_balance?: number;
  required_fee?: number;
  shortfall?: number;
  error?: string;
}

interface UserStats {
  success: boolean;
  total_rewards?: number;
  claimed_rewards?: number;
  total_transactions?: number;
  total_nfts?: number;
  total_games?: number;
  recent_rewards?: any[];
  recent_transactions?: any[];
  error?: string;
}

interface RewardDistribution {
  success: boolean;
  distribution?: Record<string, number>;
  error?: string;
}

function DashboardInner() {
  const { address, isConnected } = useAccount();
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [gameEligibility, setGameEligibility] = useState<GameEligibility | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [rewardDistribution, setRewardDistribution] = useState<RewardDistribution | null>(null);
  const [localStats, setLocalStats] = useState<LocalUserStats | null>(null);
  const [loading, setLoading] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Add token to wallet functions
  const addTokenToWallet = async (tokenType: 'nft' | 'gianky') => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const ethereum = (window as any).ethereum;
        
        if (tokenType === 'nft') {
          // Add NFT collection to MetaMask
          await ethereum.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC721',
              options: {
                address: CONTRACTS.NFT_CONTRACT,
                symbol: 'GIANKY',
                name: 'Gianky NFT Collection',
                image: 'https://via.placeholder.com/200x200/8B5CF6/FFFFFF?text=GIANKY+NFT'
              }
            }
          });
        } else {
          // Get token info from contract first
          const tokenInfo = await contractService.getTokenInfo();
          
          // Add Gianky token to MetaMask with correct contract info
          await ethereum.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20',
              options: {
                address: CONTRACTS.TOKEN_CONTRACT,
                symbol: tokenInfo.symbol || 'GKY',
                decimals: tokenInfo.decimals || 18,
                image: 'https://via.placeholder.com/200x200/10B981/FFFFFF?text=GKY'
              }
            }
          });
        }
      } catch (error) {
        console.error('Error adding token to wallet:', error);
        alert('Failed to add token to wallet. Please try again.');
      }
    } else {
      alert('MetaMask not found. Please install MetaMask to add tokens to your wallet.');
    }
  };

  // Fetch user data when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      fetchUserData();
    }
  }, [isConnected, address]);

  // Refresh stats when returning to the page
  useEffect(() => {
    const refreshStats = () => {
      if (isConnected && address) {
        const realStats = localStorageService.getUserStats();
        setLocalStats(realStats);
        
        // Update API format stats
        const apiStats: UserStats = {
          success: true,
          total_rewards: realStats.totalRewards,
          claimed_rewards: realStats.totalRewards,
          total_transactions: realStats.totalGames,
          total_nfts: realStats.totalNFTs,
          total_games: realStats.totalGames,
          recent_rewards: realStats.recentRewards,
          recent_transactions: [],
        };
        
        const apiDistribution: RewardDistribution = {
          success: true,
          distribution: {
            'NFTs': realStats.rewardDistribution.NFTs,
            'Polygon': realStats.rewardDistribution.Polygon,
            'Gianky Coins': realStats.rewardDistribution['Gianky Coins'],
          },
        };
        
        setUserStats(apiStats);
        setRewardDistribution(apiDistribution);
      }
    };

    // Refresh stats when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, address]);

  const fetchUserData = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      // Fetch token balance and game eligibility using contract service
      const contractBalance = await contractService.checkGameEligibility(address);
      const tokenInfo = await contractService.getTokenInfo();
      
      // Convert to API format for compatibility
      const balanceResult: TokenBalance = {
        success: true,
        balance: parseFloat(contractBalance.tokenBalance),
        balance_human: parseFloat(contractBalance.tokenBalance),
        decimals: tokenInfo.decimals,
        symbol: tokenInfo.symbol,
      };
      
      const eligibilityResult: GameEligibility = {
        success: true,
        can_play: contractBalance.isEligible,
        current_balance: parseFloat(contractBalance.tokenBalance),
        required_fee: 50, // 50 Gianky tokens
        shortfall: contractBalance.shortfall,
      };
      
      setTokenBalance(balanceResult);
      setGameEligibility(eligibilityResult);

      // Get real user stats from localStorage
      const realStats = localStorageService.getUserStats();
      setLocalStats(realStats);
      
      // Convert localStorage stats to API format for compatibility
      const apiStats: UserStats = {
        success: true,
        total_rewards: realStats.totalRewards,
        claimed_rewards: realStats.totalRewards,
        total_transactions: realStats.totalGames,
        total_nfts: realStats.totalNFTs,
        total_games: realStats.totalGames,
        recent_rewards: realStats.recentRewards,
        recent_transactions: [],
      };
      
      const apiDistribution: RewardDistribution = {
        success: true,
        distribution: {
          'NFTs': realStats.rewardDistribution.NFTs,
          'Polygon': realStats.rewardDistribution.Polygon,
          'Gianky Coins': realStats.rewardDistribution['Gianky Coins'],
        },
      };
      
      setUserStats(apiStats);
      setRewardDistribution(apiDistribution);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use real localStorage data for charts
  const gameHistory = localStats?.weeklyActivity || [
    { day: 'Mon', games: 0, rewards: 0, value: 0 },
    { day: 'Tue', games: 0, rewards: 0, value: 0 },
    { day: 'Wed', games: 0, rewards: 0, value: 0 },
    { day: 'Thu', games: 0, rewards: 0, value: 0 },
    { day: 'Fri', games: 0, rewards: 0, value: 0 },
    { day: 'Sat', games: 0, rewards: 0, value: 0 },
    { day: 'Sun', games: 0, rewards: 0, value: 0 },
  ];

  // Use real reward distribution from localStorage
  const rewardTypes = localStats?.rewardDistribution
    ? Object.entries(localStats.rewardDistribution).map(([name, value], index) => ({
        name,
        value,
        color: ['#8B5CF6', '#3B82F6', '#10B981'][index % 3]
      }))
    : [
        { name: 'NFTs', value: 0, color: '#8B5CF6' },
        { name: 'Polygon', value: 0, color: '#3B82F6' },
        { name: 'Gianky Coins', value: 0, color: '#10B981' },
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
                🎮 Play Card Flip Game
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

        {/* Dynamic Recent Rewards Section */}
        <div className="bg-gradient-to-br from-white via-purple-50 to-indigo-50 rounded-2xl shadow-xl border border-purple-200 p-6 mb-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4 shadow-lg">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 font-carlito mb-2">Your Recent Rewards</h3>
            <p className="text-sm text-gray-600 font-carlito">Amazing wins from your card game adventures!</p>
          </div>
          
          {localStats?.recentRewards && localStats.recentRewards.length > 0 ? (
            <div className="space-y-6">
              {/* NFT Rewards */}
              {localStats.recentRewards.filter(reward => reward.includes('NFT')).length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-purple-600 mb-3 font-carlito flex items-center">
                    <span className="mr-2 text-xl">🎨</span> NFT Rewards
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {localStats.recentRewards
                      .filter(reward => reward.includes('NFT'))
                      .slice(0, 4)
                      .map((reward, index) => (
                        <div key={index} className="bg-gradient-to-br from-purple-100 via-indigo-50 to-purple-200 border border-purple-300 rounded-xl p-3 text-center shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:rotate-1">
                          <div className="text-xl mb-1">
                            {reward.includes('VIP') ? '👑' : 
                             reward.includes('Premium') ? '💎' : 
                             reward.includes('Diamond') ? '💍' : 
                             reward.includes('Standard') ? '🏅' : 
                             reward.includes('Basic') ? '⭐' : '🎯'}
                          </div>
                          <div className="font-bold text-purple-700 font-carlito text-sm">{reward}</div>
                          <div className="text-xs text-purple-600 mt-1 opacity-75">
                            {reward.includes('VIP') ? 'Rare' : 
                             reward.includes('Premium') ? 'Premium' : 
                             reward.includes('Diamond') ? 'Diamond' : 
                             reward.includes('Standard') ? 'Standard' : 
                             reward.includes('Basic') ? 'Basic' : 'Starter'}
                          </div>
                          <button 
                            onClick={() => window.open(`https://polygonscan.com/address/${CONTRACTS.NFT_CONTRACT}`, '_blank')}
                            className="text-xs text-purple-500 hover:text-purple-700 mt-1 font-carlito cursor-pointer hover:underline"
                          >
                            View →
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Token Rewards */}
              {localStats.recentRewards.filter(reward => reward.includes('Polygon') || reward.includes('Gianky')).length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-blue-600 mb-3 font-carlito flex items-center">
                    <span className="mr-2 text-xl">💰</span> Token Rewards
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {localStats.recentRewards
                      .filter(reward => reward.includes('Polygon') || reward.includes('Gianky'))
                      .slice(0, 6)
                      .map((reward, index) => (
                        <div key={index} className={`border rounded-xl p-3 text-center shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-rotate-1 ${
                          reward.includes('Polygon') 
                            ? 'bg-gradient-to-br from-yellow-100 via-orange-50 to-yellow-200 border-yellow-300' 
                            : 'bg-gradient-to-br from-green-100 via-emerald-50 to-green-200 border-green-300'
                        }`}>
                          <div className="text-lg mb-1">
                            {reward.includes('Polygon') ? '🪙' : '💰'}
                          </div>
                          <div className={`font-bold font-carlito text-sm ${
                            reward.includes('Polygon') ? 'text-yellow-700' : 'text-green-700'
                          }`}>
                            {reward}
                          </div>
                          <div className={`text-xs mt-1 opacity-75 ${
                            reward.includes('Polygon') ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {reward.includes('Polygon') ? 'Network' : 'Game'}
                          </div>
                          <button 
                            onClick={() => window.open(`https://polygonscan.com/address/${CONTRACTS.TOKEN_CONTRACT}`, '_blank')}
                            className={`text-xs mt-1 font-carlito cursor-pointer hover:underline ${
                              reward.includes('Polygon') ? 'text-yellow-500 hover:text-yellow-700' : 'text-green-500 hover:text-green-700'
                            }`}
                          >
                            View →
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full mb-4">
                <span className="text-3xl">🎮</span>
              </div>
              <h4 className="text-lg font-bold text-gray-600 font-carlito mb-2">No Rewards Yet</h4>
              <p className="text-sm text-gray-500 font-carlito mb-4">Start playing card games to earn amazing rewards!</p>
              <Link 
                href="/card-flip" 
                className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 font-carlito text-sm shadow-md"
              >
                🎮 Start Playing
              </Link>
            </div>
          )}

          {/* Add to Wallet Section */}
          <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mt-6">
            <h4 className="text-lg font-bold text-blue-700 mb-3 font-carlito flex items-center">
              <span className="mr-2 text-xl">💡</span> Add to Your Wallet
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={() => addTokenToWallet('nft')}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 font-carlito text-sm flex items-center justify-center cursor-pointer shadow-md"
              >
                <span className="mr-2">🎨</span> Add NFT Collection
              </button>
              <button 
                onClick={() => addTokenToWallet('gianky')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 font-carlito text-sm flex items-center justify-center cursor-pointer shadow-md"
              >
                <span className="mr-2">💰</span> Add Gianky Token
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-3 font-carlito text-center">
              Add NFT collection and Gianky tokens to your MetaMask wallet. Polygon (MATIC) rewards show automatically.
            </p>
          </div>

          <div className="text-center mt-6">
            <Link 
              href="/card-flip" 
              className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2.5 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 font-carlito text-sm shadow-lg"
            >
              🎮 Play More Card Games
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
            <ResponsiveContainer width="100%" height={300}>
              <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <Pie
                  data={rewardTypes.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => {
                    if (percent === 0) return null;
                    return `${name} ${((percent || 0) * 100).toFixed(0)}%`;
                  }}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={1}
                >
                  {rewardTypes.filter(item => item.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, name]}
                  labelStyle={{ fontFamily: 'Carlito, sans-serif' }}
                />
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
