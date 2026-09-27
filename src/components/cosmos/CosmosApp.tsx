"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  CosmosPlanet,
  InterplanetaryFlow,
  ScalingMetric,
  SmartMoneyHolding,
} from "@/types/cosmos";
import { CosmosHeader } from "@/components/hud/CosmosHeader";
import { PlanetDetailPanel } from "@/components/hud/PlanetDetailPanel";
import { TokenDetailModal } from "@/components/hud/TokenDetailModal";
import { ChainsPlanetaryEmblem } from "@/components/common/ChainsPlanetaryLogo";
import { Loader2 } from "lucide-react";

// Dynamically import Three.js 3D canvas with SSR disabled
const CosmosScene = dynamic(
  () => import("./CosmosScene").then((mod) => mod.CosmosScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#070a10] text-stone-200 font-mono gap-4">
        <ChainsPlanetaryEmblem className="w-28 h-14 text-amber-400 opacity-90 animate-pulse" />
        <div className="flex flex-col items-center gap-1.5">
          <div className="text-xs text-amber-500/80 tracking-[0.3em] uppercase">多元連鎖惑星系 // 観測指令部</div>
          <div className="text-sm font-bold tracking-[0.25em] text-stone-100 flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            INITIALIZING CHAINS PLANETARY SYSTEM...
          </div>
        </div>
      </div>
    ),
  }
);

export function CosmosApp() {
  const [planets, setPlanets] = useState<CosmosPlanet[]>([]);
  const [flows, setFlows] = useState<InterplanetaryFlow[]>([]);
  const [selectedPlanet, setSelectedPlanet] = useState<CosmosPlanet | null>(null);
  const [hoveredPlanetId, setHoveredPlanetId] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<SmartMoneyHolding | null>(null);
  const scalingMetric: ScalingMetric = "tvl";
  const [showHints, setShowHints] = useState<boolean>(true);
  const globalSpeed = 0.5;
  const [loading, setLoading] = useState<boolean>(true);
  const [sceneReady, setSceneReady] = useState<boolean>(false);
  const [showLoader, setShowLoader] = useState<boolean>(true);
  const [loaderFading, setLoaderFading] = useState<boolean>(false);
  const [isCinematicTour, setIsCinematicTour] = useState<boolean>(false);

  const handleSelectPlanet = (planet: CosmosPlanet | null) => {
    if (planet && isCinematicTour) {
      setIsCinematicTour(false);
    }
    setSelectedPlanet(planet);
  };

  const handleExitCinematicTour = useCallback(() => {
    document.body.style.cursor = "auto";
    setIsCinematicTour(false);
  }, []);

  const handleToggleCinematicTour = useCallback(() => {
    setIsCinematicTour((prev) => {
      const next = !prev;
      document.body.style.cursor = "auto";
      if (next) {
        setSelectedPlanet(null);
        setSelectedToken(null);
        setHoveredPlanetId(null);
      }
      return next;
    });
  }, []);

  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/cosmos/data?scaling=${scalingMetric}`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.planets) return;
        setPlanets(data.planets);
        setFlows(data.flows || []);
        if (data.timestamp) {
          setLastSync(data.timestamp);
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Failed to load cosmos universe data:", error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [scalingMetric]);

  // Trigger fade-out as soon as data is ready
  useEffect(() => {
    if (!loading && sceneReady) {
      const fadeTimer = setTimeout(() => setLoaderFading(true), 100);
      const removeTimer = setTimeout(() => setShowLoader(false), 900);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [loading, sceneReady]);

  // Global cinematic hotkeys: C for Cinematic Tour, Esc to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        handleToggleCinematicTour();
      } else if (e.key === "Escape") {
        if (isCinematicTour) {
          handleExitCinematicTour();
        } else if (selectedToken) {
          setSelectedToken(null);
        } else if (selectedPlanet) {
          setSelectedPlanet(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCinematicTour, selectedToken, selectedPlanet, handleToggleCinematicTour, handleExitCinematicTour]);

  return (
    <main className="relative w-screen h-screen bg-[#060911] overflow-hidden select-none">
      {/* Full-screen boot loader — sits above everything, fades out when data is ready */}
      {showLoader && (
        <div
          className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#060911] transition-opacity duration-700 ease-in-out ${loaderFading ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          {/* Emblem */}
          <ChainsPlanetaryEmblem className="w-24 h-auto text-amber-400 mb-8 opacity-90" />

          {/* Scanning line animation */}
          <div className="w-48 h-px bg-stone-800 relative overflow-hidden mb-6">
            <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-[scan_1.4s_ease-in-out_infinite]" />
          </div>

          {/* Status text */}
          <div className="flex flex-col items-center gap-2 font-mono">
            <div className="text-[9px] text-amber-500/60 tracking-[0.35em] uppercase">
              多元連鎖惑星系 // 観測指令部
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-stone-400 uppercase">
              <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              Initializing Chains Planetary System
            </div>
          </div>

          {/* Scanning line keyframe */}
          <style>{`
            @keyframes scan {
              0%   { transform: translateX(-100%); }
              100% { transform: translateX(500%); }
            }
          `}</style>
        </div>
      )}

      {/* 3D WebGL Cosmos Canvas */}
      {!loading && (
        <CosmosScene
          planets={planets}
          flows={flows}
          selectedPlanet={selectedPlanet}
          hoveredPlanetId={hoveredPlanetId}
          globalSpeed={globalSpeed}
          isCinematicTour={isCinematicTour}
          onSelectPlanet={handleSelectPlanet}
          onHoverPlanet={setHoveredPlanetId}
          onExitCinematicTour={handleExitCinematicTour}
          onUserInteraction={() => setShowHints(false)}
          onSceneReady={() => setSceneReady(true)}
        />
      )}

      {/* Top HUD Header - Hidden in presentation mode */}
      {!isCinematicTour && (
        <CosmosHeader
          planets={planets}
          showHints={showHints}
          lastSync={lastSync}
          isCinematicTour={isCinematicTour}
          onSelectPlanet={handleSelectPlanet}
          onToggleHints={() => setShowHints((current) => !current)}
          onToggleCinematicTour={handleToggleCinematicTour}
        />
      )}

      {/* Right Telemetry Detail Panel (Planet) - Hidden during cinematic tour */}
      {!isCinematicTour && (
        <PlanetDetailPanel
          planet={selectedPlanet}
          onClose={() => setSelectedPlanet(null)}
          onSelectToken={setSelectedToken}
        />
      )}

      {/* Token God Mode Modal */}
      <TokenDetailModal
        token={selectedToken}
        onClose={() => setSelectedToken(null)}
      />

      {/* Bottom Hint Footer - Hidden during cinematic tour */}
      {showHints && !selectedToken && !isCinematicTour && (
        <footer className="pointer-events-none absolute bottom-3.5 left-1/2 z-20 -translate-x-1/2">
          <div className="flex items-center gap-2 whitespace-nowrap border border-stone-700/80 bg-[#080c14]/92 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400 shadow-2xl backdrop-blur-md sm:gap-3 sm:text-xs">
            <span className="font-semibold text-stone-200">Drag to orbit</span>
            <span className="text-stone-700">/</span>
            <span className="hidden font-semibold text-stone-200 sm:inline">Scroll to zoom</span>
            <span className="text-stone-700">/</span>
            <span className="font-semibold text-amber-300">Select a world to inspect</span>
            <span className="text-stone-700">/</span>
            <span className="hidden font-semibold text-amber-400/90 sm:inline">[C] Cinematic Tour</span>
          </div>
        </footer>
      )}
    </main>
  );
}
