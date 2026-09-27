"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { CosmosPlanet, InterplanetaryFlow, ScalingMetric, SmartMoneyHolding } from "@/types/cosmos";
import { CosmosHeader } from "@/components/hud/CosmosHeader";
import { PlanetDetailPanel } from "@/components/hud/PlanetDetailPanel";
import { TokenDetailModal } from "@/components/hud/TokenDetailModal";
import { CapitalMigrationHUD } from "@/components/hud/CapitalMigrationHUD";
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
  const [showFlows, setShowFlows] = useState<boolean>(true);
  const [showHints, setShowHints] = useState<boolean>(true);
  const globalSpeed = 0.5;
  const [loading, setLoading] = useState<boolean>(true);

  const handleSelectPlanet = (planet: CosmosPlanet | null) => {
    setSelectedPlanet(planet);
  };

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadCosmosData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    try {
      const res = await fetch(
        `/api/cosmos/data?scaling=${scalingMetric}${refresh ? "&refresh=true" : ""}`
      );
      const data = await res.json();
      if (data.planets) {
        setPlanets(data.planets);
        setFlows(data.flows || []);
        setSelectedPlanet((current) => {
          if (!current) return current;
          return (
            data.planets.find((planet: CosmosPlanet) => planet.id === current.id) ||
            current
          );
        });
      }
    } catch (err) {
      console.error("Failed to load cosmos universe data:", err);
    } finally {
      setLoading(false);
      if (refresh) setIsRefreshing(false);
    }
  };

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

  return (
    <main className="relative w-screen h-screen bg-[#060911] overflow-hidden select-none">
      {/* 3D WebGL Cosmos Canvas */}
      {!loading && (
        <CosmosScene
          planets={planets}
          flows={flows}
          selectedPlanet={selectedPlanet}
          hoveredPlanetId={hoveredPlanetId}
          showFlows={showFlows}
          globalSpeed={globalSpeed}
          onSelectPlanet={handleSelectPlanet}
          onHoverPlanet={setHoveredPlanetId}
          onUserInteraction={() => setShowHints(false)}
        />
      )}

      {/* Top HUD Header */}
      <CosmosHeader
        showFlows={showFlows}
        showHints={showHints}
        isRefreshing={isRefreshing}
        onToggleFlows={() => setShowFlows(!showFlows)}
        onToggleHints={() => setShowHints((current) => !current)}
        onRefreshData={() => loadCosmosData(true)}
      />

      {/* Right Telemetry Detail Panel (Planet) */}
      <PlanetDetailPanel
        planet={selectedPlanet}
        onClose={() => setSelectedPlanet(null)}
        onSelectToken={setSelectedToken}
      />

      {/* Token God Mode Modal */}
      <TokenDetailModal
        token={selectedToken}
        onClose={() => setSelectedToken(null)}
      />

      {/* Nansen Capital Flux Telemetry HUD */}
      <CapitalMigrationHUD
        planets={planets}
        visible={showFlows && !selectedPlanet}
        onSelectPlanet={handleSelectPlanet}
      />

      {showHints && !selectedToken && (
        <footer className="pointer-events-none absolute bottom-3.5 left-1/2 z-20 -translate-x-1/2">
          <div className="flex items-center gap-2 whitespace-nowrap border border-stone-700/80 bg-[#080c14]/92 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400 shadow-2xl backdrop-blur-md sm:gap-3 sm:text-xs">
            <span className="font-semibold text-stone-200">Drag to orbit</span>
            <span className="text-stone-700">/</span>
            <span className="hidden font-semibold text-stone-200 sm:inline">Scroll to zoom</span>
            <span className="hidden text-stone-700 sm:inline">/</span>
            <span className="font-semibold text-amber-300">Select a world to inspect</span>
          </div>
        </footer>
      )}
    </main>
  );
}
