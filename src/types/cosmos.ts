import { PlanetTextureType } from "@/lib/planet-textures";

export interface ChainMetrics {
  chain: string;
  transaction_count: number;
  transaction_count_percent_change: number | null;
  successful_transaction_count?: number | null;
  successful_transaction_count_percent_change?: number | null;
  total_gas_used_usd: number;
  total_gas_used_usd_percent_change: number | null;
  total_dex_volume_usd: number | null;
  total_dex_volume_usd_percent_change: number | null;
  active_address_count_traces: number;
  active_address_count_traces_percent_change: number | null;
  active_address_count_txs: number;
  active_address_count_txs_percent_change: number | null;
  revenue_usd: number;
  revenue_usd_percent_change: number | null;
  tvl_usd: number;
  tvl_usd_percent_change: number | null;
}

export interface SmartMoneyHolding {
  chain: string;
  token_address: string;
  token_symbol: string;
  token_sectors: string[];
  value_usd: number;
  balance_24h_percent_change: number;
  holders_count: number;
  share_of_holdings_percent: number;
  token_age_days?: number;
  market_cap_usd?: number;
}

export type CosmosCategory =
  | "EVM L1"
  | "EVM L2"
  | "High-Perf Alt-L1"
  | "AppChain / Perp"
  | "Emerging Ecosystem";

export interface CosmosPlanetConfig {
  id: string;
  name: string;
  symbol: string;
  category: CosmosCategory;
  description: string;
  planetType: PlanetTextureType;
  color: string; // Primary base color
  secondaryColor: string; // Natural terrain / band color
  accentColor: string; // Cloud / storm / mineral accent
  atmosphereColor: string; // Soft Rayleigh scattering haze
  roughness: number;
  hasRings: boolean;
  ringColor?: string;
  ringInnerRadius?: number;
  ringOuterRadius?: number;
  orbitRadius: number;
  baseRadius: number;
  tilt: number;
}

export interface CosmosPlanet extends CosmosPlanetConfig {
  metrics: ChainMetrics;
  calculatedRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  smartMoneyHoldings: SmartMoneyHolding[];
  statusAura: "bullish" | "bearish" | "neutral";
}

export interface PlanetCapitalVector {
  planetId: string;
  direction: "inbound" | "outbound";
  intensity: number;
  deltaUsd: number;
  percentChange: number;
  description: string;
  // Compatibility fields for legacy components
  fromPlanetId: string;
  toPlanetId: string;
  volumeUsd: number;
}

export type InterplanetaryFlow = PlanetCapitalVector;

export type ScalingMetric = "dexVolume" | "tvl" | "txCount" | "activeUsers";
