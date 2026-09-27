"use client";

import { useEffect } from "react";
import { CosmosPlanet, SmartMoneyHolding } from "@/types/cosmos";
import {
  ArrowLeft,
  ArrowRightLeft,
  ChevronRight,
  Coins,
  Layers,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { ChainLogo } from "@/components/common/ChainLogo";

interface PlanetDetailPanelProps {
  planet: CosmosPlanet | null;
  onClose: () => void;
  onSelectToken: (token: SmartMoneyHolding) => void;
}

function formatCompactUsd(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${(abs / 1e9).toFixed(2)}B`;
  return `$${(abs / 1e6).toFixed(abs >= 100e6 ? 0 : 1)}M`;
}

export function PlanetDetailPanel({
  planet,
  onClose,
  onSelectToken,
}: PlanetDetailPanelProps) {
  useEffect(() => {
    if (!planet) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [planet, onClose]);

  if (!planet) return null;

  const m = planet.metrics;
  const dexChange = m.total_dex_volume_usd_percent_change || 0;
  const isDexPositive = dexChange >= 0;

  const tvl = m.tvl_usd || 0;
  const tvlPct = m.tvl_usd_percent_change;
  const hasTvlDelta = tvl > 0 && tvlPct !== null && tvlPct !== undefined;
  const tvlDeltaUsd = hasTvlDelta ? tvl * (tvlPct / (1 + tvlPct)) : 0;
  const isTvlDeltaPositive = tvlDeltaUsd >= 0;
  const topHoldings = planet.smartMoneyHoldings?.slice(0, 4) || [];

  return (
    <aside
      aria-label={`${planet.name} chain inspector`}
      className="hud-scrollbar fixed inset-x-3 bottom-3 z-40 flex max-h-[72dvh] flex-col overflow-y-auto border border-stone-700/80 bg-[#090d15]/96 p-4 font-mono text-stone-200 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom duration-200 md:inset-x-auto md:bottom-auto md:right-4 md:top-24 md:max-h-[calc(100dvh-7rem)] md:w-[380px] md:p-5 md:slide-in-from-right"
    >
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-700 md:hidden" aria-hidden="true" />

      <header className="flex items-center gap-3 border-b border-stone-800/90 pb-3.5">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center border border-stone-700/80 bg-stone-900/70 text-stone-400 transition-colors hover:border-amber-400/70 hover:text-amber-300"
          title="Back to system view"
          aria-label="Back to system view"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <ChainLogo
          chain={planet.id}
          size={38}
          className="shrink-0 border border-stone-700 shadow-md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-black uppercase tracking-[0.08em] text-stone-100 sm:text-lg">
              {planet.name}
            </h2>
            <span className="border border-amber-500/35 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
              {planet.symbol}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.12em] text-stone-500">
            {planet.category} <span className="text-stone-700">/</span> Orbit {planet.orbitRadius} AU
          </p>
        </div>
      </header>

      <section aria-label="Primary metrics" className="mt-3.5 grid grid-cols-2 divide-x divide-stone-800/90 border border-stone-800/90 bg-[#0e131d]/55">
        <div className="p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            <Layers className="h-3.5 w-3.5 text-stone-400" />
            TVL
          </div>
          <div className="mt-1.5 text-2xl font-bold tabular-nums text-stone-50">
            {tvl ? formatCompactUsd(tvl) : "N/A"}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-stone-500">
            Current value
          </div>
        </div>

        <div className="p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            <Coins className="h-3.5 w-3.5 text-stone-400" />
            DEX volume · 7D
          </div>
          <div className="mt-1.5 text-2xl font-bold tabular-nums text-stone-50">
            {formatCompactUsd(m.total_dex_volume_usd || 0)}
          </div>
          <div
            className={`mt-1 flex items-center gap-1 text-[11px] font-semibold tabular-nums ${
              isDexPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {isDexPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isDexPositive ? "+" : ""}{(dexChange * 100).toFixed(1)}%
          </div>
        </div>
      </section>

      <section aria-label="Network activity" className="mt-2 divide-y divide-stone-800/80 border border-stone-800/80 bg-[#0e131d]/30">
        <div className="grid grid-cols-2 divide-x divide-stone-800/80">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <Users className="h-3.5 w-3.5 shrink-0 text-stone-500" />
            <div>
              <div className="text-sm font-semibold tabular-nums text-stone-200">
                {((m.active_address_count_txs || 0) / 1e3).toFixed(1)}k
              </div>
              <div className="text-[9px] uppercase tracking-[0.12em] text-stone-500">Active addresses</div>
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="text-sm font-semibold tabular-nums text-stone-200">
              {((m.transaction_count || 0) / 1e6).toFixed(2)}M
            </div>
            <div className="text-[9px] uppercase tracking-[0.12em] text-stone-500">Transactions</div>
          </div>
        </div>

        {hasTvlDelta && tvlPct !== 0 && (
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
              <ArrowRightLeft className="h-3.5 w-3.5 text-stone-500" />
              Capital delta · 7D
            </span>
            <span
              className={`text-sm font-bold tabular-nums ${
                isTvlDeltaPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isTvlDeltaPositive ? "+" : "-"}{formatCompactUsd(tvlDeltaUsd)}
            </span>
          </div>
        )}
      </section>

      {topHoldings.length > 0 && (
        <section className="mt-4" aria-labelledby="smart-money-heading">
          <div className="mb-2 flex items-center justify-between">
            <h3 id="smart-money-heading" className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-300">
              Smart money holdings
            </h3>
            <span className="text-[10px] uppercase tracking-wider text-stone-600">Top {topHoldings.length}</span>
          </div>

          <div className="divide-y divide-stone-800/80 border border-stone-800/80 bg-[#0e131d]/35">
            {topHoldings.map((token, index) => {
              const isPositive = token.balance_24h_percent_change >= 0;
              return (
                <button
                  key={token.token_address || index}
                  type="button"
                  onClick={() => onSelectToken(token)}
                  className="group flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-[#151b27] focus-visible:z-10"
                >
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="font-bold text-stone-100 transition-colors group-hover:text-amber-300">
                      ${token.token_symbol}
                    </span>
                    <span className="truncate text-[10px] text-stone-500">
                      {token.holders_count} wallets
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-2.5 tabular-nums">
                    <span className="text-xs font-semibold text-stone-300">
                      ${((token.value_usd || 0) / 1e3).toFixed(0)}k
                    </span>
                    <span className={`w-10 text-right text-[11px] font-semibold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                      {isPositive ? "+" : ""}{(token.balance_24h_percent_change * 100).toFixed(0)}%
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-stone-600 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-300" />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </aside>
  );
}
