import WalletConnect from "@/components/WalletConnect";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 pt-20">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome to Web3
          </h1>
          <p className="text-gray-600">
            Connect your wallet to get started with Web3
          </p>
        </div>
        
        <WalletConnect />
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Powered by WalletConnect & Wagmi
          </p>
        </div>
      </div>
    </div>
  );
}
