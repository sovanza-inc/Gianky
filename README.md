# Gianky Web3 Wallet Connect

A Next.js application demonstrating Web3 wallet connection using WalletConnect and Wagmi.

## Features

- 🔗 Connect to Web3 wallets using WalletConnect
- 📱 Mobile wallet support
- 🎨 Modern, responsive UI with Tailwind CSS
- ⚡ Fast development with Next.js 14
- 🔒 Type-safe with TypeScript

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A WalletConnect Project ID (get one at [cloud.walletconnect.com](https://cloud.walletconnect.com/))

## Setup

1. **Clone and install dependencies:**
   ```bash
   cd gianky-web3
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your WalletConnect Project ID:
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```

3. **Get a WalletConnect Project ID:**
   - Go to [cloud.walletconnect.com](https://cloud.walletconnect.com/)
   - Sign up/Login
   - Create a new project
   - Copy the Project ID
   - Paste it in your `.env.local` file

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How to Use

1. Click "Connect with WalletConnect" button
2. Scan the QR code with your mobile wallet app (MetaMask, Trust Wallet, etc.)
3. Approve the connection in your wallet
4. Your wallet address will be displayed
5. Click "Disconnect Wallet" to disconnect

## Supported Wallets

- MetaMask
- Trust Wallet
- Rainbow
- Argent
- And many more WalletConnect-compatible wallets

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with WagmiConfig provider
│   ├── page.tsx            # Main page with wallet connection UI
│   └── globals.css         # Global styles
├── components/
│   ├── WalletConnect.tsx   # Wallet connection component
│   └── Providers.tsx       # WagmiConfig provider wrapper
└── lib/
    └── wagmi.ts            # Wagmi configuration
```

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Wagmi** - React hooks for Ethereum
- **WalletConnect** - Wallet connection protocol
- **Viem** - TypeScript interface for Ethereum

## Learn More

- [WalletConnect Documentation](https://docs.walletconnect.com/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Next.js Documentation](https://nextjs.org/docs)

## License

MIT
