"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Radio,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { ChainLogo } from "@/components/common/ChainLogo";
import { CosmosPlanet } from "@/types/cosmos";

interface CapitalMigrationHUDProps {
  planets: CosmosPlanet[];
  visible: boolean;
  onSelectPlanet: (planet: CosmosPlanet) => void;
}

function formatUsd(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${(abs / 1e9).toFixed(2)}B`;
  return `$${(abs / 1e6).toFixed(abs >= 100e6 ? 0 : 1)}M`;
}

export function CapitalMigrationHUD({
  planets,
  visible,
  onSelectPlanet,
}: CapitalMigrationHUDProps) {
  const [expanded, setExpanded] = useState(false);

  const telemetry = useMemo(() => {
    const rankedEcosystems = planets
      .map((planet) => {
        const tvl = planet.metrics.tvl_usd || 0;
        const pct = planet.metrics.tvl_usd_percent_change;
        let deltaUsd = 0;

        if (tvl > 0 && pct !== null && pct !== undefined) {
          deltaUsd = tvl * (pct / (1 + pct));
        }

        return {
          planet,
          tvl,
          pct: pct ?? 0,
          deltaUsd,
        };
      })
      .filter((ecosystem) => ecosystem.tvl > 0)
      .sort((a, b) => b.deltaUsd - a.deltaUsd);

    const { totalExpansion, totalContraction } = rankedEcosystems.reduce(
      (totals, ecosystem) => ({
        totalExpansion:
          totals.totalExpansion + Math.max(0, ecosystem.deltaUsd),
        totalContraction:
          totals.totalContraction + Math.max(0, -ecosystem.deltaUsd),
      }),
      { totalExpansion: 0, totalContraction: 0 }
    );

    return {
      rankedEcosystems,
      totalExpansion,
      totalContraction,
      topExpanding: rankedEcosystems.find((ecosystem) => ecosystem.deltaUsd > 0)?.planet,
    };
  }, [planets]);

  if (!visible || telemetry.rankedEcosystems.length === 0) return null;

  const visibleEcosystems = expanded
    ? telemetry.rankedEcosystems
    : telemetry.rankedEcosystems.slice(0, 4);

  return (
    <section
      aria-label="Nansen capital flux overview"
      className="absolute bottom-18 left-4 z-30 hidden w-88 border border-stone-700/80 bg-[#080c14]/92 p-3.5 font-mono text-stone-200 shadow-2xl backdrop-blur-xl lg:block"
    >
      <header className="flex items-start justify-between border-b border-stone-800/90 pb-2.5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-200">
            <Radio className="h-3.5 w-3.5 text-amber-400" />
            Capital flux
          </div>
          <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-stone-500">
            Network movement · trailing 7 days
          </p>
        </div>
        <span className="flex items-center gap-1.5 border border-emerald-500/25 bg-emerald-500/8 px-1.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
          Live
        </span>
      </header>

      <div className="grid grid-cols-3 divide-x divide-stone-800/90 border-b border-stone-800/90 py-2.5">
        <div className="pr-2">
          <div className="text-[9px] uppercase tracking-wider text-stone-500">Expansion</div>
          <div className="mt-1 text-sm font-bold tabular-nums text-emerald-400">
            +{formatUsd(telemetry.totalExpansion)}
          </div>
        </div>
        <div className="px-2">
          <div className="text-[9px] uppercase tracking-wider text-stone-500">Contraction</div>
          <div className="mt-1 text-sm font-bold tabular-nums text-rose-400">
            -{formatUsd(telemetry.totalContraction)}
          </div>
        </div>
        <div className="pl-2">
          <div className="text-[9px] uppercase tracking-wider text-stone-500">Leader</div>
          <div className="mt-1 truncate text-sm font-bold text-stone-200">
            {telemetry.topExpanding?.symbol || "—"}
          </div>
        </div>
      </div>

      <div className="pt-2.5">
        <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-[0.14em] text-stone-500">
          <span className="flex items-center gap-1.5">
            <Activity className="h-3 w-3" />
            Chain movement
          </span>
          <span>7D change</span>
        </div>

        <div className="hud-scrollbar max-h-58 divide-y divide-stone-800/80 overflow-y-auto border border-stone-800/80 bg-[#0e131d]/35">
          {visibleEcosystems.map((ecosystem, index) => {
            const isPositive = ecosystem.deltaUsd >= 0;

            return (
              <button
                key={ecosystem.planet.id}
                type="button"
                onClick={() => onSelectPlanet(ecosystem.planet)}
                className="group flex min-h-9 w-full items-center justify-between gap-2 px-2.5 py-2 text-left transition-colors hover:bg-[#151b27] focus-visible:z-10"
                aria-label={`Inspect ${ecosystem.planet.name} metrics`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="w-4 text-[9px] tabular-nums text-stone-600">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <ChainLogo chain={ecosystem.planet.id} size={16} />
                  <span className="truncate text-[11px] font-bold text-stone-300 group-hover:text-amber-300">
                    {ecosystem.planet.name}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-2 tabular-nums">
                  <span className={`text-[10px] font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                    {isPositive ? "+" : "-"}{formatUsd(ecosystem.deltaUsd)}
                  </span>
                  <span className={`flex w-12 items-center justify-end gap-0.5 text-[9px] ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                    {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {(ecosystem.pct * 100).toFixed(1)}%
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {telemetry.rankedEcosystems.length > 4 && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-2.5 flex min-h-9 w-full items-center justify-center gap-1.5 border border-stone-800/80 bg-stone-900/45 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400 transition-colors hover:border-stone-700 hover:text-stone-200"
          aria-expanded={expanded}
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? "Show top movers" : `View all ${telemetry.rankedEcosystems.length} chains`}
        </button>
      )}
    </section>
  );
}
