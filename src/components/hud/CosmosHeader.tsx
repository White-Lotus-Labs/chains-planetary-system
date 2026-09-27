"use client";

import { ArrowRightLeft, CircleHelp, Layers, RefreshCw } from "lucide-react";

import { ChainsPlanetaryBrandHeader } from "@/components/common/ChainsPlanetaryLogo";

interface CosmosHeaderProps {
  showFlows: boolean;
  showHints: boolean;
  isRefreshing?: boolean;
  onToggleFlows: () => void;
  onToggleHints: () => void;
  onRefreshData?: () => void;
}

export function CosmosHeader({
  showFlows,
  showHints,
  isRefreshing = false,
  onToggleFlows,
  onToggleHints,
  onRefreshData,
}: CosmosHeaderProps) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3 font-mono sm:p-4">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="pointer-events-auto flex min-h-14 max-w-[58vw] items-center border border-stone-800/80 bg-[#080c14]/88 px-3 py-2 shadow-2xl backdrop-blur-xl transition-colors hover:border-stone-700 sm:max-w-none sm:px-3.5">
          <ChainsPlanetaryBrandHeader />
        </div>

        <div className="pointer-events-auto flex min-h-14 items-stretch divide-x divide-stone-800/90 border border-stone-800/80 bg-[#080c14]/88 shadow-2xl backdrop-blur-xl">
          <div
            className="hidden items-center gap-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 xl:flex"
            title="Planet size is scaled by total value locked"
          >
            <Layers className="h-3.5 w-3.5 text-stone-400" />
            <span>Size: TVL</span>
          </div>

          {onRefreshData && (
            <button
              type="button"
              onClick={onRefreshData}
              disabled={isRefreshing}
              className="group flex min-w-11 items-center justify-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-stone-300 transition-colors hover:bg-stone-900/80 hover:text-stone-100 focus-visible:z-10 disabled:cursor-wait disabled:opacity-50 sm:min-w-12 lg:px-4"
              title="Refresh and sync data with Nansen API"
              aria-label={isRefreshing ? "Syncing Nansen data" : "Sync Nansen data"}
            >
              <RefreshCw
                className={`h-4 w-4 text-stone-400 ${
                  isRefreshing
                    ? "animate-spin"
                    : "group-hover:rotate-180 transition-transform duration-500"
                }`}
              />
              <span className="hidden lg:inline">
                {isRefreshing ? "SYNCING..." : "SYNC NANSEN"}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleFlows}
            aria-pressed={showFlows}
            aria-label={`${showFlows ? "Hide" : "Show"} capital vectors`}
            className={`group flex min-w-11 items-center justify-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:z-10 sm:min-w-12 lg:px-4 ${
              showFlows
                ? "bg-amber-400/10 text-amber-200"
                : "text-stone-400 hover:bg-stone-900/80 hover:text-stone-200"
            }`}
            title="Toggle Nansen capital traffic vectors (inflow/outflow)"
          >
            <ArrowRightLeft className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
            <span className="hidden md:inline">Capital vectors</span>
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                showFlows ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" : "bg-stone-600"
              }`}
            />
          </button>

          <button
            type="button"
            onClick={onToggleHints}
            aria-pressed={showHints}
            className={`flex min-w-11 items-center justify-center px-3 transition-colors focus-visible:z-10 sm:min-w-12 ${
              showHints
                ? "bg-stone-900/80 text-amber-300"
                : "text-stone-400 hover:bg-stone-900/80 hover:text-stone-100"
            }`}
            title="Show interaction guide"
            aria-label={showHints ? "Hide interaction guide" : "Show interaction guide"}
          >
            <CircleHelp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
