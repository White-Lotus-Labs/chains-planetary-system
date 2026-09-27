"use client";

import { CircleHelp, Film, Layers } from "lucide-react";
import { useEffect, useState } from "react";

import { ChainsPlanetaryBrandHeader } from "@/components/common/ChainsPlanetaryLogo";
import { CapitalMigrationDropdown } from "@/components/hud/CapitalMigrationHUD";
import { CosmosPlanet } from "@/types/cosmos";

interface CosmosHeaderProps {
  planets: CosmosPlanet[];
  showHints: boolean;
  lastSync?: string | null;
  isCinematicTour?: boolean;
  onSelectPlanet: (planet: CosmosPlanet) => void;
  onToggleHints: () => void;
  onToggleCinematicTour?: () => void;
}

function formatRelativeTime(timestamp: string | null | undefined) {
  if (!timestamp) return "—";

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (elapsedSeconds < 60) return "just now";
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  return `${elapsedHours} hr ago`;
}

export function CosmosHeader({
  planets,
  showHints,
  lastSync,
  isCinematicTour = false,
  onSelectPlanet,
  onToggleHints,
  onToggleCinematicTour,
}: CosmosHeaderProps) {
  const [, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 30_000);

    return () => window.clearInterval(interval);
  }, []);

  const relativeLastSync = formatRelativeTime(lastSync);

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3 font-mono sm:p-4">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="pointer-events-auto flex min-h-14 max-w-[58vw] items-center border border-stone-800/80 bg-[#080c14]/88 px-3.5 py-2 shadow-2xl backdrop-blur-xl transition-colors hover:border-stone-700 sm:max-w-none sm:min-h-16 sm:px-4">
          <ChainsPlanetaryBrandHeader />
        </div>

        <div className="pointer-events-auto flex min-h-14 items-stretch divide-x divide-stone-800/90 border border-stone-800/80 bg-[#080c14]/88 shadow-2xl backdrop-blur-xl sm:min-h-16">
          {/* TVL Scale Indicator */}
          <div
            className="hidden items-center gap-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 xl:flex"
            title="Planet size is scaled by total value locked"
          >
            <Layers className="h-3.5 w-3.5 text-stone-400" />
            <span>Size: TVL</span>
          </div>

          {/* Cinematic Tour Toggle Button */}
          {onToggleCinematicTour && (
            <button
              type="button"
              onClick={onToggleCinematicTour}
              aria-pressed={isCinematicTour}
              className={`group flex min-w-11 items-center justify-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider transition-all focus-visible:z-10 sm:min-w-12 lg:px-4 ${
                isCinematicTour
                  ? "bg-amber-950/60 text-amber-300 border-b-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                  : "text-stone-300 hover:bg-stone-900/80 hover:text-amber-300"
              }`}
              title="Toggle Cinematic Director Tour (Hotkey: C)"
              aria-label={isCinematicTour ? "Exit Cinematic Tour" : "Start Cinematic Tour"}
            >
              <Film
                className={`h-4 w-4 ${
                  isCinematicTour ? "text-amber-400 animate-pulse" : "text-stone-400 group-hover:text-amber-400"
                }`}
              />
              <span className="hidden sm:inline">
                {isCinematicTour ? "TOUR LIVE" : "CINEMATIC"}
              </span>
              <span className="hidden md:inline-block text-[9px] px-1.5 py-0.5 rounded bg-stone-800/80 text-stone-400 border border-stone-700/50">
                C
              </span>
            </button>
          )}

          {/* Last data sync */}
          <div
            className="hidden items-center px-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-stone-500 xl:flex lg:px-4"
            title={lastSync ? `Data loaded at ${new Date(lastSync).toLocaleString()}` : "Data sync pending"}
          >
            <span>Last sync: {relativeLastSync}</span>
          </div>

          {/* Migration Dropdown */}
          <CapitalMigrationDropdown
            planets={planets}
            onSelectPlanet={onSelectPlanet}
          />

          {/* Hints Guide Toggle */}
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
