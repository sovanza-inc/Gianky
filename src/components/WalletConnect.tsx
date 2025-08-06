'use client';

import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessage } = useSignMessage();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check if already authenticated
    if (isConnected && address && apiService.isAuthenticated()) {
      setIsAuthenticated(true);
    }
  }, [isConnected, address]);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (isConnected && address && !isAuthenticated && !isAuthenticating) {
      handleAuthenticate();
    }
  }, [isConnected, address, isAuthenticated, isAuthenticating]);

  const handleConnect = async (connector: any) => {
    setIsConnecting(true);
    setAuthError(null);
    try {
      await connect({ connector });
    } catch (error) {
      console.error('Connection failed:', error);
      setAuthError('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAuthenticate = async () => {
    if (!address) return;
    
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      // Generate authentication message
      const message = apiService.generateAuthMessage(address);
      
      // Sign message with wallet
      signMessage(
        { message },
        {
          onSuccess: async (signature) => {
            try {
              // Authenticate with backend
              const response = await apiService.connectWallet({
                wallet_address: address,
                signature,
                message,
              });

              if (response.success) {
                setIsAuthenticated(true);
                console.log('Authentication successful!');
              } else {
                setAuthError(response.error || 'Authentication failed');
              }
            } catch (error) {
              console.error('Backend authentication failed:', error);
              setAuthError('Backend authentication failed');
            }
          },
          onError: (error) => {
            console.error('Message signing failed:', error);
            setAuthError('Message signing failed');
          },
        }
      );
    } catch (error) {
      console.error('Authentication failed:', error);
      setAuthError('Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    apiService.clearToken();
    setIsAuthenticated(false);
    setAuthError(null);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Prevent SSR issues
  if (!isMounted) {
    return (
      <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  if (isConnected && isAuthenticated) {
    return (
      <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">🎉 Ready to Play!</h2>
          <p className="text-sm text-gray-600 mb-2">
            Address: {formatAddress(address || '')}
          </p>
          <p className="text-xs text-green-600 mb-4">
            ✅ Authenticated & Ready for Gasless Transactions
          </p>
          <button
            onClick={handleDisconnect}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (isConnected && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">🔐 Authentication Required</h2>
          <p className="text-sm text-gray-600 mb-4">
            Address: {formatAddress(address || '')}
          </p>
          
          {authError && (
            <p className="text-sm text-red-600 mb-4">
              ❌ {authError}
            </p>
          )}
          
          {isAuthenticating ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600">Authenticating...</p>
              <p className="text-xs text-gray-500">Please sign the message in your wallet</p>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleAuthenticate}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                🔐 Sign Message to Authenticate
              </button>
              <p className="text-xs text-gray-500">
                This will not cost any gas fees
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
      <div className="space-y-3">
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => handleConnect(connector)}
            disabled={!connector.ready || isConnecting || isPending}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isConnecting || isPending
              ? 'Connecting...'
              : `Connect with ${connector.name}`}
            {!connector.ready && ' (unsupported)'}
          </button>
        ))}
      </div>
      {(isConnecting || isPending) && (
        <p className="text-sm text-gray-600">Please check your wallet app...</p>
      )}
    </div>
  );
} 