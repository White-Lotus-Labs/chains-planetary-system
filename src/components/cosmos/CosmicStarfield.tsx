"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Custom shader for smooth, non-flickering, anti-aliased celestial stars
const STAR_VERTEX_SHADER = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aBrightness;

  uniform float uTime;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = color;
    
    // Each star twinkles independently and gently at its own phase and speed
    float twinkle = 0.8 + 0.2 * sin(uTime * aSpeed + aPhase);
    vAlpha = aBrightness * twinkle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Stable point size unaffected by camera distance since starfield stays centered at camera
    gl_PointSize = aSize * uPixelRatio;
  }
`;

const STAR_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Smooth anti-aliased circle with soft radial falloff (no subpixel snapping or harsh edges)
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Smooth Gaussian-like core falloff
    float intensity = smoothstep(0.5, 0.05, dist);
    gl_FragColor = vec4(vColor, vAlpha * intensity);
  }
`;

const STAR_COUNT = 4500;

export const CosmicStarfield = React.memo(function CosmicStarfield() {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { gl } = useThree();

  const pixelRatio = useMemo(() => {
    return Math.min(gl.getPixelRatio ? gl.getPixelRatio() : 1, 2);
  }, [gl]);

  // Construct stable star geometry once
  const [positions, colors, sizes, phases, speeds, brightnesses] = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const col = new Float32Array(STAR_COUNT * 3);
    const sz = new Float32Array(STAR_COUNT);
    const ph = new Float32Array(STAR_COUNT);
    const sp = new Float32Array(STAR_COUNT);
    const br = new Float32Array(STAR_COUNT);

    // Astronomical star colors (stellar spectral types: blue-white, pure white, soft gold, warm amber)
    const spectralColors = [
      new THREE.Color("#E2E8F0"), // Pure white (Class A)
      new THREE.Color("#CBD5E1"), // Soft silver (Class F)
      new THREE.Color("#93C5FD"), // Bright blue-white (Class B)
      new THREE.Color("#BFDBFE"), // Cyan-tinted (Class O)
      new THREE.Color("#FDE68A"), // Soft yellow (Class G - Sun-like)
      new THREE.Color("#FED7AA"), // Warm amber (Class K)
    ];

    for (let i = 0; i < STAR_COUNT; i++) {
      // Place stars uniformly on a celestial sphere of radius 650 - 750 (far away, never clips near plane)
      const radius = 650 + Math.random() * 100;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Assign realistic star color
      const chosenColor = spectralColors[Math.floor(Math.random() * spectralColors.length)];
      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;

      // Star diameter: majority are sharp 1.5 - 2.5px dots, a few prominent beacons 3.5px
      sz[i] = Math.random() < 0.92 ? 1.5 + Math.random() * 1.0 : 2.8 + Math.random() * 1.2;

      // Individual twinkle characteristics
      ph[i] = Math.random() * Math.PI * 2;
      sp[i] = 0.4 + Math.random() * 1.2;
      br[i] = 0.45 + Math.random() * 0.55;
    }

    return [pos, col, sz, ph, sp, br];
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
    }),
    [pixelRatio]
  );

  // Keep starfield anchored to camera position on every frame:
  // This achieves true celestial parallax at infinity, meaning:
  // 1. Zooming in/out or translating camera NEVER passes through or collides with stars
  // 2. Stars never hit camera near-plane (0.1) or far-plane (1000)
  // 3. ZERO flickering, shimmering, or popping during camera movement
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.copy(state.camera.position);
      // Gentle cosmic sky drift
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.0015;
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[sizes, 1]}
          />
          <bufferAttribute
            attach="attributes-aPhase"
            args={[phases, 1]}
          />
          <bufferAttribute
            attach="attributes-aSpeed"
            args={[speeds, 1]}
          />
          <bufferAttribute
            attach="attributes-aBrightness"
            args={[brightnesses, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={STAR_VERTEX_SHADER}
          fragmentShader={STAR_FRAGMENT_SHADER}
          uniforms={uniforms}
          transparent
          vertexColors
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
});
