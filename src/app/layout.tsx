import type { Metadata } from "next";
import { Carlito } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";

const carlito = Carlito({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-carlito",
});

export const metadata: Metadata = {
  title: "Gianky Web3 Wallet Connect",
  description: "Web3 wallet connection using WalletConnect in Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body
        className={`${carlito.variable} antialiased bg-white font-carlito`}
      >
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
