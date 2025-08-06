'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { apiService } from '@/services/api';

interface Card {
  id: number;
  reward: string;
  isFlipped: boolean;
  isSelected: boolean;
}

const rewards = [
  // NFT Rewards (6 types)
  "🎯 Starter NFT",
  "⭐ Basic NFT", 
  "🏅 Standard NFT",
  "👑 VIP NFT",
  "💎 Premium NFT",
  "💍 Diamond NFT",
  // Polygon Token Rewards (4 types)
  "🪙 10 Polygon",
  "🪙 20 Polygon",
  "🪙 25 Polygon",
  "🪙 50 Polygon",
  // Gianky Coin Rewards (5 types)
  "💰 10 Gianky Coin",
  "💰 20 Gianky Coin",
  "💰 25 Gianky Coin",
  "💰 30 Gianky Coin",
  "💰 50 Gianky Coin"
];

export default function WheelPage() {
  const { address, isConnected } = useAccount();
  const [gameStarted, setGameStarted] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalRewards, setTotalRewards] = useState<string[]>([]);
  const [gameSessionId, setGameSessionId] = useState<string>('');
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // Initialize cards with shuffled rewards
  const initializeCards = () => {
    const shuffledRewards = [...rewards].sort(() => Math.random() - 0.5);
    const newCards = shuffledRewards.map((reward, index) => ({
      id: index,
      reward,
      isFlipped: false,
      isSelected: false
    }));
    setCards(newCards);
  };

  // Start the game
  const handlePlayClick = () => {
    initializeCards();
    setGameStarted(true);
    setSelectedCard(null);
    setClaimError(null);
    setClaimSuccess(null);
    setTransactionHash(null);
    
    // Generate new game session ID
    setGameSessionId(apiService.generateGameSessionId());
  };

  // Handle card click
  const handleCardClick = (cardId: number) => {
    if (!gameStarted || selectedCard) return;

    const clickedCard = cards.find(card => card.id === cardId);
    if (!clickedCard) return;

    // Flip the selected card
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId 
          ? { ...card, isFlipped: true, isSelected: true }
          : card
      )
    );

    setSelectedCard(clickedCard);
    
    // Show modal after card flip animation
    setTimeout(() => {
      setShowModal(true);
      
      // Check for high-tier rewards for confetti
      if (clickedCard.reward.includes("💎") || clickedCard.reward.includes("💍") || clickedCard.reward.includes("👑")) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }, 600);
  };

  // Claim reward via backend
  const handleClaimReward = async () => {
    if (!selectedCard || !address || !isConnected) {
      setClaimError('Wallet not connected');
      return;
    }

    if (!apiService.isAuthenticated()) {
      setClaimError('Please authenticate your wallet first');
      return;
    }

    setIsClaimingReward(true);
    setClaimError(null);

    try {
      const response = await apiService.claimReward({
        reward_type: selectedCard.reward.includes('NFT') ? 'nft' : 'token',
        reward_value: selectedCard.reward,
        game_session_id: gameSessionId,
      });

      if (response.success && response.data) {
        setClaimSuccess(`Successfully claimed ${selectedCard.reward}!`);
        setTransactionHash(response.data.transaction_hash || null);
        
        // Add reward to total rewards
        setTotalRewards(prev => [...prev, selectedCard.reward]);
      } else {
        setClaimError(response.error || 'Failed to claim reward');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      setClaimError('Failed to claim reward. Please try again.');
    } finally {
      setIsClaimingReward(false);
    }
  };

  // Close modal and reset game
  const closeModal = () => {
    setShowModal(false);
    setGameStarted(false);
    setSelectedCard(null);
    setCards([]);
    setClaimError(null);
    setClaimSuccess(null);
    setTransactionHash(null);
  };

  return (
    <div className="min-h-screen bg-[#222] text-white p-4 sm:p-8 lg:p-12 font-sans relative">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 opacity-20 animate-pulse"></div>
          <div className="flex justify-center items-center h-full text-6xl animate-bounce">
            🎉✨🎊
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            15-Card Reward Game
          </h1>
          <p className="text-lg text-gray-300 mb-6">
            Click Play to reveal 15 cards, then select one to claim your reward!
          </p>
        </div>

        {/* Play Button (shown when game not started) */}
        {!gameStarted && (
          <div className="text-center mb-8">
            {!isConnected ? (
              <div className="space-y-4">
                <p className="text-lg text-gray-300">Connect your wallet to play and claim rewards!</p>
                <button
                  disabled
                  className="bg-gray-500 text-white font-bold py-4 px-12 rounded-lg text-2xl cursor-not-allowed opacity-50"
                >
                  🎮 Connect Wallet First
                </button>
              </div>
            ) : !apiService.isAuthenticated() ? (
              <div className="space-y-4">
                <p className="text-lg text-gray-300">Authenticate your wallet to enable gasless rewards!</p>
                <button
                  disabled
                  className="bg-gray-500 text-white font-bold py-4 px-12 rounded-lg text-2xl cursor-not-allowed opacity-50"
                >
                  🔐 Authenticate First
                </button>
              </div>
            ) : (
              <button
                onClick={handlePlayClick}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-12 rounded-lg text-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                🎮 Play & Earn Rewards
              </button>
            )}
          </div>
        )}

        {/* Cards Grid (shown when game started) */}
        {gameStarted && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4 mb-8 max-w-4xl mx-auto">
            {cards.map((card) => (
              <div
                key={card.id}
                className={`relative w-full aspect-square cursor-pointer transform transition-all duration-300 hover:scale-105 ${
                  selectedCard ? 'pointer-events-none' : ''
                } ${card.isSelected ? 'scale-110' : ''}`}
                onClick={() => handleCardClick(card.id)}
              >
                {/* Card Container with flip effect */}
                <div className={`relative w-full h-full transition-transform duration-600 transform-style-preserve-3d ${
                  card.isFlipped ? 'rotate-y-180' : ''
                }`}>
                  
                  {/* Card Back */}
                  <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg border-2 border-white/20 flex items-center justify-center shadow-lg">
                    <div className="text-2xl sm:text-3xl lg:text-4xl">❓</div>
                  </div>

                  {/* Card Front */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg border-2 border-white/20 flex items-center justify-center shadow-lg p-2">
                    <div className="text-center">
                      <div className="text-xs sm:text-sm lg:text-base font-bold text-white leading-tight">
                        {card.reward}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total Rewards Summary */}
        {totalRewards.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 max-w-4xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 text-center">🏆 Total Rewards Won ({totalRewards.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {totalRewards.map((reward, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-2 text-center text-sm">
                  {reward}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Instructions */}
        <div className="text-center text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
          <p className="mb-2">🎯 Click Play to reveal 15 face-down cards</p>
          <p className="mb-2">💡 Select exactly ONE card to claim your reward</p>
          <p>🎉 High-tier rewards trigger special celebrations!</p>
        </div>
      </div>

      {/* Reward Modal */}
      {showModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full mx-4 text-center relative animate-bounce">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
            
            {/* Modal Content */}
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              Congratulations!
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-6">
              You won: <span className="font-bold text-purple-600">{selectedCard.reward}</span>
            </p>
            
            {/* Claim Status */}
            {claimError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                ❌ {claimError}
              </div>
            )}
            
            {claimSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                ✅ {claimSuccess}
                {transactionHash && (
                  <p className="text-xs mt-2">
                    <a 
                      href={`https://polygonscan.com/tx/${transactionHash}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-green-800"
                    >
                      View Transaction
                    </a>
                  </p>
                )}
              </div>
            )}
            
            {/* Action Buttons */}
            {!claimSuccess && isConnected && apiService.isAuthenticated() && (
              <div className="space-y-3 mb-4">
                <button
                  onClick={handleClaimReward}
                  disabled={isClaimingReward}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isClaimingReward ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Claiming...</span>
                    </div>
                  ) : (
                    '🎁 Claim Reward (Gasless)'
                  )}
                </button>
                <p className="text-xs text-gray-500">
                  No gas fees required! Reward will be sent to your wallet.
                </p>
              </div>
            )}
            
            {!isConnected && (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                💡 Connect your wallet to claim this reward!
              </div>
            )}
            
            {isConnected && !apiService.isAuthenticated() && (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                🔐 Authenticate your wallet to claim this reward!
              </div>
            )}
            
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              {claimSuccess ? 'Play Again' : 'Close'}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}