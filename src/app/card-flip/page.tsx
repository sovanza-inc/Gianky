'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { contractService, ContractBalance, TransactionResult } from '@/services/contractService';
import { gaslessService, GaslessPaymentResult } from '@/services/gaslessService';
import { localStorageService } from '@/services/localStorageService';
import { CONTRACTS, GAME_CONFIG, NFT_REWARDS, TOKEN_REWARDS } from '@/lib/contracts';
import { polygon } from 'wagmi/chains';

// Define local interfaces to avoid API dependency
interface GameEligibility {
  success: boolean;
  can_play?: boolean;
  current_balance?: number;
  required_fee?: number;
  shortfall?: number;
  error?: string;
}

interface PaymentResult {
  success: boolean;
  tx_hash?: string;
  amount_paid?: number;
  new_balance?: number;
  error?: string;
}

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

export default function CardFlipPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalRewards, setTotalRewards] = useState<string[]>([]);
  const [gameSessionId, setGameSessionId] = useState<string>('');
  const [gameEligibility, setGameEligibility] = useState<GameEligibility | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'checking' | 'paid' | 'failed'>('idle');
  const [paymentError, setPaymentError] = useState<string>('');
  const [showNetworkAlert, setShowNetworkAlert] = useState(false);
  const [cardRevealed, setCardRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);

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

  // Check if user can play the game using contract
  const checkGameEligibility = async () => {
    if (!address) return;
    
    try {
      const contractBalance = await contractService.checkGameEligibility(address);
      
      // Convert to API format for compatibility
      const eligibility: GameEligibility = {
        success: true,
        can_play: contractBalance.isEligible,
        current_balance: parseFloat(contractBalance.tokenBalance),
        required_fee: GAME_CONFIG.ENTRY_FEE,
        shortfall: contractBalance.shortfall,
      };
      
      setGameEligibility(eligibility);
    } catch (error) {
      console.error('Error checking game eligibility:', error);
    }
  };

  // Handle game payment using contract
  const handleGamePayment = async () => {
    if (!address) return;
    
    setPaymentStatus('checking');
    setPaymentError('');
    
    try {
      // Pay game fee using contract
      const result = await contractService.payGameFee(address);
      
      if (result.success) {
      setPaymentStatus('paid');
      setGameEligibility(prev => prev ? { ...prev, can_play: true } : null);
        
        // Wait for transaction confirmation
        const confirmed = await contractService.waitForTransaction(result.hash!);
        if (!confirmed) {
          setPaymentError('Payment confirmed but transaction failed. Please try again.');
        }
      } else {
        setPaymentStatus('failed');
        setPaymentError(result.error || 'Payment failed. Please try again.');
      }
    } catch (error) {
      setPaymentStatus('failed');
      setPaymentError('Payment failed. Please try again.');
      console.error('Payment error:', error);
    }
  };

  // Handle card click - NEW FLOW: Flip first, then pay
  const handleCardClick = (cardId: number) => {
    if (selectedCard) return;
    if (allCardsRevealed) return; // Don't allow selection if all cards are revealed

    const clickedCard = cards.find(card => card.id === cardId);
    if (!clickedCard) return;

    // Don't allow selecting already revealed cards
    if (clickedCard.isFlipped) return;

    // Don't flip the card yet - just select it
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId 
          ? { ...card, isSelected: true }
          : card
      )
    );

    setSelectedCard(clickedCard);
    
    // Show payment modal first (card not revealed yet)
    setTimeout(() => {
      setShowModal(true);
      
      // Check network when modal opens
      if (isConnected && !checkNetwork()) {
        setShowNetworkAlert(true);
      }
    }, 300);
  };

  // Check if user is on correct network
  const checkNetwork = () => {
    return chainId === polygon.id;
  };

  // Switch to Polygon network
  const switchToPolygon = async () => {
    try {
      await switchChain({ chainId: polygon.id });
    } catch (error) {
      console.error('Failed to switch network:', error);
      setPaymentError('Please switch to Polygon network manually in your wallet.');
    }
  };

    // GASLESS FLOW: Admin pays for user (NO META MASK CONFIRMATION!)
  const handleGaslessPayAndClaim = async () => {
    if (!selectedCard || !address) return;
    
    setPaymentStatus('checking');
    setPaymentError('');
    
    try {
      // Determine reward type and amount
      let rewardType: string;
      let rewardAmount: number = 0;
      
      if (selectedCard.reward.includes('NFT')) {
        rewardType = 'NFT';
      } else if (selectedCard.reward.includes('Polygon')) {
        rewardType = 'Polygon';
        rewardAmount = parseInt(selectedCard.reward.match(/\d+/)?.[0] || '0');
      } else if (selectedCard.reward.includes('Gianky')) {
        rewardType = 'Gianky';
        rewardAmount = parseInt(selectedCard.reward.match(/\d+/)?.[0] || '0');
      } else {
        throw new Error('Unknown reward type');
      }
      
      // Process gasless payment (NO META MASK CONFIRMATION!)
      const result: GaslessPaymentResult = await gaslessService.processGamePayment(
        address,
        rewardType,
        rewardAmount,
        selectedCard.reward
      );
      
      if (result.success) {
        // Success! Payment and reward processed automatically
        setPaymentStatus('paid');
        setTotalRewards(prev => [...prev, selectedCard.reward]);
        setCardRevealed(true);
        
        // Record game activity in localStorage
        if (selectedCard) {
          const rewardType = selectedCard.reward.includes('NFT') ? 'NFT' : 
                           selectedCard.reward.includes('Polygon') ? 'Polygon' : 'Gianky';
          const rewardValue = parseInt(selectedCard.reward.match(/\d+/)?.[0] || '0');
          
          localStorageService.recordGameActivity({
            reward: selectedCard.reward,
            rewardType,
            rewardValue,
            cardId: selectedCard.id,
            success: true,
          });
        }
        
        // NOW flip the card to reveal the reward
        console.log('Flipping card to reveal reward:', selectedCard.reward);
        setCards(prevCards => {
          const updatedCards = prevCards.map(card => 
            card.id === selectedCard.id 
              ? { ...card, isFlipped: true }
              : card
          );
          console.log('Updated cards:', updatedCards);
          return updatedCards;
        });
      
      // Check for high-tier rewards for confetti
        if (selectedCard.reward.includes("💎") || selectedCard.reward.includes("💍") || selectedCard.reward.includes("👑")) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
        
        // Start countdown timer
        setTimeLeft(15);
        const countdownInterval = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              closeModalAndPlayAgain();
              return 15;
            }
            return prev - 1;
          });
        }, 1000);
        
      } else {
        setPaymentStatus('failed');
        setPaymentError(result.error || 'Payment failed. Please try again.');
      }
      
    } catch (error) {
      console.error('Gasless payment error:', error);
      setPaymentStatus('failed');
      setPaymentError('Transaction failed. Please try again.');
    }
  };

  // USER-PAID FLOW: User pays fee, then admin sends reward automatically!
  const handleUserPaidPayAndClaim = async () => {
    if (!selectedCard || !address) return;
    
    setPaymentStatus('checking');
    setPaymentError('');
    
    try {
      // Step 1: User pays the game fee from their wallet
      console.log('Step 1: User paying game fee...');
      const paymentResult = await contractService.payGameFeeFromUser(address);
      
      if (!paymentResult.success) {
        setPaymentStatus('failed');
        setPaymentError(paymentResult.error || 'Payment failed. Please try again.');
        return;
      }
      
      // Step 2: Wait for user payment confirmation
      console.log('Step 2: Waiting for payment confirmation...');
      const paymentConfirmed = await contractService.waitForTransaction(paymentResult.hash!);
      if (!paymentConfirmed) {
        setPaymentStatus('failed');
        setPaymentError('Payment confirmed but transaction failed. Please try again.');
        return;
      }
      
      // Step 3: Determine reward type and amount
      let rewardType: string;
      let rewardAmount: number = 0;
      
      if (selectedCard.reward.includes('NFT')) {
        rewardType = 'NFT';
      } else if (selectedCard.reward.includes('Polygon')) {
        rewardType = 'Polygon';
        rewardAmount = parseInt(selectedCard.reward.match(/\d+/)?.[0] || '0');
      } else if (selectedCard.reward.includes('Gianky')) {
        rewardType = 'Gianky';
        rewardAmount = parseInt(selectedCard.reward.match(/\d+/)?.[0] || '0');
      } else {
        throw new Error('Unknown reward type');
      }
      
      // Step 4: Admin wallet sends the reward automatically (using existing gasless system)
      console.log('Step 4: Admin sending reward...');
      const result: GaslessPaymentResult = await gaslessService.processGamePayment(
        address,
        rewardType,
        rewardAmount,
        selectedCard.reward
      );
      
      if (result.success) {
        // Success! User paid and admin sent reward automatically
        setPaymentStatus('paid');
        setTotalRewards(prev => [...prev, selectedCard.reward]);
        setCardRevealed(true);
        
        // Record game activity in localStorage
        if (selectedCard) {
          const rewardType = selectedCard.reward.includes('NFT') ? 'NFT' : 
                           selectedCard.reward.includes('Polygon') ? 'Polygon' : 'Gianky';
          const rewardValue = parseInt(selectedCard.reward.match(/\d+/)?.[0] || '0');
          
          localStorageService.recordGameActivity({
            reward: selectedCard.reward,
            rewardType,
            rewardValue,
            cardId: selectedCard.id,
            success: true,
          });
        }
        
        // NOW flip the card to reveal the reward
        console.log('Flipping card to reveal reward:', selectedCard.reward);
        setCards(prevCards => {
          const updatedCards = prevCards.map(card => 
            card.id === selectedCard.id 
              ? { ...card, isFlipped: true }
              : card
          );
          console.log('Updated cards:', updatedCards);
          return updatedCards;
        });
      
      // Check for high-tier rewards for confetti
        if (selectedCard.reward.includes("💎") || selectedCard.reward.includes("💍") || selectedCard.reward.includes("👑")) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
        
        // Start countdown timer
        setTimeLeft(15);
        const countdownInterval = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              closeModalAndPlayAgain();
              return 15;
            }
            return prev - 1;
          });
        }, 1000);
        
      } else {
        setPaymentStatus('failed');
        setPaymentError(result.error || 'Reward failed. Please try again.');
      }
      
    } catch (error) {
      console.error('User-paid payment error:', error);
      setPaymentStatus('failed');
      setPaymentError('Transaction failed. Please try again.');
    }
  };

  // USER-PAID PAYMENT HANDLER: User pays fee, then admin sends reward
  const handlePaymentAndClaim = async () => {
    console.log('💰 User will pay 5 Gianky from their wallet');
    await handleUserPaidPayAndClaim();
  };

  // Close modal and reset game
  const closeModal = () => {
    setShowModal(false);
    setSelectedCard(null);
    setCardRevealed(false);
    setTimeLeft(15);
    setPaymentStatus('idle');
    setPaymentError('');
  };

  // Close modal and allow new card selection (after reward is received)
  const closeModalAndPlayAgain = () => {
    setShowModal(false);
    setSelectedCard(null);
    setCardRevealed(false);
    setTimeLeft(15);
    setPaymentStatus('idle');
    setPaymentError('');
    // Don't reset cards - keep the revealed card and allow new selection
  };

  // Check if all cards have been revealed
  const allCardsRevealed = cards.every(card => card.isFlipped);

  // NEW FLOW: Users can always flip cards, payment happens when claiming reward
  // No need to block access to the game - payment happens after card flip

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
        {/* Header with Rewards Section */}
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
                  💡 You can still play the game, but rewards won&apos;t be saved without a connected wallet.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2 font-carlito">Select Your Card</h3>
            <p className="text-gray-600 font-carlito mb-2">Click on any card to reveal your reward!</p>
            <div className="text-sm text-gray-500 font-carlito">
              {cards.filter(card => !card.isFlipped).length} of {cards.length} cards remaining
            </div>
            {allCardsRevealed && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="text-center">
                  <div className="text-2xl mb-2">🎉</div>
                  <h4 className="font-bold text-green-600 mb-1 font-carlito">All Cards Revealed!</h4>
                  <p className="text-sm text-green-700 font-carlito mb-2">You&apos;ve collected all the rewards!</p>
                  <button
                    onClick={() => {
                      initializeCards();
                      setGameSessionId(`game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
                    }}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded text-sm transition-all duration-300 transform hover:scale-105 font-carlito"
                  >
                    🚀 Start New Game
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {cards.map((card) => (
              <div
                key={card.id}
                className={`relative w-full aspect-square transform transition-all duration-300 ${
                  card.isFlipped 
                    ? 'cursor-default' 
                    : allCardsRevealed
                      ? 'cursor-default'
                      : selectedCard 
                        ? 'pointer-events-none cursor-not-allowed' 
                        : 'cursor-pointer hover:scale-105'
                } ${card.isSelected ? 'scale-110 ring-4 ring-yellow-400 ring-opacity-75' : ''} ${
                  card.isFlipped ? 'ring-4 ring-green-400 ring-opacity-75' : ''
                }`}
                onClick={() => handleCardClick(card.id)}
              >
                {/* Card Container with flip effect */}
                <div className={`relative w-full h-full transition-transform duration-600 transform-style-preserve-3d ${
                  card.isFlipped ? 'rotate-y-180' : ''
                }`}>
                  
                  {/* Card Back */}
                  <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl border-2 border-white/20 flex items-center justify-center shadow-lg">
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl lg:text-5xl">❓</div>
                    </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-2 pt-8">
          <div className="bg-white rounded-xl shadow-2xl p-3 sm:p-4 max-w-sm w-full mx-2 text-center relative animate-fade-in border border-gray-100">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              ×
            </button>
            
            {/* Modal Content */}
            <div className="text-2xl sm:text-3xl mb-2">🎯</div>
            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-2 font-carlito">
              Card #{selectedCard.id + 1} Selected!
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 font-carlito">
              Pay <span className="font-bold text-purple-600">5 Gianky</span> from your wallet to reveal your reward!
            </p>
            <p className="text-xs text-gray-500 mb-2 font-carlito">
              You pay the fee, then your reward is sent automatically!
            </p>
            
            {/* NEW FLOW: Payment and Claim */}
            {isConnected && (
              <div className="space-y-3 mb-3">
                {/* Network Alert */}
                {showNetworkAlert && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-xs font-carlito mb-2">
                    <div className="flex items-center justify-between space-x-1">
                      <span className="text-xs">⚠️ Wrong Network!</span>
                      <button
                        onClick={switchToPolygon}
                        className="bg-red-600 text-white px-1 py-0.5 rounded text-xs hover:bg-red-700 whitespace-nowrap"
                      >
                        Switch
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Transaction Status */}
                {paymentStatus === 'checking' && (
                  <div className="bg-blue-100 border border-blue-400 text-blue-700 px-2 py-1 rounded text-xs font-carlito mb-2">
                    <div className="flex items-center justify-center space-x-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      <span className="text-xs font-semibold">Processing...</span>
                    </div>
                  </div>
                )}
                
                {paymentStatus === 'failed' && paymentError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-xs font-carlito mb-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm">⚠️</span>
                      <span className="text-xs font-semibold">Transaction Failed</span>
                    </div>
                  </div>
                )}
                
                {paymentStatus === 'paid' && (
                  <div className="space-y-2">
                    <div className="bg-green-100 border border-green-400 text-green-700 px-2 py-1 rounded text-xs font-carlito">
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-sm">✅</span>
                        <span className="text-xs font-semibold">Success!</span>
                      </div>
                    </div>
                    
                    {/* Reward Reveal */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-2">
                      <div className="text-center">
                        <div className="text-lg sm:text-xl mb-1">🎉</div>
                        <h3 className="font-bold text-purple-600 mb-1 text-xs font-carlito">Your Reward from Card #{selectedCard.id + 1}:</h3>
                        <div className="text-sm font-bold text-gray-800 font-carlito mb-1">
                          {selectedCard.reward}
                        </div>
                        <p className="text-xs text-gray-600 font-carlito">
                          Check your wallet! Auto-close in {timeLeft}s
                        </p>
                        {/* Countdown Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-1 rounded-full transition-all duration-1000"
                            style={{ width: `${(timeLeft / 15) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Manual Close Button */}
                    <button
                      onClick={closeModalAndPlayAgain}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded text-sm transition-all duration-300 transform hover:scale-105 font-carlito"
                    >
                      ✅ Close & Play Again
                    </button>
                  </div>
                )}
                
                {/* Payment Button */}
                <button
                  onClick={handlePaymentAndClaim}
                  disabled={paymentStatus === 'checking'}
                  className={`w-full font-bold py-2 px-4 rounded text-sm transition-colors duration-200 font-carlito ${
                    paymentStatus === 'checking'
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {paymentStatus === 'checking' 
                    ? 'Processing...' 
                    : `🚀 Pay 5 Gianky & Reveal Card #${selectedCard.id + 1}`
                  }
                </button>
                
                <p className="text-xs text-gray-500 font-carlito">
                  {showNetworkAlert 
                    ? 'Your wallet must be connected to Polygon network'
                    : 'Pay 5 Gianky from your wallet, then get your reward automatically!'
                  }
                </p>
              </div>
            )}
            
            {!isConnected && (
              <div className="mb-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-xs font-carlito">
                💡 Connect your wallet to claim this reward!
              </div>
            )}
            
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded text-sm transition-all duration-300 transform hover:scale-105 font-carlito"
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
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}