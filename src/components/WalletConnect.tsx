'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleConnect = async (connector: any) => {
    setIsConnecting(true);
    try {
      await connect({ connector });
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

  if (isConnected) {
    return (
      <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Wallet Connected!</h2>
          <p className="text-sm text-gray-600 mb-4">
            Address: {formatAddress(address || '')}
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