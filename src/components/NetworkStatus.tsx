'use client';

import React, { useState, useEffect } from 'react';
import { contractService } from '@/services/contractService';

interface NetworkStatusProps {
  onNetworkCheck?: (isCorrect: boolean) => void;
}

export default function NetworkStatus({ onNetworkCheck }: NetworkStatusProps) {
  const [networkInfo, setNetworkInfo] = useState<{
    chainId: number;
    networkName: string;
    isCorrect: boolean;
    needsSwitch: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [switchResult, setSwitchResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    checkNetwork();
  }, []);

  const checkNetwork = async () => {
    try {
      setIsLoading(true);
      const info = await contractService.detectUserNetwork();
      setNetworkInfo(info);
      onNetworkCheck?.(info.isCorrect);
    } catch (error) {
      console.error('Error checking network:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      setIsLoading(true);
      const result = await contractService.switchToPolygonNetwork();
      setSwitchResult(result);
      
      if (result.success) {
        // Wait a bit then recheck
        setTimeout(() => {
          checkNetwork();
        }, 2000);
      }
    } catch (error) {
      console.error('Error switching network:', error);
      setSwitchResult({
        success: false,
        message: 'Failed to switch network. Please switch manually.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-700 text-sm">Checking network...</span>
        </div>
      </div>
    );
  }

  if (!networkInfo) {
    return null;
  }

  if (networkInfo.isCorrect) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-green-600">✅</span>
          <span className="text-green-700 text-sm font-medium">
            Connected to {networkInfo.networkName} (Chain ID: {networkInfo.chainId})
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="space-y-3">
        {/* Network Warning */}
        <div className="flex items-start space-x-2">
          <span className="text-red-600 text-lg">⚠️</span>
          <div className="flex-1">
            <h4 className="text-red-800 font-medium text-sm mb-1">
              Wrong Network Detected
            </h4>
            <p className="text-red-700 text-sm">
              You&apos;re connected to <strong>{networkInfo.networkName}</strong> (Chain ID: {networkInfo.chainId}), 
              but Gianky requires <strong>Polygon Mainnet</strong> (Chain ID: 137).
            </p>
          </div>
        </div>

        {/* Switch Button */}
        <button
          onClick={handleSwitchNetwork}
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
        >
          {isLoading ? 'Switching...' : 'Switch to Polygon Mainnet'}
        </button>

        {/* Switch Result */}
        {switchResult && (
          <div className={`p-3 rounded-lg text-sm ${
            switchResult.success 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {switchResult.message}
          </div>
        )}

        {/* Manual Instructions */}
        <details className="text-sm">
          <summary className="cursor-pointer text-red-700 font-medium hover:text-red-800">
            Manual Network Switch Instructions
          </summary>
          <div className="mt-2 p-3 bg-red-100 rounded-lg text-red-800 text-xs font-mono whitespace-pre-line">
            {contractService.getNetworkSwitchingInstructions()}
          </div>
        </details>
      </div>
    </div>
  );
}

// Hook for checking network status
export function useNetworkStatus() {
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const info = await contractService.detectUserNetwork();
        setIsCorrectNetwork(info.isCorrect);
      } catch (error) {
        console.error('Error checking network:', error);
        setIsCorrectNetwork(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkNetwork();
  }, []);

  return { isCorrectNetwork, isLoading };
}
