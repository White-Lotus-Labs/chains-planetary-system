"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CosmosPlanet, InterplanetaryFlow } from "@/types/cosmos";
import { ChainLogo } from "@/components/common/ChainLogo";
import { ChainsPlanetaryEmblem } from "@/components/common/ChainsPlanetaryLogo";
import { Pause, Play, SkipForward, X } from "lucide-react";

export type PresentationType = "ecosystem" | "chain" | "corridor";

export interface PresentationData {
  index: number;
  total: number;
  duration: number;
  type: PresentationType;
  chain?: {
    id: string;
    name: string;
    symbol: string;
    category: string;
    color: string;
    statusAura: "bullish" | "bearish" | "neutral";
    tvlUsd: number;
    tvlChange24h: number | null;
    volume24hUsd: number | null;
    volumeChange24h: number | null;
    activeUsers24h: number;
    activeUsersChange24h: number | null;
    txCount24h: number;
    txCountChange24h: number | null;
    revenueUsd: number;
    revenueChange24h: number | null;
    topTokens: Array<{
      symbol: string;
      valueUsd: number;
      change24h: number;
    }>;
  };
  ecosystem?: {
    totalTvlUsd: number;
    totalVolume24hUsd: number;
    totalTxs24h: number;
    totalChains: number;
    topTvlChain: { name: string; symbol: string; tvlUsd: number; sharePct: number };
    topGainerChain: { name: string; symbol: string; volumeChangePct: number };
  };
  corridor?: {
    targetChainId: string;
    targetChainName: string;
    direction: "inbound" | "outbound";
    volumeUsd: number;
    percentChange: number;
    description: string;
  };
}

export interface CinematicDirectorProps {
  isActive: boolean;
  planets: CosmosPlanet[];
  flows: InterplanetaryFlow[];
  planetPositions: Record<string, [number, number, number]>;
  rocketPositionsRef: React.RefObject<Record<string, [number, number, number]>>;
  onExit: () => void;
  onPresentationChange?: (data: PresentationData) => void;
}

function formatUSD(num: number | null | undefined): string {
  if (num == null || isNaN(num)) return "$0";
  const abs = Math.abs(num);
  if (abs >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
}

function formatNumber(num: number | null | undefined): string {
  if (num == null || isNaN(num)) return "0";
  const abs = Math.abs(num);
  if (abs >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatPercent(pct: number | null | undefined): { text: string; isPositive: boolean; isNeutral: boolean } {
  if (pct == null || isNaN(pct)) return { text: "0.0%", isPositive: true, isNeutral: true };
  const val = pct * (Math.abs(pct) <= 1 ? 100 : 1);
  const sign = val > 0 ? "+" : "";
  return {
    text: `${sign}${val.toFixed(1)}%`,
    isPositive: val > 0,
    isNeutral: Math.abs(val) < 0.05,
  };
}

export function CinematicDirector({
  isActive,
  planets,
  flows,
  planetPositions,
  rocketPositionsRef,
  onPresentationChange,
}: CinematicDirectorProps) {
  const shotIndexRef = useRef<number>(0);
  const shotTimerRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const transitionProgressRef = useRef<number>(1.0);
  const prevCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 95, 175));
  const prevTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const currentLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, -12, 0));

  // Sort planets by TVL for prioritizing presentation
  const sortedPlanets = useMemo(() => {
    return [...planets].sort((a, b) => (b.metrics.tvl_usd || 0) - (a.metrics.tvl_usd || 0));
  }, [planets]);

  // Aggregate ecosystem telemetry
  const ecosystemStats = useMemo(() => {
    const totalTvl = planets.reduce((acc, p) => acc + (p.metrics.tvl_usd || 0), 0);
    const totalVol = planets.reduce((acc, p) => acc + (p.metrics.total_dex_volume_usd || 0), 0);
    const totalTxs = planets.reduce((acc, p) => acc + (p.metrics.transaction_count || 0), 0);

    const topTvl = sortedPlanets[0];
    const topTvlShare = totalTvl > 0 && topTvl ? ((topTvl.metrics.tvl_usd || 0) / totalTvl) * 100 : 0;

    let topGainer = sortedPlanets[0];
    let maxGain = -Infinity;
    for (const p of planets) {
      const g = p.metrics.total_dex_volume_usd_percent_change || 0;
      if (g > maxGain) {
        maxGain = g;
        topGainer = p;
      }
    }

    return {
      totalTvlUsd: totalTvl,
      totalVolume24hUsd: totalVol,
      totalTxs24h: totalTxs,
      totalChains: planets.length,
      topTvlChain: {
        name: topTvl?.name || "Ethereum",
        symbol: topTvl?.symbol || "ETH",
        tvlUsd: topTvl?.metrics.tvl_usd || 0,
        sharePct: topTvlShare,
      },
      topGainerChain: {
        name: topGainer?.name || "Solana",
        symbol: topGainer?.symbol || "SOL",
        volumeChangePct: maxGain > -Infinity ? maxGain : 0,
      },
    };
  }, [planets, sortedPlanets]);

  // Build the presentation slides
  const slides = useMemo(() => {
    const list: Array<{
      id: string;
      duration: number;
      type: PresentationType;
      cameraMode: "macro" | "planet_horizon" | "planet_orbit" | "ring_skim" | "shuttle";
      planetId?: string;
      flowKey?: string;
      data: PresentationData;
    }> = [];

    // Slide 1: Global Ecosystem Presentation
    list.push({
      id: "ecosystem_overview",
      duration: 8,
      type: "ecosystem",
      cameraMode: "macro",
      data: {
        index: 1,
        total: 1, // Will be updated below
        duration: 8,
        type: "ecosystem",
        ecosystem: ecosystemStats,
      },
    });

    // Top 4 individual chains with their respective capital migration corridors
    const topChains = sortedPlanets.slice(0, 4);
    topChains.forEach((p, idx) => {
      const isRinged = p.hasRings;
      const camMode = idx === 0 ? "planet_horizon" : isRinged ? "ring_skim" : "planet_orbit";

      const topTokens = (p.smartMoneyHoldings || []).slice(0, 4).map((t) => ({
        symbol: t.token_symbol,
        valueUsd: t.value_usd,
        change24h: t.balance_24h_percent_change,
      }));

      // Part A: Individual Chain Spotlight
      list.push({
        id: `chain_${p.id}`,
        duration: 7,
        type: "chain",
        cameraMode: camMode,
        planetId: p.id,
        data: {
          index: list.length + 1,
          total: 1,
          duration: 7,
          type: "chain",
          chain: {
            id: p.id,
            name: p.name,
            symbol: p.symbol,
            category: p.category,
            color: p.color,
            statusAura: p.statusAura,
            tvlUsd: p.metrics.tvl_usd || 0,
            tvlChange24h: p.metrics.tvl_usd_percent_change,
            volume24hUsd: p.metrics.total_dex_volume_usd,
            volumeChange24h: p.metrics.total_dex_volume_usd_percent_change,
            activeUsers24h: p.metrics.active_address_count_txs || 0,
            activeUsersChange24h: p.metrics.active_address_count_txs_percent_change,
            txCount24h: p.metrics.transaction_count || 0,
            txCountChange24h: p.metrics.transaction_count_percent_change,
            revenueUsd: p.metrics.revenue_usd || 0,
            revenueChange24h: p.metrics.revenue_usd_percent_change,
            topTokens,
          },
        },
      });

      // Part B: Capital Migration Corridor for this Planet
      const activeFlow = flows.find(
        (f) => f.planetId === p.id || f.toPlanetId === p.id || f.fromPlanetId === p.id
      );

      const direction: "inbound" | "outbound" =
        activeFlow?.direction ||
        ((p.metrics.tvl_usd_percent_change || 0) >= 0 ? "inbound" : "outbound");

      const deltaUsd =
        activeFlow?.deltaUsd != null
          ? Math.abs(activeFlow.deltaUsd)
          : activeFlow?.volumeUsd != null
          ? activeFlow.volumeUsd
          : Math.abs((p.metrics.tvl_usd || 1e9) * (p.metrics.tvl_usd_percent_change || 0.04));

      const pctChange =
        activeFlow?.percentChange != null
          ? Math.abs(activeFlow.percentChange * (Math.abs(activeFlow.percentChange) <= 1 ? 100 : 1))
          : Math.abs((p.metrics.tvl_usd_percent_change || 0.05) * 100);

      const description =
        activeFlow?.description ||
        (direction === "inbound"
          ? `Nansen 7D Inbound Capital: net liquidity expansion into ${p.name}`
          : `Nansen 7D Outbound Capital: net liquidity contraction from ${p.name}`);

      list.push({
        id: `capital_migration_${p.id}`,
        duration: 6,
        type: "corridor",
        cameraMode: "shuttle",
        planetId: p.id,
        flowKey: `traffic-${p.id}`,
        data: {
          index: list.length + 1,
          total: 1,
          duration: 6,
          type: "corridor",
          corridor: {
            targetChainId: p.id,
            targetChainName: p.name,
            direction,
            volumeUsd: deltaUsd,
            percentChange: pctChange,
            description,
          },
        },
      });
    });

    // Set totals
    const totalCount = list.length;
    list.forEach((item, i) => {
      item.data.index = i + 1;
      item.data.total = totalCount;
    });

    return list;
  }, [sortedPlanets, ecosystemStats, flows]);

  // Notify parent of presentation slide update
  const emitSlideData = useCallback(
    (index: number) => {
      if (!onPresentationChange || !slides.length) return;
      const current = slides[index % slides.length];
      onPresentationChange(current.data);
    },
    [onPresentationChange, slides]
  );

  // Initialize
  useEffect(() => {
    if (isActive) {
      shotIndexRef.current = 0;
      shotTimerRef.current = 0;
      transitionProgressRef.current = 0;
      isPausedRef.current = false;
      currentLookAtRef.current.set(0, -12, 0);
      emitSlideData(0);
    }
  }, [isActive, emitSlideData]);

  // Keyboard navigation: [Space] next, [P] pause/play
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        shotIndexRef.current = (shotIndexRef.current + 1) % slides.length;
        shotTimerRef.current = 0;
        transitionProgressRef.current = 0;
        emitSlideData(shotIndexRef.current);
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        isPausedRef.current = !isPausedRef.current;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, slides.length, emitSlideData]);

  useFrame((state, delta) => {
    if (!isActive || !slides.length) return;

    if (!isPausedRef.current) {
      shotTimerRef.current += delta;
      const currentSlide = slides[shotIndexRef.current % slides.length];

      if (shotTimerRef.current >= currentSlide.duration) {
        shotTimerRef.current = 0;
        shotIndexRef.current = (shotIndexRef.current + 1) % slides.length;
        transitionProgressRef.current = 0;
        emitSlideData(shotIndexRef.current);
      }
    }

    transitionProgressRef.current = Math.min(1.0, transitionProgressRef.current + delta * 0.45);
    const easeT = THREE.MathUtils.smoothstep(transitionProgressRef.current, 0, 1);

    const currentSlide = slides[shotIndexRef.current % slides.length];
    const t = state.clock.getElapsedTime();

    const targetCamPos = new THREE.Vector3(0, 95, 175);
    const targetLookAt = new THREE.Vector3(0, -12, 0);

    switch (currentSlide.cameraMode) {
      case "planet_horizon": {
        const pPos = currentSlide.planetId ? planetPositions[currentSlide.planetId] : null;
        if (pPos) {
          const planetV = new THREE.Vector3(pPos[0], pPos[1], pPos[2]);
          const dirFromSun = planetV.clone().normalize();
          const p = planets.find((pl) => pl.id === currentSlide.planetId);
          const pr = p?.calculatedRadius || 2.2;

          // Comfortable wide vantage point - never zooms too close (min 34 units)
          const dist = Math.max(34, pr * 14);
          const sideVector = new THREE.Vector3(-dirFromSun.z, 0, dirFromSun.x).normalize();

          const camOffset = dirFromSun
            .clone()
            .multiplyScalar(dist * 0.8)
            .add(sideVector.multiplyScalar(dist * 0.45))
            .add(new THREE.Vector3(0, dist * 0.42, 0));

          targetCamPos.copy(planetV).add(camOffset);
          // Look slightly below the planet to frame it in the upper 60% of the screen, well clear of the bottom deck
          targetLookAt.copy(planetV).sub(new THREE.Vector3(0, pr * 1.5, 0));
        }
        break;
      }

      case "planet_orbit": {
        const pPos = currentSlide.planetId ? planetPositions[currentSlide.planetId] : null;
        if (pPos) {
          const planetV = new THREE.Vector3(pPos[0], pPos[1], pPos[2]);
          const p = planets.find((pl) => pl.id === currentSlide.planetId);
          const pr = p?.calculatedRadius || 2.2;
          const orbitAngle = t * 0.12;
          const dist = Math.max(34, pr * 13.5);

          targetCamPos.set(
            planetV.x + Math.cos(orbitAngle) * dist,
            planetV.y + dist * 0.42,
            planetV.z + Math.sin(orbitAngle) * dist
          );
          targetLookAt.copy(planetV).sub(new THREE.Vector3(0, pr * 1.5, 0));
        }
        break;
      }

      case "ring_skim": {
        const pPos = currentSlide.planetId ? planetPositions[currentSlide.planetId] : null;
        if (pPos) {
          const planetV = new THREE.Vector3(pPos[0], pPos[1], pPos[2]);
          const p = planets.find((pl) => pl.id === currentSlide.planetId);
          const pr = p?.calculatedRadius || 2.2;
          // Elevated overview of the rings at safe, non-clipping distance
          const dist = Math.max(36, pr * 14.5);
          const ringAngle = t * 0.10;

          targetCamPos.set(
            planetV.x + Math.cos(ringAngle) * dist,
            planetV.y + dist * 0.46,
            planetV.z + Math.sin(ringAngle) * dist
          );
          targetLookAt.copy(planetV).sub(new THREE.Vector3(0, pr * 1.4, 0));
        }
        break;
      }

      case "shuttle": {
        const rPos = currentSlide.flowKey
          ? rocketPositionsRef.current?.[currentSlide.flowKey]
          : null;
        if (rPos) {
          const rocketV = new THREE.Vector3(rPos[0], rPos[1], rPos[2]);
          // Pull camera back to view shuttle and its interplanetary transfer corridor
          targetCamPos.set(rocketV.x - 14, rocketV.y + 11, rocketV.z + 20);
          targetLookAt.set(rocketV.x, rocketV.y - 2.8, rocketV.z);
        } else {
          const pPos = currentSlide.planetId ? planetPositions[currentSlide.planetId] : null;
          if (pPos) {
            targetCamPos.set(pPos[0] - 18, pPos[1] + 16, pPos[2] + 28);
            targetLookAt.set(pPos[0], pPos[1] - 2, pPos[2]);
          } else {
            targetCamPos.set(0, 100, 185);
            targetLookAt.set(0, -10, 0);
          }
        }
        break;
      }

      case "macro":
      default: {
        const macroAngle = t * 0.035;
        const macroRadius = 220;
        const macroHeight = 90 + Math.sin(t * 0.08) * 10;
        targetCamPos.set(
          Math.cos(macroAngle) * macroRadius,
          macroHeight,
          Math.sin(macroAngle) * macroRadius
        );
        targetLookAt.set(0, -12, 0);
        break;
      }
    }

    const lerpFactor = Math.min(1.0, delta * (1.6 + easeT * 0.8));
    state.camera.position.lerp(targetCamPos, lerpFactor);
    currentLookAtRef.current.lerp(targetLookAt, lerpFactor);
    state.camera.lookAt(currentLookAtRef.current);

    // Shift the render frustum so the focused planet renders left-of-center,
    // leaving the right portion of the screen clear for the data card.
    const w = state.size.width;
    const h = state.size.height;
    const isPlanetSlide = ["planet_horizon", "planet_orbit", "ring_skim"].includes(
      currentSlide.cameraMode
    );
    if (isPlanetSlide) {
      // Positive offsetX pans the frustum right → subject appears left of center
      state.camera.setViewOffset(w, h, w * 0.15, 0, w, h);
    } else {
      state.camera.clearViewOffset();
    }

    prevCamPosRef.current.copy(state.camera.position);
    prevTargetPosRef.current.copy(targetLookAt);
  });

  // Clear view offset when cinematic director unmounts (exit cinematic mode)
  const { camera } = useThree();
  useEffect(() => {
    return () => {
      camera.clearViewOffset();
    };
  }, [camera]);

  return null;
}

// Clean, Data-Dense Executive Presentation Overlay
export function CinematicLetterboxOverlay({
  isActive,
  data,
  onExit,
}: {
  isActive: boolean;
  data: PresentationData | null;
  onExit: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isActive || !data) return;

    const start = performance.now();
    const durationMs = data.duration * 1000;

    const interval = setInterval(() => {
      if (isPaused) return;
      const elapsed = performance.now() - start;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, [isActive, data, isPaused]);

  if (!isActive || !data) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 select-none font-mono">
      {/* Top Presentation Bar: Unified Branding & Presentation Controls */}
      <div className="pointer-events-auto absolute top-0 inset-x-0 h-13 bg-[#080c14]/92 border-b border-stone-800/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between text-xs shadow-2xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 text-stone-200">
            <ChainsPlanetaryEmblem className="h-5 w-auto text-amber-400 shrink-0" />
            <span className="hidden sm:inline font-mono font-bold tracking-wider text-xs uppercase text-stone-100">
              Chains Planetary System
            </span>
          </div>

          <span className="hidden md:inline text-stone-700">|</span>

          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 font-semibold text-[11px] tracking-wider border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            PRESENTATION MODE
          </span>

          <span className="text-stone-400 text-xs tabular-nums">
            {data.index} of {data.total}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-stone-900/90 border border-stone-700/80 text-stone-300 hover:text-stone-100 hover:border-amber-400/50 hover:bg-stone-800 transition-colors shadow-sm"
            title="Pause slide timer (Hotkey: P)"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline font-medium">{isPaused ? "RESUME" : "PAUSE"}</span>
            <kbd className="hidden md:inline-block px-1 rounded bg-stone-800 text-[10px] text-stone-400 border border-stone-700">P</kbd>
          </button>

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-stone-900/90 border border-stone-700/80 text-stone-300 hover:text-stone-100 hover:border-amber-400/50 hover:bg-stone-800 transition-colors shadow-sm"
            title="Next slide (Hotkey: Space)"
          >
            <SkipForward className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-400" />
            <span className="hidden sm:inline font-medium">NEXT</span>
            <kbd className="hidden md:inline-block px-1 rounded bg-stone-800 text-[10px] text-stone-400 border border-stone-700">SPACE</kbd>
          </button>

          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-stone-900/90 border border-stone-700/80 text-stone-400 hover:text-rose-400 hover:border-rose-500/50 hover:bg-rose-950/20 transition-colors shadow-sm"
            title="Exit presentation (Hotkey: Esc)"
          >
            <X className="w-3.5 h-3.5" />
            <span className="font-medium">EXIT</span>
            <kbd className="hidden md:inline-block px-1 rounded bg-stone-800 text-[10px] text-stone-400 border border-stone-700">ESC</kbd>
          </button>
        </div>
      </div>

      {/* Right-side floating data panel — positioned beside the focused 3D element */}
      <div className="pointer-events-none absolute top-[52%] left-[51%]">
        <div className="pointer-events-auto w-[268px] sm:w-[296px] bg-[#06080f]/96 border border-stone-800/80 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.7)] rounded-sm overflow-hidden">
          {/* Slide progress bar at top of panel */}
          <div className="h-[2px] bg-stone-900">
            <div
              key={data.index}
              className="h-full bg-amber-400 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* ── Chain Spotlight ── */}
          {data.type === "chain" && data.chain && (
            <div className="p-4 space-y-3.5">
              {/* Chain identity header */}
              <div className="flex items-center gap-3">
                <ChainLogo chain={data.chain.id} size={42} className="rounded-full shrink-0 shadow-lg border border-stone-700/50" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-stone-100 tracking-wide leading-tight">
                      {data.chain.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 font-semibold border border-stone-700/60">
                      {data.chain.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[9px]">
                    <span className="uppercase text-amber-400 font-semibold tracking-wider">{data.chain.category}</span>
                    <span className="text-stone-700">•</span>
                    <span
                      className={
                        data.chain.statusAura === "bullish"
                          ? "text-emerald-400 font-semibold tracking-wide"
                          : data.chain.statusAura === "bearish"
                          ? "text-rose-400 font-semibold tracking-wide"
                          : "text-stone-400 tracking-wide"
                      }
                    >
                      {data.chain.statusAura.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-stone-800/70" />

              {/* Metrics stacked */}
              <div className="space-y-2">
                {/* TVL */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider text-stone-500 font-semibold">Total TVL</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-bold text-stone-100 tabular-nums">{formatUSD(data.chain.tvlUsd)}</span>
                    {data.chain.tvlChange24h != null && (
                      <span className={`text-[9px] font-semibold tabular-nums ${formatPercent(data.chain.tvlChange24h).isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                        {formatPercent(data.chain.tvlChange24h).text}
                      </span>
                    )}
                  </div>
                </div>
                {/* 24h Volume */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider text-stone-500 font-semibold">24h Volume</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-bold text-stone-100 tabular-nums">{formatUSD(data.chain.volume24hUsd)}</span>
                    {data.chain.volumeChange24h != null && (
                      <span className={`text-[9px] font-semibold tabular-nums ${formatPercent(data.chain.volumeChange24h).isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                        {formatPercent(data.chain.volumeChange24h).text}
                      </span>
                    )}
                  </div>
                </div>
                {/* Active Users */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider text-stone-500 font-semibold">Active Users 24h</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-bold text-stone-100 tabular-nums">{formatNumber(data.chain.activeUsers24h)}</span>
                    {data.chain.activeUsersChange24h != null && (
                      <span className={`text-[9px] font-semibold tabular-nums ${formatPercent(data.chain.activeUsersChange24h).isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                        {formatPercent(data.chain.activeUsersChange24h).text}
                      </span>
                    )}
                  </div>
                </div>
                {/* Transactions */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider text-stone-500 font-semibold">Transactions 24h</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-bold text-stone-100 tabular-nums">{formatNumber(data.chain.txCount24h)}</span>
                    {data.chain.revenueUsd > 0 && (
                      <span className="text-[9px] text-stone-500 tabular-nums">Rev {formatUSD(data.chain.revenueUsd)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Smart Money Focus */}
              {data.chain.topTokens.length > 0 && (
                <>
                  <div className="border-t border-stone-800/70" />
                  <div>
                    <div className="text-[9px] text-stone-500 font-semibold uppercase tracking-wider mb-2">Smart Money Focus</div>
                    <div className="flex flex-wrap gap-1.5">
                      {data.chain.topTokens.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-[10px] text-stone-200 whitespace-nowrap"
                        >
                          <span className="font-bold text-amber-300">${t.symbol}</span>{" "}
                          <span className={t.change24h >= 0 ? "text-emerald-400 text-[9px]" : "text-rose-400 text-[9px]"}>
                            {t.change24h >= 0 ? "+" : ""}{(t.change24h * 100).toFixed(1)}%
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Ecosystem Overview ── */}
          {data.type === "ecosystem" && data.ecosystem && (
            <div className="p-4 space-y-3.5">
              <div>
                <div className="text-sm font-bold text-stone-100 tracking-wider">MULTI-CHAIN ECOSYSTEM</div>
                <div className="text-[9px] text-stone-400 mt-0.5 uppercase tracking-wider">
                  {data.ecosystem.totalChains} Active L1 &amp; L2 Networks
                </div>
              </div>

              <div className="border-t border-stone-800/70" />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider text-stone-500 font-semibold">Total TVL Locked</span>
                  <span className="text-xs font-bold text-amber-400 tabular-nums">{formatUSD(data.ecosystem.totalTvlUsd)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider text-stone-500 font-semibold">24h DEX Volume</span>
                  <span className="text-xs font-bold text-stone-100 tabular-nums">{formatUSD(data.ecosystem.totalVolume24hUsd)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider text-stone-500 font-semibold">24h Transactions</span>
                  <span className="text-xs font-bold text-stone-100 tabular-nums">{formatNumber(data.ecosystem.totalTxs24h)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider text-stone-500 font-semibold">Dominant Chain</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-bold text-stone-100">{data.ecosystem.topTvlChain.name}</span>
                    <span className="text-[9px] text-stone-500 tabular-nums">({data.ecosystem.topTvlChain.sharePct.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Capital Migration Shuttle ── */}
          {data.type === "corridor" && data.corridor && (
            <div className="p-4 space-y-3">
              {/* Eyebrow badge */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-[0.18em]">
                  Capital Migration Shuttle
                </span>
              </div>

              {/* Chain identity */}
              <div className="flex items-center gap-3">
                <ChainLogo chain={data.corridor.targetChainId} size={44} className="rounded-full shrink-0 shadow-lg border border-stone-700/50" />
                <div className="min-w-0">
                  <div className="text-base font-bold text-stone-100 tracking-wide leading-tight">
                    {data.corridor.targetChainName}
                  </div>
                  <div className="text-[9px] text-stone-500 mt-0.5 uppercase tracking-wider">
                    Capital Flow Analysis
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-800/60" />

              {/* Flow route: MULTI-CHAIN ↔ TARGET */}
              <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider">
                <span className="text-stone-500 font-semibold">Multi-Chain</span>
                <span className={data.corridor.direction === "inbound" ? "text-emerald-500" : "text-rose-500"}>
                  {data.corridor.direction === "inbound" ? "→" : "←"}
                </span>
                <span className="text-stone-300 font-bold">{data.corridor.targetChainName}</span>
              </div>

              {/* Direction badge — full width */}
              <div
                className={`w-full text-center text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-2 rounded border ${
                  data.corridor.direction === "inbound"
                    ? "bg-emerald-950/60 border-emerald-700/50 text-emerald-300"
                    : "bg-rose-950/60 border-rose-700/50 text-rose-300"
                }`}
              >
                {data.corridor.direction === "inbound" ? "▲  Net Inflow" : "▼  Net Outflow"}
              </div>

              <div className="border-t border-stone-800/60" />

              {/* Primary metric — large */}
              <div className="flex items-baseline justify-between">
                <span className="text-[9px] uppercase tracking-wider text-stone-500 font-semibold">24h Volume</span>
                <span className={`text-lg font-bold tabular-nums leading-none ${data.corridor.direction === "inbound" ? "text-emerald-400" : "text-rose-400"}`}>
                  {data.corridor.direction === "outbound" ? "-" : "+"}{formatUSD(data.corridor.volumeUsd)}
                </span>
              </div>

              {/* Secondary metric */}
              <div className="flex items-baseline justify-between">
                <span className="text-[9px] uppercase tracking-wider text-stone-500 font-semibold">Velocity Δ 24h</span>
                <span className={`text-xs font-bold tabular-nums ${data.corridor.direction === "inbound" ? "text-emerald-400" : "text-rose-400"}`}>
                  {data.corridor.direction === "inbound" ? "+" : "-"}{data.corridor.percentChange.toFixed(1)}%
                </span>
              </div>

              {/* Description — very subtle footer */}
              {data.corridor.description && (
                <>
                  <div className="border-t border-stone-800/60" />
                  <p className="text-[8px] text-stone-600 leading-relaxed">{data.corridor.description}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Thin bottom progress strip */}
      <div className="absolute bottom-0 inset-x-0 h-[2px] bg-stone-900/60">
        <div
          key={`strip-${data.index}`}
          className="h-full bg-amber-400/50 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
