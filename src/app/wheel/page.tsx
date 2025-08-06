'use client';

import { useState, useEffect } from 'react';

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
  const [gameStarted, setGameStarted] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalRewards, setTotalRewards] = useState<string[]>([]);

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
      
      // Add reward to total rewards
      setTotalRewards(prev => [...prev, clickedCard.reward]);
      
      // Check for high-tier rewards for confetti
      if (clickedCard.reward.includes("💎") || clickedCard.reward.includes("💍") || clickedCard.reward.includes("👑")) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }, 600);
  };

  // Close modal and reset game
  const closeModal = () => {
    setShowModal(false);
    setGameStarted(false);
    setSelectedCard(null);
    setCards([]);
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
            <button
              onClick={handlePlayClick}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-12 rounded-lg text-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🎮 Play
            </button>
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
            
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              Play Again
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