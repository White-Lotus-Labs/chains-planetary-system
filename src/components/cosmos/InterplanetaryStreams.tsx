"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CosmosPlanet, InterplanetaryFlow } from "@/types/cosmos";

interface InterplanetaryStreamsProps {
  flows: InterplanetaryFlow[];
  planets: CosmosPlanet[];
  planetPositions: Record<string, [number, number, number]>;
  selectedPlanet?: CosmosPlanet | null;
  selectedFlow?: InterplanetaryFlow | null;
  hoveredPlanetId?: string | null;
  globalSpeed?: number;
  onSelectFlow?: (flow: InterplanetaryFlow) => void;
  onHoverFlow?: (flow: InterplanetaryFlow | null) => void;
  onUpdateRocketPosition?: (flowKey: string, pos: [number, number, number]) => void;
  visible: boolean;
}

// Fixed velocity for all dashed trajectories (world units per second)
const FIXED_DASH_VELOCITY = 4.0;
const SEGMENTS_COUNT = 64;

function useReducedMotionPreference() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

// Custom GLSL Shader for crisp, animated dashed lines with graceful edge fade
const DashedTrajectoryShader = {
  vertexShader: `
    attribute float aDistance;
    attribute float aT;
    varying float vDistance;
    varying float vT;
    void main() {
      vDistance = aDistance;
      vT = aT;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uHighlightColor;
    uniform float uIsRelevant;
    uniform float uIsHovered;
    uniform float uDashOffset;
    uniform float uDashSize;
    uniform float uGapSize;
    uniform float uTotalLength;
    uniform float uPulseProgress;
    uniform float uFlowIntensity;

    varying float vDistance;
    varying float vT;

    void main() {
      float totalDash = uDashSize + uGapSize;
      float d = mod(vDistance - uDashOffset, totalDash);
      if (d > uDashSize) {
        discard;
      }

      // Smooth sinusoidal dissolve near the corridor extremities
      float endpointFade = smoothstep(0.0, 3.0, vDistance) * smoothstep(0.0, 3.0, uTotalLength - vDistance);

      // Natural celestial color gradient: Origin color -> warm stardust -> Destination color
      vec3 baseCol = mix(uColor1, uColor2, vT);
      vec3 stardustGold = vec3(1.0, 0.96, 0.85);
      float apexGlow = sin(vT * 3.14159265);
      baseCol = mix(baseCol, stardustGold, apexGlow * 0.35);

      // White-hot crest pulse along trajectory direction
      float pulseDistance = abs(vT - uPulseProgress);
      pulseDistance = min(pulseDistance, 1.0 - pulseDistance);
      float routePulse = 1.0 - smoothstep(0.0, 0.12, pulseDistance);
      baseCol = mix(baseCol, vec3(1.0), routePulse * 0.75);

      if (uIsHovered > 0.5) {
        vec3 neonGlow = mix(baseCol, vec3(1.0, 1.0, 1.0), 0.45);
        baseCol = neonGlow + vec3(0.2, 0.2, 0.25);
      } else if (uIsRelevant > 0.5) {
        baseCol = mix(baseCol, uHighlightColor, 0.55);
      }

      float baseAlpha = uIsHovered > 0.5
        ? 1.0
        : (uIsRelevant > 0.5 ? mix(0.35, 0.65, uFlowIntensity) : 0.08);
      float alpha = endpointFade * min(1.0, baseAlpha + routePulse * 0.72);
      gl_FragColor = vec4(baseCol, alpha);
    }
  `,
};

export function InterplanetaryStreams({
  flows,
  planets,
  planetPositions,
  selectedPlanet,
  hoveredPlanetId,
  globalSpeed = 0.5,
  onUpdateRocketPosition,
  visible,
}: InterplanetaryStreamsProps) {
  const reducedMotion = useReducedMotionPreference();
  const planetMap = useMemo(() => {
    const map: Record<string, CosmosPlanet> = {};
    for (const p of planets) {
      map[p.id] = p;
    }
    return map;
  }, [planets]);

  return (
    <group visible={visible}>
      {flows.map((flow, index) => {
        const targetId =
          flow.planetId ||
          (flow.direction === "inbound" ? flow.toPlanetId : flow.fromPlanetId) ||
          flow.fromPlanetId;
        const planet = targetId ? planetMap[targetId] : undefined;
        if (!planet) return null;

        const isVectorSelected = selectedPlanet?.id === planet.id;

        return (
          <SinglePlanetTrafficCorridor
            key={`traffic-${planet.id}-${flow.direction || index}`}
            flow={flow}
            flowIndex={index}
            planet={planet}
            planetPositions={planetPositions}
            selectedPlanet={selectedPlanet}
            hoveredPlanetId={hoveredPlanetId}
            isSelected={isVectorSelected}
            globalSpeed={globalSpeed}
            onUpdateRocketPosition={onUpdateRocketPosition}
            reducedMotion={reducedMotion}
          />
        );
      })}
    </group>
  );
}

// Single open-ended capital traffic corridor with NASA Space Shuttle Orbiter Class vessel
function SinglePlanetTrafficCorridor({
  flow,
  flowIndex,
  planet,
  planetPositions,
  selectedPlanet,
  hoveredPlanetId,
  globalSpeed,
  onUpdateRocketPosition,
  reducedMotion,
}: {
  flow: InterplanetaryFlow;
  flowIndex: number;
  planet: CosmosPlanet;
  planetPositions: Record<string, [number, number, number]>;
  selectedPlanet?: CosmosPlanet | null;
  hoveredPlanetId?: string | null;
  isSelected?: boolean;
  globalSpeed: number;
  onUpdateRocketPosition?: (flowKey: string, pos: [number, number, number]) => void;
  reducedMotion: boolean;
}) {
  const linePositionAttrRef = useRef<THREE.BufferAttribute>(null);
  const distanceAttrRef = useRef<THREE.BufferAttribute>(null);
  const shaderMatRef = useRef<THREE.ShaderMaterial>(null);
  const rocketGroupRef = useRef<THREE.Group>(null);
  const enginesFlameRef = useRef<THREE.Group>(null);
  const packetRefs = useRef<(THREE.Mesh | null)[]>([]);

  const isInflow = flow.direction === "inbound";
  const packetCount = useMemo(
    () => 2 + Math.round((flow.intensity || 0.5) * 4),
    [flow.intensity]
  );

  const activePlanetId = selectedPlanet?.id || hoveredPlanetId;
  const isThisPlanet = activePlanetId === planet.id;
  const isRelevant = !activePlanetId || isThisPlanet;

  const highlightColor = useMemo(() => {
    if (isInflow) return new THREE.Color("#34D399"); // Jade Inflow
    return new THREE.Color("#F59E0B"); // Amber Outflow
  }, [isInflow]);

  // Color scheme: Inflow flows from celestial stardust into planet; Outflow launches from planet into cosmos
  const startColor = useMemo(
    () => (isInflow ? new THREE.Color("#38BDF8") : new THREE.Color(planet.color)),
    [isInflow, planet.color]
  );
  const endColor = useMemo(
    () => (isInflow ? new THREE.Color(planet.color) : new THREE.Color("#F59E0B")),
    [isInflow, planet.color]
  );

  // Authentic Double-Delta Wing & Vertical Stabilizer shapes for NASA Space Shuttle Orbiter planform
  const { starboardWingShape, portWingShape, verticalFinShape } = useMemo(() => {
    // Starboard Wing (Double-Delta Planform, X > 0)
    const sw = new THREE.Shape();
    sw.moveTo(0.38, 0.45);
    sw.lineTo(0.72, -0.05); // Forward strake break
    sw.lineTo(1.36, -0.92); // Wingtip leading edge
    sw.lineTo(1.36, -1.14); // Wingtip chord
    sw.lineTo(0.38, -1.14); // Trailing edge back to fuselage root
    sw.closePath();

    // Port Wing (Double-Delta Planform, X < 0)
    const pw = new THREE.Shape();
    pw.moveTo(-0.38, 0.45);
    pw.lineTo(-0.72, -0.05);
    pw.lineTo(-1.36, -0.92);
    pw.lineTo(-1.36, -1.14);
    pw.lineTo(-0.38, -1.14);
    pw.closePath();

    // Swept Vertical Stabilizer Tail Fin (in Z-Y space)
    const fin = new THREE.Shape();
    fin.moveTo(-0.25, 0.28); // Forward root
    fin.lineTo(-0.95, 1.25); // Top leading edge tip
    fin.lineTo(-1.16, 1.22); // Top trailing edge tip
    fin.lineTo(-1.22, 0.28); // Aft base
    fin.closePath();

    return { starboardWingShape: sw, portWingShape: pw, verticalFinShape: fin };
  }, []);

  const wingExtrudeSettings = useMemo(
    () => ({
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    }),
    []
  );

  const finExtrudeSettings = useMemo(
    () => ({
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
    }),
    []
  );

  // Pre-allocated line buffers for 64 points
  const { initialPositions, initialDistances, tValues } = useMemo(() => {
    const ts = new Float32Array(SEGMENTS_COUNT);
    for (let i = 0; i < SEGMENTS_COUNT; i++) {
      ts[i] = i / (SEGMENTS_COUNT - 1);
    }
    return {
      initialPositions: new Float32Array(SEGMENTS_COUNT * 3),
      initialDistances: new Float32Array(SEGMENTS_COUNT),
      tValues: ts,
    };
  }, []);

  const uniforms = useMemo(() => {
    return {
      uColor1: { value: startColor },
      uColor2: { value: endColor },
      uHighlightColor: { value: highlightColor },
      uIsRelevant: { value: isRelevant ? 1.0 : 0.0 },
      uIsHovered: { value: 0.0 },
      uDashOffset: { value: 0 },
      uDashSize: { value: 2.2 },
      uGapSize: { value: 1.6 },
      uTotalLength: { value: 50 },
      uPulseProgress: { value: 0.42 },
      uFlowIntensity: { value: flow.intensity || 0.5 },
    };
  }, [startColor, endColor, highlightColor, isRelevant, flow.intensity]);

  useFrame(({ clock }, delta) => {
    const planetPos = planetPositions[planet.id] || [0, 0, 0];
    const px = planetPos[0];
    const py = planetPos[1];
    const pz = planetPos[2];

    const rDist = Math.hypot(px, pz) || 1.0;
    const urx = px / rDist;
    const urz = pz / rDist;
    const utx = -pz / rDist;
    const utz = px / rDist;

    const pr = planet.calculatedRadius || 2.0;
    const intensity = flow.intensity || 0.5;
    const L = 16 + intensity * 8; // Arc length in world units
    const H = 4.0 + intensity * 2.8; // Vertical apex elevation

    let startVec: THREE.Vector3;
    let midVec: THREE.Vector3;
    let endVec: THREE.Vector3;

    if (isInflow) {
      // Inbound: Deep space descent toward planet
      startVec = new THREE.Vector3(
        px + urx * L * 0.85 - utx * L * 0.55,
        py + H,
        pz + urz * L * 0.85 - utz * L * 0.55
      );
      endVec = new THREE.Vector3(
        px + urx * (pr * 1.3),
        py + 0.15,
        pz + urz * (pr * 1.3)
      );
      midVec = new THREE.Vector3(
        (startVec.x + endVec.x) / 2 + utx * (L * 0.15),
        (startVec.y + endVec.y) / 2 + H * 0.35,
        (startVec.z + endVec.z) / 2 + utz * (L * 0.15)
      );
    } else {
      // Outbound: Launching from planet spaceport out into deep space
      startVec = new THREE.Vector3(
        px + utx * (pr * 1.3),
        py + 0.15,
        pz + utz * (pr * 1.3)
      );
      endVec = new THREE.Vector3(
        px + urx * L * 0.85 + utx * L * 0.65,
        py + H,
        pz + urz * L * 0.85 + utz * L * 0.65
      );
      midVec = new THREE.Vector3(
        (startVec.x + endVec.x) / 2 - urx * (L * 0.12),
        (startVec.y + endVec.y) / 2 + H * 0.45,
        (startVec.z + endVec.z) / 2 - urz * (L * 0.12)
      );
    }

    const curve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);

    // 1. Update Trajectory Dashed Line geometry
    const linePositionAttr = linePositionAttrRef.current;
    const distanceAttr = distanceAttrRef.current;

    if (linePositionAttr && distanceAttr && shaderMatRef.current) {
      shaderMatRef.current.uniforms.uHighlightColor.value = highlightColor;
      shaderMatRef.current.uniforms.uIsRelevant.value = isRelevant ? 1.0 : 0.0;
      shaderMatRef.current.uniforms.uFlowIntensity.value = intensity;

      let cumulativeDist = 0;
      let prevPt = curve.getPoint(0);

      for (let i = 0; i < SEGMENTS_COUNT; i++) {
        const t = tValues[i];
        const pt = curve.getPoint(t);

        linePositionAttr.setXYZ(i, pt.x, pt.y, pt.z);

        if (i > 0) {
          cumulativeDist += pt.distanceTo(prevPt);
        }
        distanceAttr.setX(i, cumulativeDist);
        prevPt = pt;
      }

      shaderMatRef.current.uniforms.uTotalLength.value = cumulativeDist;

      if (!reducedMotion) {
        shaderMatRef.current.uniforms.uDashOffset.value +=
          delta * FIXED_DASH_VELOCITY * globalSpeed;
      }

      linePositionAttr.needsUpdate = true;
      distanceAttr.needsUpdate = true;
    }

    // 2. Capital packets advance continuously along the trajectory
    const elapsed = clock.getElapsedTime();
    const cycleSpeed = (0.045 + intensity * 0.035) * Math.max(globalSpeed, 0.1);
    const routeProgress = reducedMotion
      ? 0.52
      : (elapsed * cycleSpeed + flowIndex * 0.18) % 1;

    if (shaderMatRef.current) {
      shaderMatRef.current.uniforms.uPulseProgress.value = routeProgress;
    }

    for (let i = 0; i < packetCount; i++) {
      const packet = packetRefs.current[i];
      if (!packet) continue;
      const progress = reducedMotion
        ? (i + 1) / (packetCount + 1)
        : (routeProgress + i / packetCount) % 1;
      const point = curve.getPoint(progress);

      packet.position.set(point.x, point.y, point.z);

      const packetFade = Math.sin(progress * Math.PI);
      const targetScale = (0.13 + intensity * 0.13) * packetFade;
      packet.scale.setScalar(targetScale);
    }

    // 3. Move and orient the Shuttle Orbiter vessel along the corridor
    if (rocketGroupRef.current) {
      const vesselProgress = reducedMotion ? 0.5 : 0.05 + routeProgress * 0.9;
      const vesselPt = curve.getPoint(vesselProgress);
      const tangent = curve.getTangent(vesselProgress).normalize();

      const hoverBob = reducedMotion
        ? 0
        : Math.sin(elapsed * 2.2 + flowIndex * 1.5) * 0.12;
      const currentPos: [number, number, number] = [
        vesselPt.x,
        vesselPt.y + hoverBob,
        vesselPt.z,
      ];
      rocketGroupRef.current.position.set(...currentPos);
      onUpdateRocketPosition?.(`traffic-${planet.id}`, currentPos);

      // Orient forward along tangent (+Z is forward)
      const forwardVec = new THREE.Vector3(0, 0, 1);
      const targetQuat = new THREE.Quaternion().setFromUnitVectors(forwardVec, tangent);

      const bankRoll = reducedMotion
        ? 0
        : Math.sin(elapsed * 1.8 + flowIndex) * 0.06;
      const bankQuat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1),
        bankRoll
      );
      targetQuat.multiply(bankQuat);
      rocketGroupRef.current.quaternion.copy(targetQuat);

      // Smooth vessel scale dissolve at corridor extremities (seamless hyperspace warp/dock)
      const vesselFade = Math.sin(vesselProgress * Math.PI);
      const baseScale = isRelevant ? 0.48 : 0.3;
      const activeScale = baseScale * Math.min(1.0, vesselFade * 2.4);
      rocketGroupRef.current.scale.setScalar(activeScale);
    }

    // 4. SSME 3-Engine Synchronous Flame Pulse
    const flamePulse = reducedMotion
      ? 0.9
      : 0.82 + Math.sin(elapsed * 18 + flowIndex * 2.0) * 0.25;

    if (enginesFlameRef.current) {
      enginesFlameRef.current.scale.set(1, 1, flamePulse);
    }
  });

  const rocketAccentColor = isInflow ? "#34D399" : "#F59E0B";

  return (
    <>
      {/* 3D Animated Dashed Trajectory Line - Non-clickable ambient space traffic */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            ref={linePositionAttrRef}
            attach="attributes-position"
            args={[initialPositions, 3]}
          />
          <bufferAttribute
            ref={distanceAttrRef}
            attach="attributes-aDistance"
            args={[initialDistances, 1]}
          />
          <bufferAttribute
            attach="attributes-aT"
            args={[tValues, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={shaderMatRef}
          vertexShader={DashedTrajectoryShader.vertexShader}
          fragmentShader={DashedTrajectoryShader.fragmentShader}
          uniforms={uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </line>

      {/* Directional capital packets */}
      {Array.from({ length: packetCount }, (_, index) => (
        <mesh
          key={`packet-${index}`}
          ref={(element) => {
            packetRefs.current[index] = element;
          }}
          renderOrder={4}
        >
          <sphereGeometry args={[0.26, 12, 12]} />
          <meshBasicMaterial
            color={rocketAccentColor}
            transparent
            opacity={0.88}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* 3D Space Shuttle Orbiter Class Transport Vessel (Non-clickable ambient visual) */}
      <group ref={rocketGroupRef} scale={isRelevant ? 0.48 : 0.3}>
        {/* ==================== FUSELAGE & CABIN ==================== */}

        {/* Blunt Nose Cap (Black Reinforced Carbon-Carbon Thermal Tile) */}
        <mesh position={[0, 0.02, 1.46]}>
          <sphereGeometry args={[0.26, 20, 20]} />
          <meshStandardMaterial
            color="#0F172A"
            roughness={0.8}
            metalness={0.15}
          />
        </mesh>

        {/* Forward Crew Cabin / Cockpit Nose Slope (White Ceramic Tile) */}
        <mesh position={[0, 0.05, 1.15]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.27, 0.42, 0.62, 24]} />
          <meshStandardMaterial
            color="#F1F5F9"
            roughness={0.35}
            metalness={0.2}
          />
        </mesh>

        {/* Cockpit Flight Deck Windshield (6-pane Wrap-around Layout) */}
        {/* Left & Right Front Center Windshields */}
        <mesh position={[-0.09, 0.31, 1.1]} rotation={[0.42, 0.12, -0.06]}>
          <boxGeometry args={[0.13, 0.07, 0.04]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#38BDF8"
            emissiveIntensity={0.8}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
        <mesh position={[0.09, 0.31, 1.1]} rotation={[0.42, -0.12, 0.06]}>
          <boxGeometry args={[0.13, 0.07, 0.04]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#38BDF8"
            emissiveIntensity={0.8}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
        {/* Left & Right Side Cockpit Windows */}
        <mesh position={[-0.23, 0.28, 0.98]} rotation={[0.25, 0.55, -0.12]}>
          <boxGeometry args={[0.1, 0.06, 0.04]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#38BDF8"
            emissiveIntensity={0.7}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
        <mesh position={[0.23, 0.28, 0.98]} rotation={[0.25, -0.55, 0.12]}>
          <boxGeometry args={[0.1, 0.06, 0.04]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#38BDF8"
            emissiveIntensity={0.7}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>

        {/* Mid-Fuselage Payload Cargo Bay (NASA Off-White Ceramic) */}
        <mesh position={[0, 0.08, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 1.55, 24]} />
          <meshStandardMaterial
            color="#F8FAFC"
            roughness={0.35}
            metalness={0.2}
          />
        </mesh>

        {/* Payload Bay Dorsal Split Seam */}
        <mesh position={[0, 0.505, 0.12]}>
          <boxGeometry args={[0.02, 0.02, 1.52]} />
          <meshStandardMaterial color="#0F172A" roughness={0.7} />
        </mesh>

        {/* Directional Currency Accent Stripes Along Cargo Bay Hinges */}
        <mesh position={[-0.37, 0.36, 0.12]}>
          <boxGeometry args={[0.035, 0.025, 1.5]} />
          <meshStandardMaterial
            color={rocketAccentColor}
            emissive={rocketAccentColor}
            emissiveIntensity={0.85}
          />
        </mesh>
        <mesh position={[0.37, 0.36, 0.12]}>
          <boxGeometry args={[0.035, 0.025, 1.5]} />
          <meshStandardMaterial
            color={rocketAccentColor}
            emissive={rocketAccentColor}
            emissiveIntensity={0.85}
          />
        </mesh>

        {/* Underbelly Thermal Heat Shield (Matte Black Thermal Tiles) */}
        <mesh position={[0, -0.12, 0.15]}>
          <boxGeometry args={[0.82, 0.13, 2.38]} />
          <meshStandardMaterial
            color="#0B0F19"
            roughness={0.85}
            metalness={0.1}
          />
        </mesh>

        {/* ==================== DOUBLE-DELTA WINGS ==================== */}

        {/* Starboard Wing (Right, +X) */}
        <mesh
          position={[0, 0.02, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <extrudeGeometry args={[starboardWingShape, wingExtrudeSettings]} />
          <meshStandardMaterial
            color="#F1F5F9"
            roughness={0.35}
            metalness={0.25}
          />
        </mesh>

        {/* Starboard Wing Leading Edge Thermal Shield (Black RCC) */}
        <mesh position={[0.86, 0.02, -0.52]} rotation={[0, -0.68, 0]}>
          <boxGeometry args={[0.06, 0.06, 1.3]} />
          <meshStandardMaterial color="#0F172A" roughness={0.8} />
        </mesh>

        {/* Starboard Wingtip Green Strobe Navigation Beacon */}
        <mesh position={[1.36, 0.02, -1.12]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color="#10B981" />
        </mesh>

        {/* Port Wing (Left, -X) */}
        <mesh
          position={[0, 0.02, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <extrudeGeometry args={[portWingShape, wingExtrudeSettings]} />
          <meshStandardMaterial
            color="#F1F5F9"
            roughness={0.35}
            metalness={0.25}
          />
        </mesh>

        {/* Port Wing Leading Edge Thermal Shield (Black RCC) */}
        <mesh position={[-0.86, 0.02, -0.52]} rotation={[0, 0.68, 0]}>
          <boxGeometry args={[0.06, 0.06, 1.3]} />
          <meshStandardMaterial color="#0F172A" roughness={0.8} />
        </mesh>

        {/* Port Wingtip Red Strobe Navigation Beacon */}
        <mesh position={[-1.36, 0.02, -1.12]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color="#EF4444" />
        </mesh>

        {/* ==================== VERTICAL STABILIZER (TAIL FIN) ==================== */}

        <mesh
          position={[0.02, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <extrudeGeometry args={[verticalFinShape, finExtrudeSettings]} />
          <meshStandardMaterial
            color="#F8FAFC"
            roughness={0.35}
            metalness={0.2}
          />
        </mesh>

        {/* Tail Fin Leading Edge Cap (Black RCC) */}
        <mesh position={[0, 0.78, -0.62]} rotation={[0.92, 0, 0]}>
          <boxGeometry args={[0.05, 0.05, 1.15]} />
          <meshStandardMaterial color="#0F172A" roughness={0.8} />
        </mesh>

        {/* Tail Fin Top Planetary Beacon */}
        <mesh position={[0, 1.25, -1.06]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color={planet.color} />
        </mesh>

        {/* ==================== OMS PODS (AFT BULGES) ==================== */}

        {/* Starboard OMS Pod (+X) */}
        <mesh position={[0.36, 0.20, -0.82]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.20, 0.72, 16]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0.36, 0.20, -1.24]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.08, 0.14, 12]} />
          <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.85} />
        </mesh>

        {/* Port OMS Pod (-X) */}
        <mesh position={[-0.36, 0.20, -0.82]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.20, 0.72, 16]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[-0.36, 0.20, -1.24]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.08, 0.14, 12]} />
          <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.85} />
        </mesh>

        {/* ==================== 3 SSME MAIN ENGINES & PLUMES ==================== */}

        {/* Engine 1 (Top Center) */}
        <mesh position={[0, 0.26, -1.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.17, 0.28, 20]} />
          <meshStandardMaterial color="#1E293B" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.26, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#38BDF8"
            emissiveIntensity={0.9}
          />
        </mesh>

        {/* Engine 2 (Bottom Port, -X) */}
        <mesh position={[-0.22, -0.04, -1.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.17, 0.28, 20]} />
          <meshStandardMaterial color="#1E293B" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[-0.22, -0.04, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#38BDF8"
            emissiveIntensity={0.9}
          />
        </mesh>

        {/* Engine 3 (Bottom Starboard, +X) */}
        <mesh position={[0.22, -0.04, -1.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.17, 0.28, 20]} />
          <meshStandardMaterial color="#1E293B" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0.22, -0.04, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#38BDF8"
            emissiveIntensity={0.9}
          />
        </mesh>

        {/* 3 Synchronous Pulsating Dual-Stage Plasma Exhaust Plumes */}
        <group ref={enginesFlameRef}>
          {/* Engine 1 Plume (Top Center) */}
          <mesh position={[0, 0.26, -1.72]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.16, 0.85, 16]} />
            <meshBasicMaterial
              color="#FBBF24"
              transparent
              opacity={0.82}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh position={[0, 0.26, -1.56]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.08, 0.55, 16]} />
            <meshBasicMaterial
              color="#F8FAFC"
              transparent
              opacity={0.95}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Engine 2 Plume (Bottom Port) */}
          <mesh position={[-0.22, -0.04, -1.72]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.16, 0.85, 16]} />
            <meshBasicMaterial
              color="#FBBF24"
              transparent
              opacity={0.82}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh position={[-0.22, -0.04, -1.56]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.08, 0.55, 16]} />
            <meshBasicMaterial
              color="#F8FAFC"
              transparent
              opacity={0.95}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Engine 3 Plume (Bottom Starboard) */}
          <mesh position={[0.22, -0.04, -1.72]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.16, 0.85, 16]} />
            <meshBasicMaterial
              color="#FBBF24"
              transparent
              opacity={0.82}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh position={[0.22, -0.04, -1.56]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.08, 0.55, 16]} />
            <meshBasicMaterial
              color="#F8FAFC"
              transparent
              opacity={0.95}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      </group>
    </>
  );
}
