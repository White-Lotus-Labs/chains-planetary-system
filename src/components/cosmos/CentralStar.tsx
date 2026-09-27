"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const STAR_VERTEX_SHADER = /* glsl */ `
  varying vec3 vPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vPosition = position;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const STAR_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;

  varying vec3 vPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
          mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
          mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.55;
    for (int i = 0; i < 5; i++) {
      value += noise(p) * amplitude;
      p = p * 2.03 + vec3(1.7, 3.1, 2.3);
      amplitude *= 0.48;
    }
    return value;
  }

  void main() {
    vec3 p = normalize(vPosition);
    float time = uTime * 0.055;
    float cells = fbm(p * 16.0 + vec3(time, -time * 0.7, time * 0.4));
    float currents = fbm(p * 4.2 + vec3(-time * 0.45, time * 0.25, time));
    float spotField = fbm(p * 2.6 + vec3(time * 0.12));
    float sunspot = smoothstep(0.73, 0.9, spotField) * smoothstep(0.2, 0.48, currents);

    vec3 ember = vec3(0.93, 0.22, 0.015);
    vec3 gold = vec3(1.0, 0.56, 0.06);
    vec3 whiteHot = vec3(1.0, 0.92, 0.58);
    vec3 color = mix(ember, gold, smoothstep(0.2, 0.82, currents));
    color = mix(color, whiteHot, smoothstep(0.48, 0.88, cells));
    color *= 1.0 - sunspot * 0.72;

    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float rim = pow(1.0 - abs(dot(normalize(vWorldNormal), viewDirection)), 2.0);
    color += vec3(1.0, 0.28, 0.015) * rim * 0.7;
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function CentralStar() {
  const meshRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.08;
      const pulse = 1 + Math.sin(t * 1.5) * 0.02;
      meshRef.current.scale.set(pulse, pulse, pulse);
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t;
    }
    if (coronaRef.current) {
      coronaRef.current.rotation.z = -t * 0.04;
      const coronaPulse = 1.04 + Math.sin(t * 2.2) * 0.03;
      coronaRef.current.scale.set(coronaPulse, coronaPulse, coronaPulse);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Animated photosphere with granulation, convection, and sunspots. */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[10.5, 96, 96]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={STAR_VERTEX_SHADER}
          fragmentShader={STAR_FRAGMENT_SHADER}
          uniforms={uniforms}
        />
      </mesh>

      {/* Solar Chromosphere / Corona Layer */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[11.5, 48, 48]} />
        <meshBasicMaterial
          color="#FF8A1F"
          transparent
          opacity={0.14}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Outer Ethereal Solar Halo */}
      <mesh scale={1.22}>
        <sphereGeometry args={[10.5, 36, 36]} />
        <meshBasicMaterial
          color="#FF641A"
          transparent
          opacity={0.055}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Core Sunlight Source */}
      <pointLight color="#FFF1D2" intensity={900} distance={650} decay={1.08} />
    </group>
  );
}
