import { createConfig, http } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [polygon],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'f3b56a114e34a6b111ac8e6367c0733c',
      metadata: {
        name: 'Gianky Web3',
        description: 'Web3 gaming platform with gasless transactions',
        url: 'http://localhost:3000',
        icons: ['http://localhost:3000/favicon.ico']
      }
    }),
  ],
  transports: {
    [polygon.id]: http(),
  },
  multiInjectedProviderDiscovery: false,
}); 