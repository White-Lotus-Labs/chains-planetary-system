"use client";

import { useState } from "react";
import { CosmosPlanet } from "@/types/cosmos";
import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface CosmosSidebarProps {
  planets: CosmosPlanet[];
  selectedPlanet: CosmosPlanet | null;
  onSelectPlanet: (planet: CosmosPlanet | null) => void;
}

export function CosmosSidebar({
  planets,
  selectedPlanet,
  onSelectPlanet,
}: CosmosSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Sort planets by DEX Volume
  const sortedPlanets = [...planets].sort(
    (a, b) =>
      (b.metrics.total_dex_volume_usd || 0) - (a.metrics.total_dex_volume_usd || 0)
  );

  return (
    <div
      className={`absolute top-28 left-4 z-30 transition-all duration-300 pointer-events-auto font-mono ${
        collapsed ? "translate-x-[-290px]" : "translate-x-0"
      }`}
    >
      <div className="relative w-76 bg-[#0a0d14]/94 backdrop-blur-xl border border-stone-700/80 rounded-none p-4.5 shadow-2xl flex flex-col text-stone-200">
        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="group absolute -right-3.5 top-6 w-7 h-7 rounded-none bg-stone-900/95 border border-stone-700 hover:border-amber-400 text-stone-400 hover:text-amber-300 flex items-center justify-center transition-all duration-200 shadow-xl active:scale-90"
          title={collapsed ? "Expand Colony Directory" : "Collapse Colony Directory"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          )}
        </button>

        {/* Top Japanese Multichain Subtitle */}
        <div className="text-[10px] uppercase text-stone-400 tracking-wider mb-1 flex items-center justify-between">
          <span className="text-amber-400 font-bold">連鎖網資産目録</span>
          <span>PLANETARY ARCHIVE</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800/80 mb-2.5">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-mono font-bold tracking-wider text-stone-100 uppercase">
              CHAIN ASSETS
            </span>
          </div>
          <span className="text-xs font-mono text-amber-300/80 uppercase font-semibold">7D FLUX</span>
        </div>

        {/* Planet List */}
        <div className="space-y-1.5 max-h-[58vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-700/40">
          {sortedPlanets.map((planet, rank) => {
            const isSelected = selectedPlanet?.id === planet.id;
            const dex = planet.metrics.total_dex_volume_usd || 0;
            const change =
              planet.metrics.total_dex_volume_usd_percent_change || 0;
            const isPositive = change >= 0;

            return (
              <div
                key={planet.id}
                onClick={() =>
                  onSelectPlanet(isSelected ? null : planet)
                }
                className={`p-2.5 rounded-none transition-all cursor-pointer flex items-center justify-between group border ${
                  isSelected
                    ? "bg-[#121824] border-amber-400 shadow-md shadow-stone-950/60"
                    : "bg-[#0e131d]/50 hover:bg-[#121824] border-stone-800/80 hover:border-amber-400/50"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-mono font-bold w-5 text-stone-400">
                    #{rank < 9 ? `0${rank + 1}` : rank + 1}
                  </span>
                  <div
                    className="w-3 h-3 rounded-none flex-shrink-0 border border-stone-700"
                    style={{ backgroundColor: planet.color }}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-mono font-bold text-stone-200 uppercase truncate group-hover:text-amber-300">
                      {planet.name}
                    </div>
                    <div className="text-xs font-mono text-stone-400">
                      [{planet.symbol}]
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-mono font-bold text-stone-100">
                    ${(dex / 1e6).toFixed(0)}M
                  </div>
                  <div
                    className={`text-xs font-mono flex items-center justify-end gap-0.5 ${
                      isPositive ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {isPositive ? "+" : ""}
                    {(change * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
