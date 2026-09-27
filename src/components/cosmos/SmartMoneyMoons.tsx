"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { SmartMoneyHolding } from "@/types/cosmos";

interface SmartMoneyMoonsProps {
  holdings: SmartMoneyHolding[];
  planetRadius: number;
  isPlanetSelected: boolean;
  onSelectToken?: (token: SmartMoneyHolding) => void;
}

export function SmartMoneyMoons({
  holdings,
  planetRadius,
  isPlanetSelected,
  onSelectToken,
}: SmartMoneyMoonsProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Take top 8 holdings for aesthetic balance
  const activeHoldings = holdings.slice(0, 8);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.35;
    }
  });

  if (!activeHoldings.length) return null;

  return (
    <group ref={groupRef}>
      {activeHoldings.map((token, index) => {
        const count = activeHoldings.length;
        const angle = (index / count) * Math.PI * 2;
        const orbitDist = planetRadius + 1.8 + (index % 3) * 0.8;
        const x = Math.cos(angle) * orbitDist;
        const z = Math.sin(angle) * orbitDist;
        const y = Math.sin(index * 1.5) * 0.4;

        // Size scaled by value
        const valLog = Math.log10(Math.max(10_000, token.value_usd));
        const moonRadius = 0.2 + (valLog - 4) * 0.08;

        const isPositive = token.balance_24h_percent_change >= 0;
        const moonBaseColor = isPositive ? "#3FA372" : "#D96B50";
        const moonEmissive = isPositive ? "#236341" : "#8A3222";

        return (
          <group key={token.token_address || index} position={[x, y, z]}>
            {/* Natural Mineral Moon Body */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelectToken?.(token);
              }}
            >
              <sphereGeometry args={[moonRadius, 16, 16]} />
              <meshStandardMaterial
                color={moonBaseColor}
                emissive={moonEmissive}
                emissiveIntensity={isPlanetSelected ? 0.45 : 0.2}
                roughness={0.65}
                metalness={0.1}
              />
            </mesh>


            {/* Micro Badge for selected planet */}
            {isPlanetSelected && (
              <Html
                position={[0, moonRadius + 0.35, 0]}
                center
                distanceFactor={15}
                className="pointer-events-none"
              >
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-950/85 backdrop-blur-md border border-stone-700/50 text-xs font-mono text-stone-200 whitespace-nowrap shadow-lg">
                  <span className="font-bold text-amber-300">
                    ${token.token_symbol}
                  </span>
                  <span
                    className={
                      isPositive ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"
                    }
                  >
                    {isPositive ? "+" : ""}
                    {(token.balance_24h_percent_change * 100).toFixed(1)}%
                  </span>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
