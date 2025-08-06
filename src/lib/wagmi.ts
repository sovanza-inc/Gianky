import { createConfig, http } from 'wagmi';
import { mainnet, polygon } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, polygon],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'b4958e19-bb23-45df-bd57-d9843dcf9cbd',
      metadata: {
        name: 'Gianky Web3',
        description: 'Connect your wallet to get started with Web3',
        url: 'https://gianky.com',
        icons: ['https://gianky.com/favicon.ico'],
      },
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
  },
}); 