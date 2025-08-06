'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

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
  const [isLoading, setIsLoading] = useState(false);

  // Load rewards from localStorage (for backward compatibility when wallet not connected)
  useEffect(() => {
    if (!isConnected && typeof window !== 'undefined') {
      const savedRewards = localStorage.getItem('gianky-rewards');
      if (savedRewards) {
        setTotalRewards(JSON.parse(savedRewards));
      }
    }
  }, [isConnected]);

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
      
      // Add reward to local state
      setTotalRewards(prev => [...prev, clickedCard.reward]);
      
      // Check for high-tier rewards for confetti
      if (clickedCard.reward.includes("💎") || clickedCard.reward.includes("💍") || clickedCard.reward.includes("👑")) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }, 600);
  };

  // Save game data to database
  const saveToDatabase = async (rewardName: string) => {
    if (!isConnected || !address) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          rewardName: rewardName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save game data');
      }

      const data = await response.json();
      console.log('Game saved to database:', data);
    } catch (error) {
      console.error('Error saving to database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Close modal and reset game
  const closeModal = async () => {
    if (selectedCard) {
      // Save to database if wallet is connected
      if (isConnected && address) {
        await saveToDatabase(selectedCard.reward);
      } else {
        // Save to localStorage if wallet not connected (backward compatibility)
        if (typeof window !== 'undefined') {
          localStorage.setItem('gianky-rewards', JSON.stringify(totalRewards));
          const currentGames = parseInt(localStorage.getItem('gianky-games-played') || '0');
          localStorage.setItem('gianky-games-played', (currentGames + 1).toString());
        }
      }
    }

    setShowModal(false);
    setGameStarted(false);
    setSelectedCard(null);
    setCards([]);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900 p-4 pt-20 pb-4 font-sans relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 opacity-20 animate-pulse"></div>
          <div className="flex justify-center items-center h-full text-6xl animate-bounce">
            🎉✨🎊
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gray-800">
            15-Card Reward Game
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Click Play to reveal 15 cards, then select one to claim your reward!
          </p>
          {isConnected ? (
            <div className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
              💾 Rewards saved to database
            </div>
          ) : (
            <div className="text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded-full inline-block">
              💡 Connect wallet to save rewards permanently
            </div>
          )}
        </div>

        {/* Play Button (shown when game not started) */}
        {!gameStarted && (
          <div className="text-center mb-6 flex-1 flex items-center justify-center">
            <button
              onClick={handlePlayClick}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🎮 Play
            </button>
          </div>
        )}

        {/* Cards Grid (shown when game started) */}
        {gameStarted && (
          <div className="flex-1 flex items-center justify-center">
            <div className="grid grid-cols-5 gap-4 w-full max-w-4xl mx-auto">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className={`relative w-full h-20 sm:h-24 lg:h-28 cursor-pointer transform transition-all duration-300 hover:scale-105 ${
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
                      <div className="text-2xl sm:text-3xl text-white">❓</div>
                    </div>

                    {/* Card Front */}
                    <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg border-2 border-white/20 flex items-center justify-center shadow-lg p-2">
                      <div className="text-center">
                        <div className="text-xs sm:text-sm font-bold text-white leading-tight">
                          {card.reward}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Instructions */}
        <div className="text-center text-gray-600 text-xs sm:text-sm max-w-2xl mx-auto">
          <p className="mb-1">🎯 Click Play to reveal cards • 💡 Select ONE card • 🎉 High-tier rewards trigger celebrations!</p>
        </div>
      </div>

      {/* Reward Modal */}
      {showModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center relative animate-bounce">
            {/* Close Button */}
            <button
              onClick={closeModal}
              disabled={isLoading}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center disabled:opacity-50"
            >
              ×
            </button>
            
            {/* Modal Content */}
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              Congratulations!
            </h2>
            <p className="text-base text-gray-600 mb-4">
              You won: <span className="font-bold text-purple-600">{selectedCard.reward}</span>
            </p>
            
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                <span>Saving to database...</span>
              </div>
            )}
            
            {/* Close Button */}
            <button
              onClick={closeModal}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              {isLoading ? 'Saving...' : 'Play Again'}
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