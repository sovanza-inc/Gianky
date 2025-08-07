'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { apiService, GameEligibility, PaymentResult } from '@/services/api';

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
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalRewards, setTotalRewards] = useState<string[]>([]);
  const [gameSessionId, setGameSessionId] = useState<string>('');
  const [gameEligibility, setGameEligibility] = useState<GameEligibility | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'checking' | 'paid' | 'failed'>('idle');
  const [paymentError, setPaymentError] = useState<string>('');

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

  // Check game eligibility when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      checkGameEligibility();
    }
  }, [isConnected, address]);

  // Initialize game on component mount
  useEffect(() => {
    initializeCards();
    setGameSessionId(`game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  // Check if user can play the game
  const checkGameEligibility = async () => {
    if (!address) return;
    
    try {
      const eligibility = await apiService.checkGameEligibility(address);
      setGameEligibility(eligibility);
    } catch (error) {
      console.error('Error checking game eligibility:', error);
    }
  };

  // Handle game payment
  const handleGamePayment = async () => {
    if (!address) return;
    
    setPaymentStatus('checking');
    setPaymentError('');
    
    try {
      // For demo purposes, we'll simulate a successful payment
      // In a real implementation, you would need the user's private key or use a wallet connector
      setPaymentStatus('paid');
      setGameEligibility(prev => prev ? { ...prev, can_play: true } : null);
    } catch (error) {
      setPaymentStatus('failed');
      setPaymentError('Payment failed. Please try again.');
      console.error('Payment error:', error);
    }
  };

  // Handle card click
  const handleCardClick = (cardId: number) => {
    if (selectedCard) return;

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
    
    // Add reward to total rewards
    setTotalRewards(prev => [...prev, clickedCard.reward]);
    
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
  // Handle reward claiming (simplified)
  const handleClaimReward = () => {
    if (!selectedCard) return;
    
    // Add reward to total rewards
    setTotalRewards(prev => [...prev, selectedCard.reward]);
    
    // Close modal after claiming
    setTimeout(() => {
      setShowModal(false);
      setGameStarted(false);
      setSelectedCard(null);
      setCards([]);
    }, 2000);
  };

  // Close modal and reset game
  const closeModal = () => {
    setShowModal(false);
    setSelectedCard(null);
    initializeCards();
    setGameSessionId(`game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  };

  // Show payment screen if user can't play
  if (isConnected && gameEligibility && !gameEligibility.can_play) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">🎮</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-carlito">
              Gianky Card Game
            </h1>
            <p className="text-gray-600 mt-2 font-carlito">Payment Required to Play</p>
          </div>

          {/* Payment Required Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 font-carlito">Game Entry Fee Required</h2>
            <p className="text-gray-600 mb-6 font-carlito">
              To play the Gianky Card Game, you need to pay a fee of <span className="font-bold text-purple-600">50 Gianky tokens</span>.
            </p>
            
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-4">
                <span className="text-sm text-gray-600 font-carlito">Your Balance:</span>
                <span className="font-bold text-red-600 font-carlito">
                  {gameEligibility.current_balance?.toFixed(2)} Gianky
                </span>
                <span className="text-sm text-gray-600 font-carlito">Required:</span>
                <span className="font-bold text-green-600 font-carlito">
                  {gameEligibility.required_fee} Gianky
                </span>
              </div>
              <div className="mt-2 text-sm text-red-600 font-carlito">
                You need {gameEligibility.shortfall} more Gianky tokens to play
              </div>
            </div>

            {paymentError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 font-carlito">
                {paymentError}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleGamePayment}
                disabled={paymentStatus === 'checking'}
                className={`w-full px-6 py-3 rounded-lg font-bold font-carlito transition-colors ${
                  paymentStatus === 'checking'
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                }`}
              >
                {paymentStatus === 'checking' ? 'Processing Payment...' : 'Pay 50 Gianky & Play'}
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors font-carlito"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 text-gray-800 p-4 sm:p-6 lg:p-8 font-sans relative">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 opacity-20 animate-pulse"></div>
          <div className="flex justify-center items-center h-full text-6xl animate-bounce">
            🎉✨🎊
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="text-4xl mb-2">🎮</div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 font-carlito bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              15-Card Reward Game
            </h1>
            <p className="text-lg text-gray-600 font-carlito max-w-2xl mx-auto">
              Click Play to reveal 15 cards, then select one to claim your reward!
            </p>
          </div>
        </div>

                {/* Wallet Connection Notice */}
        {!isConnected && (
          <div className="text-center mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md mx-auto">
              <div className="text-3xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3 font-carlito">Wallet Required</h3>
              <p className="text-gray-600 font-carlito mb-6">Connect your wallet to claim rewards!</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-700 font-carlito">
                  💡 You can still play the game, but rewards won't be saved without a connected wallet.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2 font-carlito">Select Your Card</h3>
            <p className="text-gray-600 font-carlito">Click on any card to reveal your reward!</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {cards.map((card) => (
              <div
                key={card.id}
                className={`relative w-full aspect-square cursor-pointer transform transition-all duration-300 hover:scale-105 ${
                  selectedCard ? 'pointer-events-none' : ''
                } ${card.isSelected ? 'scale-110 ring-4 ring-yellow-400 ring-opacity-75' : ''}`}
                onClick={() => handleCardClick(card.id)}
              >
                {/* Card Container with flip effect */}
                <div className={`relative w-full h-full transition-transform duration-600 transform-style-preserve-3d ${
                  card.isFlipped ? 'rotate-y-180' : ''
                }`}>
                  
                  {/* Card Back */}
                  <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl border-2 border-white/20 flex items-center justify-center shadow-lg">
                    <div className="text-2xl sm:text-3xl lg:text-4xl">❓</div>
                  </div>

                  {/* Card Front */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl border-2 border-white/20 flex items-center justify-center shadow-lg p-2">
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
        </div>




      </div>

      {/* Reward Modal */}
      {showModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4 text-center relative animate-bounce">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
            
            {/* Modal Content */}
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 font-carlito">
              Congratulations!
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 font-carlito">
              You won: <span className="font-bold text-purple-600">{selectedCard.reward}</span>
            </p>
            
            {/* Action Buttons */}
            {isConnected && (
              <div className="space-y-2 mb-3">
                <button
                  onClick={handleClaimReward}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-6 rounded text-sm transition-all duration-300 transform hover:scale-105 font-carlito"
                >
                  🎁 Claim Reward
                </button>
                <p className="text-xs text-gray-500 font-carlito">
                  Reward added to your collection!
                </p>
              </div>
            )}
            
            {!isConnected && (
              <div className="mb-3 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-xs font-carlito">
                💡 Connect your wallet to claim this reward!
              </div>
            )}
            
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-6 rounded text-sm transition-all duration-300 transform hover:scale-105 font-carlito"
            >
              Close
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