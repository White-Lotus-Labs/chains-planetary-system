"use client";

import { useEffect, useRef, useState } from "react";
import { SmartMoneyHolding } from "@/types/cosmos";
import {
  Calendar,
  Check,
  Copy,
  ExternalLink,
  PieChart,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { ChainLogo } from "@/components/common/ChainLogo";

interface TokenDetailModalProps {
  token: SmartMoneyHolding | null;
  onClose: () => void;
}

function formatUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(abs / 1e3).toFixed(1)}K`;
  return `$${abs.toFixed(0)}`;
}

function formatAge(days?: number): string {
  if (!days) return "—";
  if (days >= 365) return `${(days / 365).toFixed(1)}y`;
  if (days >= 30) return `${Math.floor(days / 30)}mo`;
  return `${days}d`;
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
  const changePct = (token.balance_24h_percent_change * 100).toFixed(2);

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
        className="hud-scrollbar relative flex max-h-[88dvh] w-full max-w-md flex-col gap-0 overflow-y-auto border border-stone-700/80 bg-[#090d15]/98 font-mono text-stone-200 shadow-2xl"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-stone-800/80 px-4 py-2.5 text-[9px] uppercase tracking-[0.14em] text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-amber-400" />
            Smart Money Asset Record
          </span>
          <span className="text-stone-600">Powered by Nansen</span>
        </div>

        {/* Close button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-10 flex h-9 w-9 items-center justify-center border border-stone-700/80 bg-stone-900/80 text-stone-400 transition-colors hover:border-amber-400/70 hover:text-amber-300"
          aria-label="Close token details"
          title="Close token details"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Token identity */}
        <div className="flex items-center gap-4 px-5 py-5 pr-16">
          {/* Chain logo + symbol initials stacked */}
          <div className="relative shrink-0">
            <div className="flex h-14 w-14 items-center justify-center border border-stone-700 bg-stone-900 text-xs font-black uppercase tracking-tight text-amber-300">
              {token.token_symbol.slice(0, 4)}
            </div>
            <div className="absolute -bottom-1.5 -right-1.5">
              <ChainLogo chain={token.chain} size={22} className="border border-stone-900 shadow" />
            </div>
          </div>

          <div className="min-w-0">
            <h2
              id="token-dialog-title"
              className="truncate text-2xl font-black uppercase tracking-[0.06em] text-stone-100"
            >
              ${token.token_symbol}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-stone-500">
              <span className="capitalize">{token.chain}</span>
              <span className="text-stone-700">/</span>
              <span>Smart Money Holding</span>
            </p>
          </div>
        </div>

        {/* Sectors */}
        {token.token_sectors && token.token_sectors.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-stone-800/60 px-5 py-3" aria-label="Token sectors">
            {token.token_sectors.map((sector) => (
              <span
                key={sector}
                className="border border-stone-800 bg-stone-900/70 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-stone-400"
              >
                {sector}
              </span>
            ))}
          </div>
        )}

        {/* Metrics grid */}
        <section
          aria-label="Token metrics"
          className="grid grid-cols-2 border-t border-stone-800/60"
        >
          {/* Holdings */}
          <div className="border-b border-r border-stone-800/60 p-4">
            <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-stone-500">
              <ShieldCheck className="h-3 w-3" />
              SM Holdings
            </span>
            <div className="mt-2 text-2xl font-bold tabular-nums text-stone-100">
              {formatUsd(token.value_usd)}
            </div>
            <div
              className={`mt-1 flex items-center gap-1 text-[11px] font-semibold tabular-nums ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {isPositive ? "+" : ""}{changePct}% · 24h
            </div>
          </div>

          {/* Smart wallets */}
          <div className="border-b border-stone-800/60 p-4">
            <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-stone-500">
              <Users className="h-3 w-3" />
              Smart Wallets
            </span>
            <div className="mt-2 text-2xl font-bold tabular-nums text-stone-100">
              {token.holders_count.toLocaleString()}
            </div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.1em] text-stone-500">
              Tracked entities
            </div>
          </div>

          {/* Market cap */}
          <div className="border-r border-stone-800/60 p-4">
            <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-stone-500">
              <PieChart className="h-3 w-3" />
              Market Cap
            </span>
            <div className="mt-2 text-base font-bold tabular-nums text-stone-100">
              {token.market_cap_usd ? formatUsd(token.market_cap_usd) : "—"}
            </div>
          </div>

          {/* Token age + share */}
          <div className="p-4">
            <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-stone-500">
              <Calendar className="h-3 w-3" />
              Token Age
            </span>
            <div className="mt-2 text-base font-bold tabular-nums text-stone-100">
              {formatAge(token.token_age_days)}
            </div>
            {token.share_of_holdings_percent > 0 && (
              <div className="mt-1 text-[9px] uppercase tracking-[0.1em] text-stone-500">
                {(token.share_of_holdings_percent * 100).toFixed(3)}% of portfolio
              </div>
            )}
          </div>
        </section>

        {/* Contract address */}
        <section
          className="flex items-center justify-between gap-3 border-t border-stone-800/60 bg-[#0e131d]/30 px-4 py-3"
          aria-label="Contract address"
        >
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-[0.14em] text-stone-500">
              Contract
            </div>
            <div className="mt-1 truncate text-[11px] text-stone-400">
              {token.token_address}
            </div>
          </div>
          <button
            type="button"
            onClick={copyAddress}
            className={`flex min-h-9 shrink-0 items-center gap-1.5 border px-3 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              copied
                ? "border-emerald-500/45 bg-emerald-950/40 text-emerald-300"
                : "border-stone-700 bg-stone-900/80 text-stone-300 hover:border-amber-400/70 hover:text-amber-300"
            }`}
            aria-label="Copy contract address"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </section>

        {/* CTA */}
        <a
          href={`https://app.nansen.ai/token-god-mode?token_address=${token.token_address}&chain=${token.chain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex min-h-11 w-full items-center justify-center gap-2 bg-amber-400 px-4 text-sm font-bold uppercase tracking-[0.08em] text-stone-950 transition-colors hover:bg-amber-300"
        >
          Open in Token God Mode
          <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </div>
  );
}
