"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { CosmosPlanet, InterplanetaryFlow } from "@/types/cosmos";
import { CentralStar } from "./CentralStar";
import { PlanetMesh } from "./PlanetMesh";
import { InterplanetaryStreams } from "./InterplanetaryStreams";
import { CosmicStarfield } from "./CosmicStarfield";

interface CosmosSceneProps {
  planets: CosmosPlanet[];
  flows: InterplanetaryFlow[];
  selectedPlanet: CosmosPlanet | null;
  selectedFlow?: InterplanetaryFlow | null;
  hoveredPlanetId: string | null;
  showFlows: boolean;
  globalSpeed: number;
  onSelectPlanet: (planet: CosmosPlanet | null) => void;
  onSelectFlow?: (flow: InterplanetaryFlow | null) => void;
  onHoverPlanet: (id: string | null) => void;
  onUserInteraction?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OrbitControlsInstance = any;

function getSunAwareFocus(
  objectPosition: THREE.Vector3,
  cameraDistance: number,
  tangentWeight: number,
  heightWeight: number
) {
  // Use the object's orbital direction as the stable frame of reference.
  // The camera sits mostly outside the orbit and looks back toward the sun,
  // with a tangential offset so the star does not land directly behind the object.
  const radialFromSun = new THREE.Vector3(objectPosition.x, 0, objectPosition.z);
  if (radialFromSun.lengthSq() < 0.0001) radialFromSun.set(0, 0, 1);
  radialFromSun.normalize();

  const tangent = new THREE.Vector3(-radialFromSun.z, 0, radialFromSun.x);
  const cameraDirection = radialFromSun
    .clone()
    .multiplyScalar(0.82)
    .addScaledVector(tangent, tangentWeight)
    .addScaledVector(THREE.Object3D.DEFAULT_UP, heightWeight)
    .normalize();

  const sunward = radialFromSun.clone().multiplyScalar(-1);
  const targetSunBias = Math.min(cameraDistance * 0.14, 3.2);

  return {
    cameraPosition: objectPosition.clone().addScaledVector(cameraDirection, cameraDistance),
    target: objectPosition.clone().addScaledVector(sunward, targetSunBias),
  };
}

function CameraRig({
  selectedPlanet,
  planetPositions,
  selectedFlow,
  rocketPositionsRef,
}: {
  selectedPlanet: CosmosPlanet | null;
  planetPositions: Record<string, [number, number, number]>;
  selectedFlow: InterplanetaryFlow | null;
  rocketPositionsRef: React.RefObject<Record<string, [number, number, number]>>;
}) {
  const controlsRef = useRef<OrbitControlsInstance>(null);
  const prevSelectionKeyRef = useRef<string | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const prevFollowPosRef = useRef<THREE.Vector3 | null>(null);
  const offsetXRef = useRef<number>(0);

  // When selectedPlanet or selectedFlow changes, trigger a smooth transition
  useEffect(() => {
    const curKey = selectedPlanet
      ? `planet:${selectedPlanet.id}`
      : selectedFlow
      ? `flow:${selectedFlow.fromPlanetId}->${selectedFlow.toPlanetId}`
      : null;

    if (curKey !== prevSelectionKeyRef.current) {
      prevSelectionKeyRef.current = curKey;
      isTransitioningRef.current = true;
      prevFollowPosRef.current = null;
    }
  }, [selectedPlanet, selectedFlow]);

  // When user interacts (touches, drags, wheels), immediately stop any automated transition
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleStart = () => {
      isTransitioningRef.current = false;
    };

    controls.addEventListener("start", handleStart);
    return () => {
      controls.removeEventListener("start", handleStart);
    };
  }, []);

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    // Viewport Offset: Center focused celestial object to the left while detail card is on the right
    const isFocusActive = Boolean(selectedPlanet || selectedFlow);
    const targetOffset =
      isFocusActive && window.innerWidth >= 768
        ? Math.min(window.innerWidth * 0.22, 190)
        : 0;
    offsetXRef.current = THREE.MathUtils.lerp(offsetXRef.current, targetOffset, delta * 3.5);

    if (offsetXRef.current > 0.5) {
      state.camera.setViewOffset(
        window.innerWidth,
        window.innerHeight,
        offsetXRef.current,
        0,
        window.innerWidth,
        window.innerHeight
      );
    } else if (state.camera.view && state.camera.view.enabled) {
      state.camera.clearViewOffset();
    }

    if (selectedPlanet) {
      const pos = planetPositions[selectedPlanet.id];
      if (pos) {
        const currentPlanetPos = new THREE.Vector3(pos[0], pos[1], pos[2]);

        if (isTransitioningRef.current) {
          const rad = selectedPlanet.calculatedRadius;
          const focusDistance = Math.max(18, rad * 9);
          const focus = getSunAwareFocus(
            currentPlanetPos,
            focusDistance,
            0.68,
            0.48
          );
          controls.target.lerp(focus.target, delta * 3.2);
          state.camera.position.lerp(focus.cameraPosition, delta * 2.45);

          // Once arrived close enough, transition is complete
          if (state.camera.position.distanceTo(focus.cameraPosition) < 0.55) {
            isTransitioningRef.current = false;
          }
        } else {
          // In orbit: translate camera and target along with the planet's orbital revolution,
          // perfectly preserving the user's manual zoom distance, pitch, and yaw!
          if (prevFollowPosRef.current) {
            const deltaPos = currentPlanetPos.clone().sub(prevFollowPosRef.current);
            controls.target.add(deltaPos);
            state.camera.position.add(deltaPos);
          } else {
            controls.target.copy(currentPlanetPos);
          }
        }

        prevFollowPosRef.current = currentPlanetPos.clone();
      }
    } else if (selectedFlow) {
      const flowKey = `${selectedFlow.fromPlanetId}->${selectedFlow.toPlanetId}`;
      const rPos = rocketPositionsRef.current?.[flowKey];
      if (rPos) {
        const currentRocketPos = new THREE.Vector3(rPos[0], rPos[1], rPos[2]);

        if (isTransitioningRef.current) {
          const focus = getSunAwareFocus(
            currentRocketPos,
            16,
            0.58,
            0.4
          );
          controls.target.lerp(focus.target, delta * 3.6);
          state.camera.position.lerp(focus.cameraPosition, delta * 2.8);

          // Once arrived close enough, transition is complete
          if (state.camera.position.distanceTo(focus.cameraPosition) < 0.65) {
            isTransitioningRef.current = false;
          }
        } else {
          // Escorting rocket flight: lock camera delta to live rocket motion
          if (prevFollowPosRef.current) {
            const deltaPos = currentRocketPos.clone().sub(prevFollowPosRef.current);
            controls.target.add(deltaPos);
            state.camera.position.add(deltaPos);
          } else {
            controls.target.copy(currentRocketPos);
          }
        }

        prevFollowPosRef.current = currentRocketPos.clone();
      }
    } else {
      // In macro Solar System view
      if (isTransitioningRef.current) {
        const defaultTarget = new THREE.Vector3(0, 0, 0);
        const defaultCamPos = new THREE.Vector3(0, 95, 175);

        controls.target.lerp(defaultTarget, delta * 2.5);
        state.camera.position.lerp(defaultCamPos, delta * 2.0);

        // When arrived, end transition so user has full, unrestricted control
        if (state.camera.position.distanceTo(defaultCamPos) < 1.0) {
          isTransitioningRef.current = false;
          controls.target.copy(defaultTarget);
          state.camera.position.copy(defaultCamPos);
        }
      }
      // When NOT transitioning in macro view: DO NOT TOUCH camera or target!
      // User can zoom in, zoom out, rotate at will and it will NEVER roll back!
    }

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={3}
      maxDistance={550}
      rotateSpeed={0.7}
      panSpeed={0.8}
    />
  );
}

export function CosmosScene({
  planets,
  flows,
  selectedPlanet,
  selectedFlow = null,
  hoveredPlanetId,
  showFlows,
  globalSpeed,
  onSelectPlanet,
  onSelectFlow,
  onHoverPlanet,
  onUserInteraction,
}: CosmosSceneProps) {
  const [positions, setPositions] = useState<Record<string, [number, number, number]>>({});
  const [hoveredFlow, setHoveredFlow] = useState<InterplanetaryFlow | null>(null);
  const rocketPositionsRef = useRef<Record<string, [number, number, number]>>({});

  const handleUpdatePosition = useCallback((id: string, pos: [number, number, number]) => {
    setPositions((prev) => {
      // Only update if changed sufficiently to prevent unnecessary re-renders
      const cur = prev[id];
      if (
        !cur ||
        Math.abs(cur[0] - pos[0]) > 0.05 ||
        Math.abs(cur[2] - pos[2]) > 0.05
      ) {
        return { ...prev, [id]: pos };
      }
      return prev;
    });
  }, []);

  const handleUpdateRocketPosition = useCallback(
    (flowKey: string, pos: [number, number, number]) => {
      rocketPositionsRef.current[flowKey] = pos;
    },
    []
  );

  return (
    <div
      className="relative h-full w-full cursor-grab active:cursor-grabbing"
      onPointerDown={onUserInteraction}
    >
      <Canvas
        camera={{ position: [0, 95, 175], fov: 55, near: 0.1, far: 1400 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.08;
        }}
      >
        <color attach="background" args={["#02040a"]} />

        {/* Infinite Deep Space Background Stars (Camera-Anchored, Anti-Aliased, Non-Flickering) */}
        <CosmicStarfield />

        {/* Global Balanced Cosmic Lighting (Illuminates planetary dark sides & objects) */}
        <ambientLight color="#AFC6E8" intensity={0.38} />
        <hemisphereLight
          args={["#B9D5F2", "#090E19", 0.4]}
        />
        <directionalLight
          position={[30, 80, 50]}
          intensity={0.42}
          color="#FFF3DA"
        />

        {/* Dynamic Camera Rig & Orbit Controls */}
        <CameraRig
          selectedPlanet={selectedPlanet}
          planetPositions={positions}
          selectedFlow={selectedFlow}
          rocketPositionsRef={rocketPositionsRef}
        />

        {/* Central Star Core */}
        <CentralStar />

        {/* Interplanetary Capital Streams */}
        <InterplanetaryStreams
          flows={flows}
          planets={planets}
          planetPositions={positions}
          selectedPlanet={selectedPlanet}
          selectedFlow={selectedFlow}
          hoveredPlanetId={hoveredPlanetId}
          globalSpeed={globalSpeed}
          onSelectFlow={onSelectFlow}
          onHoverFlow={setHoveredFlow}
          onUpdateRocketPosition={handleUpdateRocketPosition}
          visible={showFlows}
        />

        {/* All Planetary Ecosystems */}
        {planets.map((planet, index) => {
          // Golden angle distribution (~137.5 deg) ensures natural celestial dispersion without clustering
          const initialAngle = index * 2.399963;
          const isSelected = selectedPlanet?.id === planet.id;
          const isHovered = hoveredPlanetId === planet.id;
          const isConnectedToHoveredFlow =
            hoveredFlow?.planetId === planet.id ||
            hoveredFlow?.fromPlanetId === planet.id ||
            hoveredFlow?.toPlanetId === planet.id;

          return (
            <PlanetMesh
              key={planet.id}
              planet={planet}
              initialAngle={initialAngle}
              isSelected={isSelected}
              isHovered={isHovered}
              isConnectedToHoveredFlow={isConnectedToHoveredFlow}
              globalSpeed={globalSpeed}
              onHover={onHoverPlanet}
              onSelect={onSelectPlanet}
              onUpdatePosition={handleUpdatePosition}
            />
          );
        })}
      </Canvas>
    </div>
  );
}
