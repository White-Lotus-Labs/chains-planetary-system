import {
  ChainMetrics,
  CosmosPlanet,
  CosmosPlanetConfig,
  InterplanetaryFlow,
  PlanetCapitalVector,
  ScalingMetric,
  SmartMoneyHolding,
} from "@/types/cosmos";

export const PLANET_CONFIGS: Record<string, CosmosPlanetConfig> = {
  sonic: {
    id: "sonic",
    name: "Sonic",
    symbol: "S",
    category: "Emerging Ecosystem",
    description: "Sub-second finality upgraded network with massive TPS throughput.",
    planetType: "cratered",
    color: "#A05244",
    secondaryColor: "#C47466",
    accentColor: "#F5D5CE",
    atmosphereColor: "#E09F94",
    roughness: 0.45,
    hasRings: true,
    ringColor: "#BD7769",
    orbitRadius: 28,
    baseRadius: 0.95,
    tilt: 0.3,
  },
  base: {
    id: "base",
    name: "Base",
    symbol: "BASE",
    category: "EVM L2",
    description: "Coinbase's hyper-active Layer-2 ecosystem driving retail and Smart Money DEX velocity.",
    planetType: "terrestrial",
    color: "#2B6CB0",
    secondaryColor: "#319795",
    accentColor: "#EDF2F7",
    atmosphereColor: "#63B3ED",
    roughness: 0.45,
    hasRings: true,
    ringColor: "#4299E1",
    orbitRadius: 44,
    baseRadius: 1.25,
    tilt: 0.2,
  },
  hyperevm: {
    id: "hyperevm",
    name: "HyperEVM",
    symbol: "HYPE",
    category: "AppChain / Perp",
    description: "Hyperliquid's native EVM chain powering sovereign high-frequency order books and perp whales.",
    planetType: "ice",
    color: "#4A7C8A",
    secondaryColor: "#729B9C",
    accentColor: "#F0FDF4",
    atmosphereColor: "#A5D8D8",
    roughness: 0.25,
    hasRings: true,
    ringColor: "#BCE3E3",
    orbitRadius: 60,
    baseRadius: 1.15,
    tilt: 0.12,
  },
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    category: "EVM L1",
    description: "The primary settlement layer and institutional capital anchor of Web3.",
    planetType: "gas_giant",
    color: "#3D5A80",
    secondaryColor: "#293241",
    accentColor: "#E0FBFC",
    atmosphereColor: "#98C1D9",
    roughness: 0.35,
    hasRings: true,
    ringColor: "#829AB1",
    orbitRadius: 78,
    baseRadius: 1.6,
    tilt: 0.15,
  },
  arbitrum: {
    id: "arbitrum",
    name: "Arbitrum One",
    symbol: "ARB",
    category: "EVM L2",
    description: "Deep institutional DeFi liquidity and Nitro execution environment.",
    planetType: "boreal",
    color: "#3B597B",
    secondaryColor: "#4A708B",
    accentColor: "#D9E2EC",
    atmosphereColor: "#829AB1",
    roughness: 0.4,
    hasRings: false,
    orbitRadius: 96,
    baseRadius: 1.2,
    tilt: 0.18,
  },
  solana: {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    category: "High-Perf Alt-L1",
    description: "The monolithic high-throughput giant dominating DEX trading volume and retail liquidity.",
    planetType: "gas_giant",
    color: "#2F6752",
    secondaryColor: "#5B8E7D",
    accentColor: "#B8A9C9",
    atmosphereColor: "#7DBFA5",
    roughness: 0.3,
    hasRings: true,
    ringColor: "#9D8BAE",
    orbitRadius: 116,
    baseRadius: 1.5,
    tilt: 0.28,
  },
  polygon: {
    id: "polygon",
    name: "Polygon",
    symbol: "POL",
    category: "EVM L2",
    description: "Aggregated liquidity layer with high daily transaction throughput.",
    planetType: "terrestrial",
    color: "#534666",
    secondaryColor: "#76688B",
    accentColor: "#DDD6FE",
    atmosphereColor: "#9F8FB3",
    roughness: 0.5,
    hasRings: false,
    orbitRadius: 134,
    baseRadius: 1.1,
    tilt: 0.1,
  },
  bnb: {
    id: "bnb",
    name: "BNB Chain",
    symbol: "BNB",
    category: "EVM L1",
    description: "Massive retail user base and high daily transaction volume.",
    planetType: "gas_giant",
    color: "#C28B38",
    secondaryColor: "#D9A756",
    accentColor: "#FFF5EB",
    atmosphereColor: "#E6C285",
    roughness: 0.35,
    hasRings: true,
    ringColor: "#D1A763",
    orbitRadius: 152,
    baseRadius: 1.4,
    tilt: 0.22,
  },
  avalanche: {
    id: "avalanche",
    name: "Avalanche",
    symbol: "AVAX",
    category: "EVM L1",
    description: "Subnet architecture with high-speed consensus and institutional subnet trials.",
    planetType: "volcanic",
    color: "#8C3B30",
    secondaryColor: "#B35446",
    accentColor: "#F4A261",
    atmosphereColor: "#D68C83",
    roughness: 0.55,
    hasRings: false,
    orbitRadius: 168,
    baseRadius: 1.1,
    tilt: 0.25,
  },
  optimism: {
    id: "optimism",
    name: "Optimism",
    symbol: "OP",
    category: "EVM L2",
    description: "Superchain hub powering OP Stack rollups and collective decentralized governance.",
    planetType: "terrestrial",
    color: "#8B2E2E",
    secondaryColor: "#B84A4A",
    accentColor: "#FEE2E2",
    atmosphereColor: "#E57373",
    roughness: 0.45,
    hasRings: false,
    orbitRadius: 184,
    baseRadius: 1.05,
    tilt: 0.16,
  },
  mantle: {
    id: "mantle",
    name: "Mantle",
    symbol: "MNT",
    category: "EVM L2",
    description: "Modular rollup with EigenDA data availability and institutional treasury.",
    planetType: "boreal",
    color: "#285344",
    secondaryColor: "#487A64",
    accentColor: "#C6E2D5",
    atmosphereColor: "#78A994",
    roughness: 0.4,
    hasRings: false,
    orbitRadius: 198,
    baseRadius: 1.0,
    tilt: 0.14,
  },
};

export function calculatePlanetaryPhysics(
  metrics: ChainMetrics,
  config: CosmosPlanetConfig,
  scalingMetric: ScalingMetric = "dexVolume"
): { calculatedRadius: number; orbitSpeed: number; statusAura: "bullish" | "bearish" | "neutral" } {
  // 1. Dynamic Radius based on metric
  let metricValue = 1;
  switch (scalingMetric) {
    case "dexVolume":
      metricValue = metrics.total_dex_volume_usd || 100_000;
      break;
    case "tvl":
      metricValue = metrics.tvl_usd || 100_000;
      break;
    case "txCount":
      metricValue = (metrics.transaction_count || 10_000) * 10;
      break;
    case "activeUsers":
      metricValue = (metrics.active_address_count_txs || 1_000) * 500;
      break;
  }

  // Logarithmic scaling with visual dampening (calibrated to contrast against Sun radius 10.5)
  const logVal = Math.log10(Math.max(10_000, metricValue));
  const scale = 0.75 + (logVal - 4) * 0.14;
  const calculatedRadius = Math.max(0.9, Math.min(2.5, config.baseRadius * scale));

  // 2. Harmonic Keplerian Orbital Period (Variable celestial velocities - inner planets cycle faster, outer drift majestically)
  // Angular velocity follows Keplerian decay: omega ~ (refRadius / orbitRadius)^1.15
  const refOrbit = 75;
  const keplerBase = Math.pow(refOrbit / Math.max(20, config.orbitRadius), 1.15);

  // Modulation based on on-chain transaction velocity (Nansen metric)
  const txBase = Math.log10(Math.max(1_000, metrics.transaction_count || 50_000));
  const txMultiplier = 0.88 + Math.min(0.3, Math.max(0, (txBase - 3) * 0.07));
  const orbitSpeed = Math.max(0.2, Math.min(3.8, keplerBase * txMultiplier));

  // 3. Status Aura based on 24h/7d momentum
  const dexChange = metrics.total_dex_volume_usd_percent_change || 0;
  const txChange = metrics.transaction_count_percent_change || 0;
  let statusAura: "bullish" | "bearish" | "neutral" = "neutral";
  if (dexChange > 0.15 || txChange > 0.2) {
    statusAura = "bullish";
  } else if (dexChange < -0.15 || txChange < -0.15) {
    statusAura = "bearish";
  }

  return { calculatedRadius, orbitSpeed, statusAura };
}

export function buildCosmosUniverse(
  rawChains: ChainMetrics[],
  holdingsMap: Record<string, SmartMoneyHolding[]>,
  scalingMetric: ScalingMetric = "dexVolume"
): CosmosPlanet[] {
  const chainDict: Record<string, ChainMetrics> = {};
  for (const c of rawChains) {
    chainDict[c.chain.toLowerCase()] = c;
  }

  const planets: CosmosPlanet[] = [];

  for (const [id, config] of Object.entries(PLANET_CONFIGS)) {
    const metrics = chainDict[id] || {
      chain: id,
      transaction_count: 0,
      transaction_count_percent_change: 0,
      total_gas_used_usd: 0,
      total_gas_used_usd_percent_change: 0,
      total_dex_volume_usd: 0,
      total_dex_volume_usd_percent_change: 0,
      active_address_count_traces: 0,
      active_address_count_traces_percent_change: 0,
      active_address_count_txs: 0,
      active_address_count_txs_percent_change: 0,
      revenue_usd: 0,
      revenue_usd_percent_change: 0,
      tvl_usd: 0,
      tvl_usd_percent_change: 0,
    };

    const physics = calculatePlanetaryPhysics(metrics, config, scalingMetric);
    const rawHoldings = holdingsMap[id] || [];

    // Deterministic axial rotation speed based on Nansen transaction throughput
    const txVolume = metrics.transaction_count || 50_000;
    const rotationSpeed =
      0.5 +
      Math.min(
        0.8,
        Math.max(0, (Math.log10(Math.max(1_000, txVolume)) - 3) * 0.15)
      );

    planets.push({
      ...config,
      metrics,
      calculatedRadius: physics.calculatedRadius,
      orbitSpeed: physics.orbitSpeed,
      rotationSpeed,
      smartMoneyHoldings: rawHoldings,
      statusAura: physics.statusAura,
    });
  }

  return planets;
}

/**
 * Calculates open-ended planetary capital traffic vectors using 100% real Nansen metrics.
 *
 * Each planet with active capital movement gets its own independent arrival (inflow) or departure (outflow) vector:
 * - Inbound: Chains with positive 7D TVL growth (capital entering the ecosystem from the broader market).
 * - Outbound: Chains with negative 7D TVL growth (capital exiting the ecosystem into the broader market).
 *
 * NO COUNTERPARTY PAIRING: Eliminates synthetic inter-planet bridge assumptions while keeping
 * dynamic spaceflight traffic visuals faithful to empirical Nansen data.
 */
export function calculatePlanetTrafficVectors(
  rawChains: ChainMetrics[]
): PlanetCapitalVector[] {
  const chainDict: Record<string, ChainMetrics> = {};
  for (const c of rawChains) {
    chainDict[c.chain.toLowerCase()] = c;
  }

  const configuredPlanets = Object.keys(PLANET_CONFIGS);
  const vectors: PlanetCapitalVector[] = [];

  for (const id of configuredPlanets) {
    const metrics = chainDict[id];
    if (!metrics) continue;

    const tvl = metrics.tvl_usd || 0;
    const pct = metrics.tvl_usd_percent_change;

    if (tvl <= 0 || pct === null || pct === undefined) continue;

    // Exact 7D dollar delta: tvl * (pct / (1 + pct))
    const deltaUsd = tvl * (pct / (1 + pct));
    const absDelta = Math.abs(deltaUsd);

    // Filter insignificant micro-fluctuations (< $100k)
    if (absDelta < 100_000) continue;

    const direction: "inbound" | "outbound" = deltaUsd >= 0 ? "inbound" : "outbound";
    const planetName = PLANET_CONFIGS[id]?.name || id;

    const formattedDelta =
      absDelta >= 1e9
        ? `$${(absDelta / 1e9).toFixed(2)}B`
        : `$${(absDelta / 1e6).toFixed(1)}M`;

    const description =
      direction === "inbound"
        ? `Nansen 7D Inbound Capital: +${formattedDelta} expansion into ${planetName}`
        : `Nansen 7D Outbound Capital: -${formattedDelta} contraction from ${planetName}`;

    // Intensity scaled between 0.2 and 1.0 based on delta magnitude (up to $200M)
    const intensity = Math.max(0.2, Math.min(1.0, absDelta / 200_000_000));

    vectors.push({
      planetId: id,
      direction,
      intensity,
      deltaUsd: Math.round(deltaUsd),
      percentChange: pct,
      description,
      // Compatibility fields
      fromPlanetId: direction === "outbound" ? id : "cosmos",
      toPlanetId: direction === "inbound" ? id : "cosmos",
      volumeUsd: Math.round(absDelta),
    });
  }

  // Sort by highest absolute dollar movement
  vectors.sort((a, b) => Math.abs(b.deltaUsd) - Math.abs(a.deltaUsd));
  return vectors;
}

export const calculateNansenCapitalFlows = calculatePlanetTrafficVectors;

// Dynamic default flows derived from chains cache for backwards compatibility
import chainsCache from "@/data/chains-cache.json";
export const INTERPLANETARY_FLOWS: InterplanetaryFlow[] = calculatePlanetTrafficVectors(
  (chainsCache as { data: ChainMetrics[] }).data || []
);
