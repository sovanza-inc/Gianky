'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';

function WalletConnectInner() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);



  const handleConnect = async (connector: unknown) => {
    setIsConnecting(true);
    try {
      connect({ connector });
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

  if (isConnected) {
    return (
      <div className="flex flex-col items-center space-y-3 p-4 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-1 font-carlito">🎉 Connected!</h2>
          <p className="text-xs text-green-600 mb-3 font-carlito">
            Ready to Play on Polygon
          </p>
          <button
            onClick={handleDisconnect}
            className="px-4 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors font-carlito"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-3 p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-bold text-gray-800 mb-3 font-carlito">Connect Wallet</h2>
      <div className="space-y-2 w-full">
        {connectors.map((connector) => {
          const displayName = connector.name === 'Injected' ? 'MetaMask' : connector.name;
          
          return (
            <button
              key={connector.id}
              onClick={() => handleConnect(connector)}
              disabled={isConnecting || isPending}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded text-sm hover:from-purple-700 hover:to-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-carlito"
            >
              {isConnecting || isPending
                ? 'Connecting...'
                : `Connect with ${displayName}`}
            </button>
          );
        })}
      </div>
      {(isConnecting || isPending) && (
        <p className="text-xs text-gray-600 font-carlito">Please check your wallet app...</p>
      )}
    </div>
  );
}

export default function WalletConnect() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent SSR issues - only render wagmi hooks after mounting
  if (!isMounted) {
    return (
      <div className="flex flex-col items-center space-y-3 p-4 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-3 font-carlito">Loading...</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return <WalletConnectInner />;
} 