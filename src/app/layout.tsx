import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";

import type { Metadata } from "next";
import { Carlito } from "next/font/google";

const carlito = Carlito({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-carlito",
});

export const metadata: Metadata = {
  title: "Gianky Web3",
  description: "Connect your wallet to get started with Web3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${carlito.variable} font-carlito antialiased`}
      >
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
