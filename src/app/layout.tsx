import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chains Planetary System — Powered by Nansen",
  description: "An astrophysical 3D planetary simulation of onchain capital, Smart Money orbits, and cross-chain liquidity dynamics powered by Nansen.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased bg-[#060911] text-stone-100">
      <body className="min-h-full flex flex-col bg-[#060911] text-stone-100 overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}

