"use client";

import React from "react";

interface ChainsPlanetaryEmblemProps {
  className?: string;
}

/**
 * ChainsPlanetaryEmblem: Minimalist schematic of an interconnected blockchain planetary system.
 * Combines:
 * 1. Clean planetary system orbits (equatorial & inclined celestial ellipses revolving around a central star)
 * 2. Linear blockchain schema (linked blocks [■]==[■]==[■] with data buses and state pins)
 * 3. Orbiting blockchain nodes with interplanetary cross-chain transfer vectors
 */
export function ChainsPlanetaryEmblem({ className = "w-full h-auto" }: ChainsPlanetaryEmblemProps) {
  return (
    <svg
      viewBox="0 0 440 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Subtle Coordinate Datum Line */}
      <line x1="20" y1="44" x2="420" y2="44" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.22" />

      {/* Planetary System Orbits */}
      {/* 1. Wide Equatorial Orbit */}
      <ellipse cx="220" cy="44" rx="142" ry="35" stroke="currentColor" strokeWidth="1.2" opacity="0.32" />
      {/* 2. Inclined Orbit Alpha (-14 deg) */}
      <ellipse cx="220" cy="44" rx="116" ry="28" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.45" transform="rotate(-14 220 44)" />
      {/* 3. Inclined Orbit Beta (+14 deg) */}
      <ellipse cx="220" cy="44" rx="116" ry="28" stroke="currentColor" strokeWidth="1.2" opacity="0.38" transform="rotate(14 220 44)" />
      {/* 4. Inner Core Orbit */}
      <ellipse cx="220" cy="44" rx="52" ry="17" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />

      {/* Central Star / Genesis Hub (Sun) */}
      <circle cx="220" cy="44" r="13" fill="#080c14" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="220" cy="44" r="6.5" fill="currentColor" opacity="0.95" />
      <circle cx="220" cy="44" r="2" fill="#080c14" />
      {/* Cardinal Solar Coordinates */}
      <line x1="220" y1="26" x2="220" y2="30" stroke="currentColor" strokeWidth="1.4" />
      <line x1="220" y1="58" x2="220" y2="62" stroke="currentColor" strokeWidth="1.4" />
      <line x1="202" y1="44" x2="206" y2="44" stroke="currentColor" strokeWidth="1.4" />
      <line x1="234" y1="44" x2="238" y2="44" stroke="currentColor" strokeWidth="1.4" />

      {/* Horizontal Blockchain Schema (Interconnecting Links) */}
      {/* Left Chain Links */}
      <line x1="44" y1="42.5" x2="79" y2="42.5" stroke="currentColor" strokeWidth="1.2" opacity="0.75" />
      <line x1="44" y1="45.5" x2="79" y2="45.5" stroke="currentColor" strokeWidth="1.2" opacity="0.75" />
      <line x1="91" y1="42.5" x2="134" y2="42.5" stroke="currentColor" strokeWidth="1.2" opacity="0.75" />
      <line x1="91" y1="45.5" x2="134" y2="45.5" stroke="currentColor" strokeWidth="1.2" opacity="0.75" />
      <line x1="146" y1="42.5" x2="206" y2="42.5" stroke="currentColor" strokeWidth="1.2" opacity="0.75" />
      <line x1="146" y1="45.5" x2="206" y2="45.5" stroke="currentColor" strokeWidth="1.2" opacity="0.75" />

      {/* Right Chain Links */}
      <line x1="234" y1="42.5" x2="294" y2="42.5" stroke="currentColor" strokeWidth="1.2" opacity="0.75" />
      <line x1="234" y1="45.5" x2="294" y2="45.5" stroke="currentColor" strokeWidth="1.2" opacity="0.75" />
      <line x1="306" y1="42.5" x2="349" y2="42.5" stroke="currentColor" strokeWidth="1.2" opacity="0.75" />
      <line x1="306" y1="45.5" x2="349" y2="45.5" stroke="currentColor" strokeWidth="1.2" opacity="0.75" />
      <line x1="361" y1="42.5" x2="396" y2="42.5" stroke="currentColor" strokeWidth="1.2" opacity="0.75" />
      <line x1="361" y1="45.5" x2="396" y2="45.5" stroke="currentColor" strokeWidth="1.2" opacity="0.75" />

      {/* Horizontal Chain Blocks */}
      <polygon points="38,39 42,41.5 42,46.5 38,49 34,46.5 34,41.5" fill="#080c14" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="38" cy="44" r="1.5" fill="currentColor" />
      <rect x="79.5" y="38.5" width="11" height="11" fill="#080c14" stroke="currentColor" strokeWidth="1.4" />
      <rect x="82" y="41" width="6" height="6" fill="currentColor" opacity="0.9" />
      <rect x="134.5" y="38.5" width="11" height="11" fill="#080c14" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="140" cy="44" r="2" fill="currentColor" />
      <rect x="294.5" y="38.5" width="11" height="11" fill="#080c14" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="300" cy="44" r="2" fill="currentColor" />
      <rect x="349.5" y="38.5" width="11" height="11" fill="#080c14" stroke="currentColor" strokeWidth="1.4" />
      <rect x="352" y="41" width="6" height="6" fill="currentColor" opacity="0.9" />
      <polygon points="402,39 406,41.5 406,46.5 402,49 398,46.5 398,41.5" fill="#080c14" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="402" cy="44" r="1.5" fill="currentColor" />

      {/* Orbiting Planetary Chain Nodes */}
      <rect x="141.5" y="16.5" width="9" height="9" fill="#080c14" stroke="currentColor" strokeWidth="1.3" />
      <rect x="143.5" y="18.5" width="5" height="5" fill="currentColor" opacity="0.9" />
      <rect x="289.5" y="16.5" width="9" height="9" fill="#080c14" stroke="currentColor" strokeWidth="1.3" />
      <rect x="291.5" y="18.5" width="5" height="5" fill="currentColor" opacity="0.9" />
      <rect x="127.5" y="60.5" width="9" height="9" fill="#080c14" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="132" cy="65" r="2" fill="currentColor" />
      <rect x="303.5" y="60.5" width="9" height="9" fill="#080c14" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="308" cy="65" r="2" fill="currentColor" />

      {/* Cross-Orbit Interplanetary Transfer Trajectories */}
      <path d="M 146 21 Q 220 8 294 21" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" fill="none" />
      <path d="M 132 65 Q 220 80 308 65" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" fill="none" />
      <line x1="146" y1="26" x2="146" y2="39" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
      <line x1="294" y1="26" x2="294" y2="39" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
      <line x1="132" y1="60" x2="132" y2="49" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
      <line x1="308" y1="60" x2="308" y2="49" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />

      {/* Minimal Tech Bracket Edge Guides [  ] */}
      <path d="M 20 33 L 14 33 L 14 55 L 20 55" stroke="currentColor" strokeWidth="1.4" opacity="0.6" fill="none" />
      <path d="M 420 33 L 426 33 L 426 55 L 420 55" stroke="currentColor" strokeWidth="1.4" opacity="0.6" fill="none" />
    </svg>
  );
}

/**
 * ChainsPlanetaryBrandHeader: Futuristic brutalist header featuring the
 * simplified schema of the blockchain planetary system.
 */
export function ChainsPlanetaryBrandHeader() {
  return (
    <div className="flex select-none items-center gap-3 font-mono">
      <div className="hidden w-24 shrink-0 text-stone-300 sm:block lg:w-28">
        <ChainsPlanetaryEmblem className="h-auto w-full transition-colors duration-200 hover:text-amber-300" />
      </div>

      <div className="min-w-0 border-stone-800 sm:border-l sm:pl-3">
        <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          <span className="hidden lg:inline">多元連鎖惑星系</span>
          <span className="hidden text-stone-700 lg:inline">{"//"}</span>
          <span>Orbit intelligence</span>
        </div>

        <div className="mt-0.5 whitespace-nowrap text-xs font-black uppercase leading-tight tracking-[0.16em] text-stone-100 sm:text-sm">
          Chains Planetary
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          <span className="relative flex h-2 w-2 items-center justify-center" aria-hidden="true">
            <span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-400/50" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          Nansen data live
        </div>
      </div>
    </div>
  );
}
