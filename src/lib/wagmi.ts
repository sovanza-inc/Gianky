import { createConfig, http } from 'wagmi';
import { mainnet, polygon } from 'wagmi/chains';
import { walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, polygon],
  connectors: [
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
      showQrModal: true,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
  },
}); 