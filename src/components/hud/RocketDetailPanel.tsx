"use client";

import { useMemo } from "react";
import { CosmosPlanet, InterplanetaryFlow } from "@/types/cosmos";
import {
  Rocket,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { ChainLogo } from "@/components/common/ChainLogo";

interface RocketDetailPanelProps {
  flow: InterplanetaryFlow | null;
  allFlows?: InterplanetaryFlow[];
  allPlanets?: CosmosPlanet[];
  onClose: () => void;
  onSelectPlanet?: (planet: CosmosPlanet) => void;
}

export function RocketDetailPanel({
  flow,
  allFlows = [],
  allPlanets = [],
  onClose,
  onSelectPlanet,
}: RocketDetailPanelProps) {
  const planetMap = useMemo(() => {
    const map: Record<string, CosmosPlanet> = {};
    for (const p of allPlanets) {
      map[p.id] = p;
    }
    return map;
  }, [allPlanets]);

  if (!flow) return null;

  const fromPlanet = planetMap[flow.fromPlanetId];
  const toPlanet = planetMap[flow.toPlanetId];

  const volumeFormatted =
    flow.volumeUsd >= 1e9
      ? `$${(flow.volumeUsd / 1e9).toFixed(2)}B`
      : `$${(flow.volumeUsd / 1e6).toFixed(1)}M`;
  const totalModeledVolume = allFlows.reduce(
    (sum, candidate) => sum + candidate.volumeUsd,
    0
  );
  const corridorShare = totalModeledVolume
    ? (flow.volumeUsd / totalModeledVolume) * 100
    : 0;

  return (
    <aside className="fixed top-20 right-6 w-96 max-w-[92vw] max-h-[82vh] overflow-y-auto rounded-none bg-[#0a0d14]/94 backdrop-blur-2xl border border-stone-700/80 p-5 shadow-2xl flex flex-col font-mono text-stone-200 z-40 animate-in slide-in-from-right duration-200">

      {/* Header: Rocket icon + status + close */}
      <div className="flex items-center justify-between pb-3.5 border-b border-stone-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-none bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wider text-stone-100 uppercase">
                Capital Migration
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-xs text-stone-400 mt-0.5 uppercase tracking-wide">
              Nansen 7D Capital Corridor • Active
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="group px-2 py-1 rounded-none bg-stone-900/80 hover:bg-stone-800 border border-stone-700/80 hover:border-amber-400 text-stone-400 hover:text-amber-300 transition-all text-xs font-bold active:scale-95"
          title="Close"
        >
          [ ✕ ]
        </button>
      </div>

      {/* Route: From → To */}
      <div className="flex items-center justify-between p-3 rounded-none bg-[#0e131d]/60 border border-stone-800/80 mt-3.5">
        <div className="flex items-center gap-2.5">
          {fromPlanet && (
            <ChainLogo chain={fromPlanet.id} size={26} className="rounded-none shadow" />
          )}
          <span className="text-sm font-bold text-stone-100 uppercase tracking-wide">
            {fromPlanet?.name || flow.fromPlanetId}
          </span>
        </div>

        <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />

        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-stone-100 uppercase tracking-wide">
            {toPlanet?.name || flow.toPlanetId}
          </span>
          {toPlanet && (
            <ChainLogo chain={toPlanet.id} size={26} className="rounded-none shadow" />
          )}
        </div>
      </div>

      {/* Volume + Intensity */}
      <div className="p-3 rounded-none bg-[#0e131d]/60 border border-stone-800/80 mt-2.5">
        <div className="flex items-center justify-between text-xs text-stone-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            7D Migration Volume
          </span>
          <span className="text-stone-300 font-semibold">{corridorShare.toFixed(1)}% of network</span>
        </div>
        <div className="text-2xl font-bold text-emerald-400 mt-1">
          {volumeFormatted}
        </div>
        <div className="w-full h-1.5 rounded-none bg-stone-950 overflow-hidden border border-stone-800/80 mt-2.5">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-amber-400"
            style={{ width: `${Math.min(100, Math.max(8, corridorShare * 3.2))}%` }}
          />
        </div>
      </div>

      {/* Description */}
      {flow.description && (
        <div className="p-3 rounded-none bg-[#0e131d]/40 border border-stone-800/60 mt-2.5">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1.5">
            Route Details
          </div>
          <p className="text-xs text-stone-300/90 leading-relaxed font-sans">
            {flow.description}
          </p>
        </div>
      )}

      {/* Navigate to chain buttons */}
      <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-stone-800/80">
        {fromPlanet && (
          <button
            onClick={() => onSelectPlanet?.(fromPlanet)}
            className="group relative flex-1 py-2 px-2.5 rounded-none bg-stone-900/60 hover:bg-[#121824] border border-stone-700/80 hover:border-amber-400 text-xs font-mono tracking-wider uppercase transition-all duration-200 flex items-center justify-between active:scale-[0.98]"
            title={`View ${fromPlanet.name}`}
          >
            <span className="flex items-center gap-1.5 text-stone-400 group-hover:text-amber-300">
              <span className="w-1.5 h-1.5 bg-amber-400/80" />
              {fromPlanet.symbol}
            </span>
            <span className="text-stone-500 group-hover:text-amber-400">➔</span>
          </button>
        )}
        {toPlanet && (
          <button
            onClick={() => onSelectPlanet?.(toPlanet)}
            className="group relative flex-1 py-2 px-2.5 rounded-none bg-stone-900/60 hover:bg-[#121824] border border-stone-700/80 hover:border-amber-400 text-xs font-mono tracking-wider uppercase transition-all duration-200 flex items-center justify-between active:scale-[0.98]"
            title={`View ${toPlanet.name}`}
          >
            <span className="flex items-center gap-1.5 text-stone-400 group-hover:text-amber-300">
              <span className="w-1.5 h-1.5 bg-amber-400/80" />
              {toPlanet.symbol}
            </span>
            <span className="text-stone-500 group-hover:text-amber-400">➔</span>
          </button>
        )}
      </div>
    </aside>
  );
}
