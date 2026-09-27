"use client";

import { useEffect, useRef, useState } from "react";
import { SmartMoneyHolding } from "@/types/cosmos";
import {
  Calendar,
  Check,
  Coins,
  Copy,
  ExternalLink,
  Layers,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

interface TokenDetailModalProps {
  token: SmartMoneyHolding | null;
  onClose: () => void;
}

export function TokenDetailModal({ token, onClose }: TokenDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!token) return;

    const previouslyFocused = document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
      );

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [token, onClose]);

  if (!token) return null;

  const isPositive = token.balance_24h_percent_change >= 0;

  const copyAddress = async () => {
    await navigator.clipboard.writeText(token.token_address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 backdrop-blur-md animate-in fade-in duration-200 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="token-dialog-title"
        className="hud-scrollbar relative flex max-h-[88dvh] w-full max-w-lg flex-col gap-4 overflow-y-auto border border-stone-700/80 bg-[#090d15]/98 p-5 font-mono text-stone-200 shadow-2xl sm:p-6"
      >
        <div className="hidden items-center justify-between border-b border-stone-800 pb-2 text-[9px] uppercase tracking-[0.14em] text-stone-500 sm:flex">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-amber-400" />
            Smart money asset record
          </span>
          <span>Powered by Nansen</span>
        </div>

        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center border border-stone-700/80 bg-stone-900/80 text-stone-400 transition-colors hover:border-amber-400/70 hover:text-amber-300 sm:right-5 sm:top-5"
          aria-label="Close token details"
          title="Close token details"
        >
          <X className="h-4 w-4" />
        </button>

        <header className="flex items-center gap-3.5 pr-12">
          <div className="flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden border border-stone-700 bg-stone-900 px-1 text-sm font-black uppercase tracking-tight text-amber-300 sm:h-14 sm:w-14">
            {token.token_symbol.slice(0, 3)}
          </div>
          <div className="min-w-0">
            <h2 id="token-dialog-title" className="truncate text-xl font-black uppercase tracking-[0.08em] text-stone-100 sm:text-2xl">
              ${token.token_symbol}
            </h2>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-stone-500 sm:text-xs">
              {token.chain} <span className="text-stone-700">/</span> Smart money holding
            </p>
          </div>
        </header>

        {token.token_sectors && token.token_sectors.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Token sectors">
            {token.token_sectors.map((sector) => (
              <span
                key={sector}
                className="border border-stone-800 bg-stone-900/70 px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-stone-400"
              >
                {sector}
              </span>
            ))}
          </div>
        )}

        <section aria-label="Token metrics" className="grid grid-cols-2 border border-stone-800/90 bg-[#0e131d]/45">
          <div className="border-b border-r border-stone-800/90 p-3.5">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              Holdings
            </span>
            <div className="mt-1.5 text-xl font-bold tabular-nums text-stone-100 sm:text-2xl">
              ${token.value_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className={`mt-1 flex items-center gap-1 text-[11px] font-semibold tabular-nums ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {isPositive ? "+" : ""}{(token.balance_24h_percent_change * 100).toFixed(2)}% · 24H
            </div>
          </div>

          <div className="border-b border-stone-800/90 p-3.5">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
              <Coins className="h-3.5 w-3.5" />
              Smart wallets
            </span>
            <div className="mt-1.5 text-xl font-bold tabular-nums text-stone-100 sm:text-2xl">
              {token.holders_count}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.1em] text-stone-500">Tracked entities</div>
          </div>

          <div className="border-r border-stone-800/90 p-3.5">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
              <Layers className="h-3.5 w-3.5" />
              Market FDV
            </span>
            <div className="mt-1.5 text-base font-bold tabular-nums text-stone-100">
              {token.market_cap_usd ? `$${(token.market_cap_usd / 1e6).toFixed(1)}M` : "N/A"}
            </div>
          </div>

          <div className="p-3.5">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
              <Calendar className="h-3.5 w-3.5" />
              Token age
            </span>
            <div className="mt-1.5 text-base font-bold tabular-nums text-stone-100">
              {token.token_age_days ? `${token.token_age_days} days` : "Active"}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-between gap-3 border border-stone-800/80 bg-[#0e131d]/30 p-3" aria-label="Contract address">
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-[0.14em] text-stone-500">Contract address</div>
            <div className="mt-1 truncate text-xs text-stone-300 sm:text-sm">{token.token_address}</div>
          </div>
          <button
            type="button"
            onClick={copyAddress}
            className={`flex min-h-10 shrink-0 items-center gap-1.5 border px-3 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              copied
                ? "border-emerald-500/45 bg-emerald-950/40 text-emerald-300"
                : "border-stone-700 bg-stone-900/80 text-stone-300 hover:border-amber-400/70 hover:text-amber-300"
            }`}
            aria-label="Copy contract address"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </section>

        <a
          href={`https://app.nansen.ai/token-god-mode?token_address=${token.token_address}&chain=${token.chain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex min-h-12 w-full items-center justify-center gap-2 bg-amber-400 px-4 text-sm font-bold uppercase tracking-[0.08em] text-stone-950 transition-colors hover:bg-amber-300"
        >
          Open in Token God Mode
          <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </div>
  );
}
