'use client';

import { WagmiConfig } from 'wagmi';
import { config } from '@/lib/wagmi';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <WagmiConfig config={config}>{children}</WagmiConfig>;
} 