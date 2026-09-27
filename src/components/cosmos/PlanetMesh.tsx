"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { CosmosPlanet } from "@/types/cosmos";
import { getPlanetTextures, getRingTexture } from "@/lib/planet-textures";
import { ChainLogo } from "@/components/common/ChainLogo";

const ATMOSPHERE_VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float facing = abs(dot(normalize(vWorldNormal), viewDirection));
    float rim = pow(1.0 - facing, 2.35);
    float atmosphere = rim * uIntensity;
    gl_FragColor = vec4(uColor, atmosphere);
  }
`;

interface PlanetMeshProps {
  planet: CosmosPlanet;
  initialAngle: number;
  isSelected: boolean;
  isHovered: boolean;
  isConnectedToHoveredFlow?: boolean;
  globalSpeed: number;
  isInteractive?: boolean;
  onHover: (id: string | null) => void;
  onSelect: (planet: CosmosPlanet) => void;
  onUpdatePosition: (id: string, pos: [number, number, number]) => void;
}

export function PlanetMesh({
  planet,
  initialAngle,
  isSelected,
  isHovered,
  isConnectedToHoveredFlow = false,
  globalSpeed,
  isInteractive = true,
  onHover,
  onSelect,
  onUpdatePosition,
}: PlanetMeshProps) {
  const planetGroupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  // Orbital radius and calculated radius
  const { orbitRadius, calculatedRadius, tilt, hasRings } = planet;

  // Base orbital angle
  const angleRef = useRef(initialAngle);

  // Procedural Natural Planetary Textures
  const { map, bumpMap, roughnessMap, emissiveMap, cloudMap } = useMemo(() => {
    return getPlanetTextures(
      planet.planetType || "gas_giant",
      planet.color,
      planet.secondaryColor || planet.color,
      planet.accentColor || "#ffffff",
      Math.round(orbitRadius * 17)
    );
  }, [planet, orbitRadius]);

  const atmosphereUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(planet.atmosphereColor) },
      uIntensity: { value: 0.7 },
    }),
    [planet.atmosphereColor]
  );

  const materialProfile = useMemo(() => {
    switch (planet.planetType) {
      case "ice":
        return { clearcoat: 0.55, clearcoatRoughness: 0.24, emissiveIntensity: 0.1 };
      case "gas_giant":
        return { clearcoat: 0.16, clearcoatRoughness: 0.62, emissiveIntensity: 0.08 };
      case "volcanic":
        return { clearcoat: 0.04, clearcoatRoughness: 0.86, emissiveIntensity: 1.4 };
      case "terrestrial":
      case "boreal":
        return { clearcoat: 0.22, clearcoatRoughness: 0.38, emissiveIntensity: 0.5 };
      default:
        return { clearcoat: 0.03, clearcoatRoughness: 0.9, emissiveIntensity: 0.04 };
    }
  }, [planet.planetType]);

  // Procedural Natural Ring Texture
  const ringTexture = useMemo(() => {
    if (!planet.hasRings) return null;
    const ratio =
      planet.ringInnerRadius && planet.ringOuterRadius
        ? planet.ringInnerRadius / planet.ringOuterRadius
        : 0.65;
    return getRingTexture(planet.ringColor || planet.color, ratio);
  }, [planet]);

  useFrame((_, delta) => {
    // 1. Advance orbital angle
    angleRef.current += planet.orbitSpeed * 0.05 * globalSpeed * delta;

    const x = Math.cos(angleRef.current) * orbitRadius;
    const z = Math.sin(angleRef.current) * orbitRadius;
    const y = 0;

    if (planetGroupRef.current) {
      planetGroupRef.current.position.set(x, y, z);
      onUpdatePosition(planet.id, [x, y, z]);
    }

    // 2. Axial rotation
    if (meshRef.current) {
      meshRef.current.rotation.y += planet.rotationSpeed * delta;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += planet.rotationSpeed * delta * 1.08;
    }
  });

  const auraColor =
    planet.statusAura === "bullish"
      ? "#34D399" // natural jade / sage
      : planet.statusAura === "bearish"
      ? "#E06D53" // natural terracotta / sienna
      : "#94A3B8"; // natural celestial mist slate

  const isHighlighted = isHovered || isSelected || isConnectedToHoveredFlow;
  const isOrbitHighlighted = !isSelected && (isHovered || isConnectedToHoveredFlow);

  return (
    <>
      {/* Orbital Path Ring (Crisp, High-Visibility Celestial Navigation Ring) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry
          args={[
            orbitRadius - (isOrbitHighlighted ? 0.3 : 0.14),
            orbitRadius + (isOrbitHighlighted ? 0.3 : 0.14),
            128,
          ]}
        />
        <meshBasicMaterial
          color={isOrbitHighlighted ? (planet.accentColor || planet.color) : "#94A3B8"}
          transparent
          opacity={isSelected ? 0.045 : isOrbitHighlighted ? 0.72 : 0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Radiant Outer Bloom Halo when orbit/planet is hovered, selected, or connected to active flow */}
      {isOrbitHighlighted && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry
            args={[
              Math.max(1, orbitRadius - 0.9),
              orbitRadius + 0.9,
              128,
            ]}
          />
          <meshBasicMaterial
            color={planet.accentColor || planet.color}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Invisible Expanded Hit-Test Ring for effortless orbit hovering & clicking */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={(e) => {
          if (!isInteractive) return;
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          onHover(planet.id);
        }}
        onPointerOut={() => {
          if (!isInteractive) return;
          document.body.style.cursor = "auto";
          onHover(null);
        }}
        onClick={(e) => {
          if (!isInteractive) return;
          e.stopPropagation();
          onSelect(planet);
        }}
      >
        <ringGeometry args={[Math.max(1, orbitRadius - 2.2), orbitRadius + 2.2, 80]} />
        <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Moving Planetary System Group */}
      <group ref={planetGroupRef}>
        <group rotation={[tilt, 0, 0]}>
          {/* Planet sphere with seamless albedo, relief, roughness, and night-light maps. */}
          <mesh
            ref={meshRef}
            onClick={(e) => {
              if (!isInteractive) return;
              e.stopPropagation();
              onSelect(planet);
            }}
            onPointerOver={(e) => {
              if (!isInteractive) return;
              e.stopPropagation();
              document.body.style.cursor = "pointer";
              onHover(planet.id);
            }}
            onPointerOut={() => {
              if (!isInteractive) return;
              document.body.style.cursor = "auto";
              onHover(null);
            }}
          >
            <sphereGeometry args={[calculatedRadius, 72, 72]} />
            <meshPhysicalMaterial
              map={map}
              bumpMap={bumpMap}
              bumpScale={planet.planetType === "cratered" ? 0.12 : 0.075}
              roughnessMap={roughnessMap}
              roughness={0.94}
              metalness={0.015}
              clearcoat={materialProfile.clearcoat}
              clearcoatRoughness={materialProfile.clearcoatRoughness}
              emissive="#ffffff"
              emissiveMap={emissiveMap}
              emissiveIntensity={materialProfile.emissiveIntensity}
            />
          </mesh>

          {/* Independent high-altitude cloud layer creates real parallax over land. */}
          {cloudMap && (
            <mesh ref={cloudRef} scale={1.018} raycast={() => null}>
              <sphereGeometry args={[calculatedRadius, 64, 64]} />
              <meshPhysicalMaterial
                map={cloudMap}
                transparent
                opacity={0.82}
                alphaTest={0.025}
                depthWrite={false}
                roughness={0.92}
                metalness={0}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}

          {/* Fresnel atmosphere: nearly invisible head-on, luminous at the limb. */}
          <mesh scale={1.055} raycast={() => null}>
            <sphereGeometry args={[calculatedRadius, 64, 64]} />
            <shaderMaterial
              vertexShader={ATMOSPHERE_VERTEX_SHADER}
              fragmentShader={ATMOSPHERE_FRAGMENT_SHADER}
              uniforms={atmosphereUniforms}
              transparent
              depthWrite={false}
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>

          {/* Highlighted worlds receive a restrained outer status glow. */}
          {isHighlighted && (
            <mesh scale={1.16} raycast={() => null}>
              <sphereGeometry args={[calculatedRadius, 48, 48]} />
              <meshBasicMaterial
                color={auraColor}
                transparent
                opacity={0.055}
                depthWrite={false}
                side={THREE.BackSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          )}

          {/* Planetary Dust / Ice Rings */}
          {hasRings && ringTexture && (
            <mesh rotation={[-Math.PI / 2.3, 0, 0]} raycast={() => null}>
              <ringGeometry
                args={[
                  calculatedRadius * 1.35,
                  calculatedRadius * 2.15,
                  64,
                ]}
              />
              <meshStandardMaterial
                map={ringTexture}
                transparent
                opacity={0.92}
                side={THREE.DoubleSide}
                roughness={0.66}
                metalness={0.015}
                emissive={planet.ringColor || planet.color}
                emissiveIntensity={0.08}
                alphaTest={0.015}
                depthWrite={false}
              />
            </mesh>
          )}
        </group>

        {/* 3D Floating Nameplate / Status HUD (Appears only on Hover when interactive) */}
        {isInteractive && (
          <Html
            position={[0, calculatedRadius + 0.6, 0]}
            center
            className="pointer-events-none select-none z-50"
            style={{
              visibility: isHovered ? "visible" : "hidden",
              pointerEvents: "none",
            }}
          >
            <div
              className="flex flex-col items-center pointer-events-none select-none transition-all duration-150 ease-out"
              style={{
                opacity: isHovered ? 1 : 0,
                transform: isHovered
                  ? "translateY(-8px) scale(1)"
                  : "translateY(0px) scale(0.95)",
              }}
            >
              {/* Primary Planet Identifier Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-950/95 backdrop-blur-md border border-stone-700/70 shadow-2xl whitespace-nowrap">
                <ChainLogo
                  chain={planet.id}
                  size={22}
                  className="rounded-full shrink-0 shadow-md"
                />
                <span className="font-mono text-sm font-semibold tracking-wider text-stone-100">
                  {planet.name}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-800/90 text-stone-200 border border-stone-700/50">
                  {planet.symbol}
                </span>
              </div>

              {/* Quick 24h metrics tag */}
              <div className="mt-1 px-2.5 py-1 rounded bg-stone-950/90 backdrop-blur-sm border border-stone-800/80 text-xs font-mono text-stone-300 shadow-lg whitespace-nowrap">
                <span className="text-stone-400">24h Vol:</span>{" "}
                <span className="text-stone-200 font-medium">
                  ${((planet.metrics.total_dex_volume_usd || 0) / 1e6).toFixed(1)}M
                </span>
              </div>
            </div>
          </Html>
        )}
      </group>
    </>
  );
}
