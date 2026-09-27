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
import {
  CinematicDirector,
  CinematicLetterboxOverlay,
  PresentationData,
} from "./CinematicDirector";

interface CosmosSceneProps {
  planets: CosmosPlanet[];
  flows: InterplanetaryFlow[];
  selectedPlanet: CosmosPlanet | null;
  selectedFlow?: InterplanetaryFlow | null;
  hoveredPlanetId: string | null;
  globalSpeed: number;
  isCinematicTour?: boolean;
  onSelectPlanet: (planet: CosmosPlanet | null) => void;
  onSelectFlow?: (flow: InterplanetaryFlow | null) => void;
  onHoverPlanet: (id: string | null) => void;
  onExitCinematicTour?: () => void;
  onUserInteraction?: () => void;
  onSceneReady?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OrbitControlsInstance = any;

function getSunAwareFocus(
  objectPosition: THREE.Vector3,
  cameraDistance: number,
  tangentWeight: number,
  heightWeight: number
) {
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
  const isTransitioningRef = useRef<boolean>(true);
  const prevFollowPosRef = useRef<THREE.Vector3 | null>(null);
  const offsetXRef = useRef<number>(0);

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

          if (state.camera.position.distanceTo(focus.cameraPosition) < 0.55) {
            isTransitioningRef.current = false;
          }
        } else {
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

          if (state.camera.position.distanceTo(focus.cameraPosition) < 0.65) {
            isTransitioningRef.current = false;
          }
        } else {
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
      if (isTransitioningRef.current) {
        const defaultTarget = new THREE.Vector3(0, 0, 0);
        const defaultCamPos = new THREE.Vector3(0, 95, 175);

        controls.target.lerp(defaultTarget, delta * 2.5);
        state.camera.position.lerp(defaultCamPos, delta * 2.0);

        if (state.camera.position.distanceTo(defaultCamPos) < 1.0) {
          isTransitioningRef.current = false;
          controls.target.copy(defaultTarget);
          state.camera.position.copy(defaultCamPos);
        }
      }
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
  globalSpeed,
  isCinematicTour = false,
  onSelectPlanet,
  onSelectFlow,
  onHoverPlanet,
  onExitCinematicTour,
  onUserInteraction,
  onSceneReady,
}: CosmosSceneProps) {
  const [positions, setPositions] = useState<Record<string, [number, number, number]>>({});
  const [hoveredFlow, setHoveredFlow] = useState<InterplanetaryFlow | null>(null);
  const [currentPresentation, setCurrentPresentation] = useState<PresentationData | null>(null);
  const rocketPositionsRef = useRef<Record<string, [number, number, number]>>({});

  const handleUpdatePosition = useCallback((id: string, pos: [number, number, number]) => {
    setPositions((prev) => {
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
          onSceneReady?.();
        }}
      >
        <color attach="background" args={["#02040a"]} />

        {/* Infinite Deep Space Background Stars */}
        <CosmicStarfield />

        {/* Global Balanced Cosmic Lighting */}
        <ambientLight color="#AFC6E8" intensity={0.38} />
        <hemisphereLight args={["#B9D5F2", "#090E19", 0.4]} />
        <directionalLight
          position={[30, 80, 50]}
          intensity={0.42}
          color="#FFF3DA"
        />

        {/* Dynamic Camera: Presentation Tour or Interactive Orbit Controls */}
        {isCinematicTour ? (
          <CinematicDirector
            isActive={isCinematicTour}
            planets={planets}
            flows={flows}
            planetPositions={positions}
            rocketPositionsRef={rocketPositionsRef}
            onExit={onExitCinematicTour || (() => {})}
            onPresentationChange={setCurrentPresentation}
          />
        ) : (
          <CameraRig
            selectedPlanet={selectedPlanet}
            planetPositions={positions}
            selectedFlow={selectedFlow}
            rocketPositionsRef={rocketPositionsRef}
          />
        )}

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
        />

        {/* All Planetary Ecosystems */}
        {planets.map((planet, index) => {
          const initialAngle = index * 2.399963;
          const isSelected = !isCinematicTour && selectedPlanet?.id === planet.id;
          const isHovered = !isCinematicTour && hoveredPlanetId === planet.id;
          const isConnectedToHoveredFlow =
            !isCinematicTour &&
            (hoveredFlow?.planetId === planet.id ||
              hoveredFlow?.fromPlanetId === planet.id ||
              hoveredFlow?.toPlanetId === planet.id);

          return (
            <PlanetMesh
              key={planet.id}
              planet={planet}
              initialAngle={initialAngle}
              isSelected={isSelected}
              isHovered={isHovered}
              isConnectedToHoveredFlow={isConnectedToHoveredFlow}
              globalSpeed={globalSpeed}
              isInteractive={!isCinematicTour}
              onHover={onHoverPlanet}
              onSelect={onSelectPlanet}
              onUpdatePosition={handleUpdatePosition}
            />
          );
        })}
      </Canvas>

      {/* Clean, Data-Dense Executive Presentation Overlay */}
      <CinematicLetterboxOverlay
        isActive={isCinematicTour}
        data={currentPresentation}
        onExit={onExitCinematicTour || (() => {})}
      />
    </div>
  );
}
