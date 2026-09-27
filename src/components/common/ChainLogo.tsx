"use client";

import React, { useState } from "react";

interface ChainLogoProps {
  chain: string;
  size?: number | string;
  className?: string;
}

// Official high-resolution blockchain logos sourced directly from official chain websites & verified brand kits
// Prioritizes official domain SVGs and 512x512 crisp transparent brand assets (no low-res rsz thumbnails)
const CHAIN_LOGO_URLS: Record<string, string[]> = {
  ethereum: [
    "https://ethereum.org/images/assets/svgs/eth-diamond-purple.svg",
    "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  ],
  eth: [
    "https://ethereum.org/images/assets/svgs/eth-diamond-purple.svg",
    "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  ],
  solana: [
    "https://solana.com/src/img/branding/solanaLogoMark.svg",
    "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    "https://cryptologos.cc/logos/solana-sol-logo.png",
  ],
  sol: [
    "https://solana.com/src/img/branding/solanaLogoMark.svg",
    "https://assets.coingecko.com/coins/images/4128/large/solana.png",
  ],
  arbitrum: [
    "https://docs.arbitrum.io/img/logo.svg",
    "https://assets.coingecko.com/coins/images/16547/large/arbitrum_logo.png",
    "https://cryptologos.cc/logos/arbitrum-arb-logo.png",
  ],
  arb: [
    "https://docs.arbitrum.io/img/logo.svg",
    "https://assets.coingecko.com/coins/images/16547/large/arbitrum_logo.png",
  ],
  base: [
    "https://assets.coingecko.com/asset_platforms/images/131/large/base.jpeg",
    "https://cryptologos.cc/logos/base-network-logo.png",
    "https://raw.githubusercontent.com/base-org/brand-kit/main/logo/symbol/Base_Symbol_Blue.svg",
  ],
  bnb: [
    "https://upload.wikimedia.org/wikipedia/commons/e/e8/Binance_Logo.svg",
    "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
    "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  ],
  binance: [
    "https://upload.wikimedia.org/wikipedia/commons/e/e8/Binance_Logo.svg",
    "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
  ],
  bsc: [
    "https://upload.wikimedia.org/wikipedia/commons/e/e8/Binance_Logo.svg",
    "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
  ],
  polygon: [
    "https://polygon.technology/favicon.svg",
    "https://assets.coingecko.com/coins/images/4713/large/polygon.png",
    "https://cryptologos.cc/logos/polygon-matic-logo.png",
  ],
  pol: [
    "https://polygon.technology/favicon.svg",
    "https://assets.coingecko.com/coins/images/4713/large/polygon.png",
  ],
  matic: [
    "https://polygon.technology/favicon.svg",
    "https://assets.coingecko.com/coins/images/4713/large/polygon.png",
  ],
  avalanche: [
    "https://upload.wikimedia.org/wikipedia/commons/b/bd/Avalanche_Blockchain_Logo.svg",
    "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
    "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  ],
  avax: [
    "https://upload.wikimedia.org/wikipedia/commons/b/bd/Avalanche_Blockchain_Logo.svg",
    "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
  ],
  optimism: [
    "https://assets.coingecko.com/coins/images/25244/large/Optimism.png",
    "https://cryptologos.cc/logos/optimism-ethereum-op-logo.png",
  ],
  op: [
    "https://assets.coingecko.com/coins/images/25244/large/Optimism.png",
    "https://cryptologos.cc/logos/optimism-ethereum-op-logo.png",
  ],
  hyperevm: [
    "/chains/hyperevm.png",
    "https://assets.coingecko.com/markets/images/1070/large/hyperliquid.png",
    "https://hyperliquid.xyz/favicon.ico",
  ],
  "hyper-evm": [
    "/chains/hyperevm.png",
    "https://assets.coingecko.com/markets/images/1070/large/hyperliquid.png",
  ],
  "hyper evm": [
    "/chains/hyperevm.png",
    "https://assets.coingecko.com/markets/images/1070/large/hyperliquid.png",
  ],
  hyperliquid: [
    "/chains/hyperevm.png",
    "https://assets.coingecko.com/markets/images/1070/large/hyperliquid.png",
    "https://hyperliquid.xyz/favicon.ico",
  ],
  hype: [
    "/chains/hyperevm.png",
    "https://assets.coingecko.com/markets/images/1070/large/hyperliquid.png",
  ],
  mantle: [
    "https://assets.coingecko.com/coins/images/30980/large/token-logo.png",
    "https://cryptologos.cc/logos/mantle-mnt-logo.png",
  ],
  mnt: [
    "https://assets.coingecko.com/coins/images/30980/large/token-logo.png",
  ],
  sonic: [
    "https://www.soniclabs.com/sonic-logo.svg",
    "https://assets.coingecko.com/coins/images/38108/large/Sonic_Token.png",
  ],
  s: [
    "https://www.soniclabs.com/sonic-logo.svg",
    "https://assets.coingecko.com/coins/images/38108/large/Sonic_Token.png",
  ],
};

// High-fidelity, official brand vector fallbacks if network CDN fails or offline
function OfficialVectorFallback({ chain, className }: { chain: string; className: string }) {
  const c = chain.toLowerCase().trim();

  if (c === "solana" || c === "sol") {
    return (
      <svg viewBox="0 0 101 88" fill="none" className={className}>
        <defs>
          <linearGradient id="solGradOfficial" x1="8.5" y1="90" x2="89" y2="-3" gradientUnits="userSpaceOnUse">
            <stop offset="0.08" stopColor="#9945FF" />
            <stop offset="0.5" stopColor="#5497D5" />
            <stop offset="0.97" stopColor="#19FB9B" />
          </linearGradient>
        </defs>
        <path d="M100.5 69.4L83.8 86.8c-.7.8-1.8 1.2-2.8 1.2H1.9c-.8 0-1.6-.7-1.9-1.5-.2-.7-.1-1.5.5-2.1L17.2 67c.7-.8 1.8-1.2 2.8-1.2h79c.8 0 1.6.7 1.9 1.5.3.7.2 1.5-.4 2.1zM83.8 34.3c-.7-.8-1.8-1.2-2.8-1.2H1.9c-.8 0-1.6.7-1.9 1.5-.2.7-.1 1.5.5 2.1L17.2 54c.7.8 1.8 1.2 2.8 1.2h79c.8 0 1.6-.7 1.9-1.5.3-.7.2-1.5-.4-2.1L83.8 34.3zM1.9 21.8h79.1c1 0 2.1-.4 2.8-1.2L100.5 3.2c.5-.5.7-1.2.5-1.9-.3-.8-1-1.3-1.9-1.3H20c-1 0-2.1.4-2.8 1.2L.5 18.6C0 19.2-.1 20 .2 20.7c.3.7 1 1.1 1.7 1.1z" fill="url(#solGradOfficial)" />
      </svg>
    );
  }

  if (c === "ethereum" || c === "eth") {
    return (
      <svg viewBox="0 0 1920 1920" fill="none" className={className}>
        <path d="m959.8 80.7-539.7 895.6 539.7-245.3z" fill="#8a92b2" />
        <path d="m959.8 731-539.7 245.3 539.7 319.1z" fill="#62688f" />
        <path d="m1499.6 976.3-539.8-895.6v650.3z" fill="#62688f" />
        <path d="m959.8 1295.4 539.8-319.1-539.8-245.3z" fill="#454a75" />
        <path d="m420.1 1078.7 539.7 760.6v-441.7z" fill="#8a92b2" />
        <path d="m959.8 1397.6v441.7l540.1-760.6z" fill="#62688f" />
      </svg>
    );
  }

  if (c === "arbitrum" || c === "arb") {
    return (
      <svg viewBox="0 0 1080 1218.5" fill="none" className={className}>
        <path fill="#213147" d="M41,370.4v477.7c0,30.5,16.3,58.7,42.7,73.9l413.7,238.9c26.4,15.2,58.9,15.2,85.3,0L996.4,922 c26.4-15.2,42.7-43.4,42.7-73.9V370.4c0-30.5-16.3-58.7-42.7-73.9L582.7,57.6c-26.4-15.2-58.9-15.2-85.3,0L83.6,296.5 C57.2,311.7,41,339.9,41,370.4z" />
        <path fill="#12AAFF" d="M630.3,701.9l-59,161.8c-1.6,4.5-1.6,9.4,0,13.9L672.8,1156l117.4-67.8L649.3,701.9 C646.1,693,633.5,693,630.3,701.9z" />
        <path fill="#12AAFF" d="M748.6,429.8c-3.2-8.9-15.8-8.9-19,0l-59,161.8c-1.6,4.5-1.6,9.4,0,13.9l166.3,455.8l117.4-67.8 L748.6,429.8z" />
        <path fill="#FFFFFF" d="M502.3,313.8H388.8c-8.5,0-16.1,5.3-19,13.3l-243.3,667l117.4,67.8l267.9-734.5 C514.3,320.8,509.4,313.8,502.3,313.8z" />
        <path fill="#FFFFFF" d="M700.9,313.8H587.4c-8.5,0-16.1,5.3-19,13.3l-277.8,761.6l117.4,67.8l302.4-829.1 C712.8,320.8,707.9,313.8,700.9,313.8z" />
      </svg>
    );
  }

  if (c === "bnb" || c === "binance" || c === "bsc") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path fill="#F0B90B" d="m16.624 13.92 2.718 2.716-7.353 7.353-7.353-7.352 2.717-2.717 4.636 4.66zm4.637-4.636L24 12l-2.715 2.716L18.568 12zm-9.272 0 2.716 2.692-2.717 2.717L9.272 12zm-9.273 0L5.41 12 2.718 14.692 0 12zM11.99.012l7.35 7.328-2.717 2.715L11.99 5.42 7.354 10.08 4.637 7.364z" />
      </svg>
    );
  }

  if (c === "polygon" || c === "pol" || c === "matic") {
    return (
      <svg viewBox="0 0 25 25" fill="none" className={className}>
        <path d="M17.41 1.22363L10.5949 5.13771V17.3537L6.8346 19.5335L3.05135 17.352V12.9906L6.8346 10.8303L9.2672 12.241V8.71235L6.81339 7.31926L0 11.2775V19.1075L6.83637 23.0445L13.6498 19.1075V6.89321L17.433 4.71165L21.2145 6.89321V11.2351L17.433 13.4361L14.9792 12.013V15.524L17.41 16.9259L24.2906 13.0118V5.13771L17.41 1.22363Z" fill="#8247E5" />
      </svg>
    );
  }

  if (c === "optimism" || c === "op") {
    return (
      <svg viewBox="0 0 100 100" fill="none" className={className}>
        <circle cx="50" cy="50" r="50" fill="#FF0420" />
        <g transform="translate(18, 28) scale(1.9)" fill="#FFFFFF">
          <path d="M7.53 15C13.23 15 16.13 12.71 16.85 7.61C17.57 2.52 15.14 0 9.45 0C3.76 0 0.84 2.29 0.12 7.39C-0.6 12.48 1.84 15 7.53 15H7.53ZM7.82 11.57C4.89 11.57 3.79 10.38 4.18 7.61C4.6 4.66 6.1 3.43 9.17 3.43C12.24 3.43 13.18 4.62 12.79 7.39C12.37 10.3 10.93 11.57 7.82 11.57Z" />
          <path d="M17.81 14.66H21.79L22.33 10.89H27.09C31.25 10.89 33.33 9.3 33.84 5.71C34.35 2.13 32.54 0.34 28.39 0.34H19.83L17.81 14.66L17.81 14.66ZM22.79 7.67L23.37 3.55H27.65C29.32 3.55 29.95 4.2 29.77 5.61C29.57 7.05 28.72 7.67 26.88 7.67H22.79Z" />
        </g>
      </svg>
    );
  }

  if (c === "base") {
    return (
      <svg viewBox="0 0 100 100" fill="none" className={className}>
        <circle cx="50" cy="50" r="50" fill="#0052FF" />
        <circle cx="50" cy="50" r="26" fill="#FFFFFF" />
        <rect x="42" y="46" width="34" height="8" fill="#0052FF" />
      </svg>
    );
  }

  if (c === "avalanche" || c === "avax") {
    return (
      <svg viewBox="0 0 100 100" fill="none" className={className}>
        <circle cx="50" cy="50" r="50" fill="#E84142" />
        <path d="M50 20L78 68H64L50 44L42 58H33L50 20Z" fill="white" />
        <path d="M30 68L22 54L31 38L41 55H33L29 48L26 54L34 68H30Z" fill="white" />
      </svg>
    );
  }

  if (c === "sonic" || c === "s") {
    return (
      <svg viewBox="0 0 60 58" fill="none" className={className}>
        <defs>
          <radialGradient id="sonicGradFb" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(29.6 28.2) rotate(90) scale(28 28.9)">
            <stop stopColor="#1C294B" />
            <stop offset="0.32" stopColor="#FF4433" />
            <stop offset="0.6" stopColor="#FE9A4C" />
            <stop offset="1" stopColor="#E0E0E0" />
          </radialGradient>
        </defs>
        <path d="M35.5 35C24.6 38.2 15.6 42.8 10 48.3l-.3.2c1.5 1.4 3.1 2.6 4.9 3.7l.4-.5c1.5-1.8 3.2-3.6 4.9-5.3C24.5 42 29.8 38.1 35.5 35z" fill="url(#sonicGradFb)" />
        <path d="M.8 30.3c.4 5.7 2.6 10.9 6 15.1l.2-.2c3.5-3.3 8-6.4 13.5-9 4.8-2.3 10.3-4.3 16.3-5.9H.8z" fill="url(#sonicGradFb)" />
        <path d="M23 7C32.7 16.5 45 22.7 58.5 25 56.9 11.1 44.6.2 29.7.2c-3.9 0-7.7.8-11.1 2.2 1.4 1.6 2.9 3.2 4.4 4.6z" fill="url(#sonicGradFb)" />
        <path d="M10 8.2c5.6 5.4 14.6 10.1 25.5 13.2-5.7-3.1-11-7-15.6-11.4-1.7-1.7-3.4-3.4-4.9-5.3l-.4-.5C12.8 5.4 11.2 6.6 9.7 8l.3.2z" fill="url(#sonicGradFb)" />
        <path d="M23 49.4c-1.5 1.5-3 3.1-4.4 4.7 3.4 1.4 7.2 2.1 11.1 2.1 14.9 0 27.2-10.9 28.8-24.8-13.5 2.3-25.7 8.6-35.5 18z" fill="url(#sonicGradFb)" />
        <path d="M20.5 20.3C15 17.6 10.5 14.6 7 11.2l-.2-.1C3.4 15.3 1.2 20.5.8 26.1h36c-6-1.5-11.5-3.5-16.3-5.8z" fill="url(#sonicGradFb)" />
      </svg>
    );
  }

  if (
    c === "hyperevm" ||
    c === "hyperliquid" ||
    c === "hype" ||
    c === "hyper-evm" ||
    c === "hyper evm"
  ) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/chains/hyperevm.png"
        alt="HyperEVM"
        className={className}
      />
    );
  }

  return (
    <div className={`rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center font-mono font-bold text-stone-200 text-[10px] select-none ${className}`}>
      {chain.slice(0, 3).toUpperCase()}
    </div>
  );
}

export function ChainLogo({ chain, size = 24, className = "" }: ChainLogoProps) {
  const raw = (chain || "").toLowerCase().trim();
  const stripped = raw.replace(/[\s_-]+/g, "");
  const normalized = CHAIN_LOGO_URLS[raw] ? raw : (CHAIN_LOGO_URLS[stripped] ? stripped : raw);
  const urls = CHAIN_LOGO_URLS[normalized] || [];
  const [urlIndex, setUrlIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  const style = {
    width: typeof size === "number" ? `${size}px` : size,
    height: typeof size === "number" ? `${size}px` : size,
  };

  const currentUrl = urls[urlIndex];

  if (!currentUrl || failed) {
    return (
      <div style={style} className={`shrink-0 overflow-hidden rounded-full flex items-center justify-center ${className}`}>
        <OfficialVectorFallback chain={normalized} className="w-full h-full object-contain" />
      </div>
    );
  }

  return (
    <div style={style} className={`relative shrink-0 overflow-hidden rounded-full flex items-center justify-center bg-black/20 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- logo URLs fail over dynamically across remote providers */}
      <img
        src={currentUrl}
        alt={chain}
        className="w-full h-full object-contain select-none shadow-sm"
        onError={() => {
          if (urlIndex + 1 < urls.length) {
            setUrlIndex((prev) => prev + 1);
          } else {
            setFailed(true);
          }
        }}
        loading="eager"
      />
    </div>
  );
}
