import { NextResponse } from "next/server";
import chainsCache from "@/data/chains-cache.json";
import holdingsCache from "@/data/holdings-cache.json";
import { buildCosmosUniverse, calculateNansenCapitalFlows } from "@/lib/cosmos-engine";
import { ChainMetrics, ScalingMetric, SmartMoneyHolding } from "@/types/cosmos";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scalingMetric = (searchParams.get("scaling") as ScalingMetric) || "dexVolume";
  const shouldRefresh = searchParams.get("refresh") === "true";

  let rawChains: ChainMetrics[] = (chainsCache as { data: ChainMetrics[] }).data || [];
  let holdingsMap: Record<string, SmartMoneyHolding[]> =
    (holdingsCache as Record<string, SmartMoneyHolding[]>) || {};

  // Optional live refresh using Nansen API key
  if (shouldRefresh && process.env.NANSEN_API_KEY) {
    try {
      const [rankRes, holdingsRes] = await Promise.allSettled([
        fetch("https://api.nansen.ai/api/v1/chains/chain-rank", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NANSEN_API_KEY,
          },
          body: JSON.stringify({ timeframe: 7 }),
        }),
        fetch("https://api.nansen.ai/api/v1/smart-money/holdings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NANSEN_API_KEY,
          },
          body: JSON.stringify({
            chains: ["ethereum", "base", "solana", "arbitrum", "polygon", "avalanche"],
          }),
        }),
      ]);

      if (rankRes.status === "fulfilled" && rankRes.value.ok) {
        const freshData = await rankRes.value.json();
        if (freshData?.data) {
          rawChains = freshData.data;
        }
      }

      if (holdingsRes.status === "fulfilled" && holdingsRes.value.ok) {
        const freshHoldings = await holdingsRes.value.json();
        if (freshHoldings?.data && typeof freshHoldings.data === "object") {
          holdingsMap = { ...holdingsMap, ...freshHoldings.data };
        }
      }
    } catch (err) {
      console.error("Live fetch fallback to cache:", err);
    }
  }

  const universe = buildCosmosUniverse(rawChains, holdingsMap, scalingMetric);
  const flows = calculateNansenCapitalFlows(rawChains);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    totalChainsMonitored: rawChains.length,
    planets: universe,
    flows,
    scalingMetric,
    nansenPowered: true,
  });
}
