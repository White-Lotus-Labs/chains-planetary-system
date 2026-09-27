"use client";

import * as THREE from "three";

export type PlanetTextureType =
  | "terrestrial"
  | "gas_giant"
  | "volcanic"
  | "ice"
  | "boreal"
  | "cratered";

export interface PlanetTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
  cloudMap: THREE.CanvasTexture | null;
}

const textureCache: Record<string, PlanetTextureSet> = {};
const ringTextureCache: Record<string, THREE.CanvasTexture> = {};

const TAU = Math.PI * 2;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function pseudoNoise3D(x: number, y: number, z: number, seed: number): number {
  const value = Math.sin(
    x * 127.1 + y * 311.7 + z * 74.7 + seed * 19.19
  ) * 43758.5453123;
  return value - Math.floor(value);
}

function smoothNoise3D(x: number, y: number, z: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;

  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);

  const n000 = pseudoNoise3D(ix, iy, iz, seed);
  const n100 = pseudoNoise3D(ix + 1, iy, iz, seed);
  const n010 = pseudoNoise3D(ix, iy + 1, iz, seed);
  const n110 = pseudoNoise3D(ix + 1, iy + 1, iz, seed);
  const n001 = pseudoNoise3D(ix, iy, iz + 1, seed);
  const n101 = pseudoNoise3D(ix + 1, iy, iz + 1, seed);
  const n011 = pseudoNoise3D(ix, iy + 1, iz + 1, seed);
  const n111 = pseudoNoise3D(ix + 1, iy + 1, iz + 1, seed);

  const nx00 = THREE.MathUtils.lerp(n000, n100, ux);
  const nx10 = THREE.MathUtils.lerp(n010, n110, ux);
  const nx01 = THREE.MathUtils.lerp(n001, n101, ux);
  const nx11 = THREE.MathUtils.lerp(n011, n111, ux);
  const nxy0 = THREE.MathUtils.lerp(nx00, nx10, uy);
  const nxy1 = THREE.MathUtils.lerp(nx01, nx11, uy);
  return THREE.MathUtils.lerp(nxy0, nxy1, uz);
}

function fbm3D(
  x: number,
  y: number,
  z: number,
  octaves: number,
  seed: number
): number {
  let value = 0;
  let amplitude = 0.54;
  let frequency = 1;
  let totalAmplitude = 0;

  for (let octave = 0; octave < octaves; octave++) {
    value +=
      smoothNoise3D(x * frequency, y * frequency, z * frequency, seed + octave * 17) *
      amplitude;
    totalAmplitude += amplitude;
    frequency *= 2.07;
    amplitude *= 0.48;
  }

  return value / totalAmplitude;
}

function ridged3D(
  x: number,
  y: number,
  z: number,
  octaves: number,
  seed: number
): number {
  return 1 - Math.abs(fbm3D(x, y, z, octaves, seed) * 2 - 1);
}

function colorTuple(color: THREE.Color): [number, number, number] {
  // THREE.Color stores CSS colors in linear space; canvas pixels are authored in sRGB.
  const srgb = color.clone().convertLinearToSRGB();
  return [srgb.r, srgb.g, srgb.b];
}

function mixColor(
  from: [number, number, number],
  to: [number, number, number],
  amount: number
): [number, number, number] {
  const t = clamp01(amount);
  return [
    THREE.MathUtils.lerp(from[0], to[0], t),
    THREE.MathUtils.lerp(from[1], to[1], t),
    THREE.MathUtils.lerp(from[2], to[2], t),
  ];
}

function multiplyColor(
  color: [number, number, number],
  amount: number
): [number, number, number] {
  return [color[0] * amount, color[1] * amount, color[2] * amount];
}

function writeColor(
  data: Uint8ClampedArray,
  index: number,
  color: [number, number, number],
  alpha = 1
) {
  data[index] = Math.round(clamp01(color[0]) * 255);
  data[index + 1] = Math.round(clamp01(color[1]) * 255);
  data[index + 2] = Math.round(clamp01(color[2]) * 255);
  data[index + 3] = Math.round(clamp01(alpha) * 255);
}

function writeScalar(data: Uint8ClampedArray, index: number, value: number) {
  const byte = Math.round(clamp01(value) * 255);
  data[index] = byte;
  data[index + 1] = byte;
  data[index + 2] = byte;
  data[index + 3] = 255;
}

function makeTexture(
  canvas: HTMLCanvasElement,
  colorTexture: boolean
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 8;
  texture.colorSpace = colorTexture ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return texture;
}

interface Crater {
  u: number;
  v: number;
  radius: number;
  depth: number;
}

function buildCraters(seed: number, count = 34): Crater[] {
  const craters: Crater[] = [];
  for (let i = 0; i < count; i++) {
    const u = pseudoNoise3D(i * 2.31, 1.7, 8.2, seed + 101);
    const v = 0.08 + pseudoNoise3D(i * 0.83, 6.1, 3.8, seed + 211) * 0.84;
    const sizeNoise = pseudoNoise3D(i * 4.7, 2.2, 9.1, seed + 307);
    craters.push({
      u,
      v,
      radius: 0.008 + Math.pow(sizeNoise, 2.2) * 0.065,
      depth: 0.12 + sizeNoise * 0.28,
    });
  }
  return craters;
}

function emptyTextureSet(): PlanetTextureSet {
  const canvas = {} as HTMLCanvasElement;
  const texture = new THREE.CanvasTexture(canvas);
  return {
    map: texture,
    bumpMap: texture,
    roughnessMap: texture,
    emissiveMap: texture,
    cloudMap: null,
  };
}

export function getPlanetTextures(
  type: PlanetTextureType,
  primaryHex: string,
  secondaryHex: string,
  accentHex: string,
  seed = 42
): PlanetTextureSet {
  const cacheKey = `${type}_${primaryHex}_${secondaryHex}_${accentHex}_${seed}`;
  if (textureCache[cacheKey]) return textureCache[cacheKey];
  if (typeof document === "undefined") return emptyTextureSet();

  // Spherical 3D sampling keeps both the date-line seam and the poles continuous.
  const width = 512;
  const height = 256;
  const colorCanvas = document.createElement("canvas");
  const bumpCanvas = document.createElement("canvas");
  const roughnessCanvas = document.createElement("canvas");
  const emissiveCanvas = document.createElement("canvas");
  const cloudCanvas = document.createElement("canvas");

  for (const canvas of [
    colorCanvas,
    bumpCanvas,
    roughnessCanvas,
    emissiveCanvas,
    cloudCanvas,
  ]) {
    canvas.width = width;
    canvas.height = height;
  }

  const colorContext = colorCanvas.getContext("2d")!;
  const bumpContext = bumpCanvas.getContext("2d")!;
  const roughnessContext = roughnessCanvas.getContext("2d")!;
  const emissiveContext = emissiveCanvas.getContext("2d")!;
  const cloudContext = cloudCanvas.getContext("2d")!;

  const colorImage = colorContext.createImageData(width, height);
  const bumpImage = bumpContext.createImageData(width, height);
  const roughnessImage = roughnessContext.createImageData(width, height);
  const emissiveImage = emissiveContext.createImageData(width, height);
  const cloudImage = cloudContext.createImageData(width, height);

  const primary = colorTuple(new THREE.Color(primaryHex));
  const secondary = colorTuple(new THREE.Color(secondaryHex));
  const accent = colorTuple(new THREE.Color(accentHex));
  const black: [number, number, number] = [0, 0, 0];
  const warmGlow: [number, number, number] = [1, 0.42, 0.06];
  const cityGlow: [number, number, number] = [1, 0.62, 0.24];
  const craters = type === "cratered" ? buildCraters(seed) : [];

  let hasClouds = false;

  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    const latitude = (0.5 - v) * Math.PI;
    const cosLatitude = Math.cos(latitude);
    const sphereY = Math.sin(latitude);

    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);
      const longitude = u * TAU;
      const sphereX = Math.cos(longitude) * cosLatitude;
      const sphereZ = Math.sin(longitude) * cosLatitude;
      const index = (y * width + x) * 4;

      let color = primary;
      let relief = 0.5;
      let roughness = 0.68;
      let emissive = black;
      let cloudAlpha = 0;

      if (type === "gas_giant") {
        const warp =
          (fbm3D(sphereX * 2.1, sphereY * 2.1, sphereZ * 2.1, 4, seed) - 0.5) *
          0.038;
        const zonal = v + warp;
        const broadBands =
          Math.sin(zonal * Math.PI * 18 + 0.8) * 0.24 +
          Math.sin(zonal * Math.PI * 38 - 1.7) * 0.12 +
          Math.sin(zonal * Math.PI * 74 + 2.4) * 0.055;
        const turbulence =
          (fbm3D(sphereX * 7.5, sphereY * 2.0, sphereZ * 7.5, 4, seed + 31) - 0.5) *
          0.22;
        const bandValue = clamp01(0.5 + broadBands + turbulence);

        color = mixColor(primary, secondary, bandValue);
        const polarHood = smoothstep(0.72, 0.98, Math.abs(sphereY));
        color = mixColor(color, multiplyColor(primary, 0.48), polarHood * 0.58);

        const stormU = 0.66;
        const stormV = 0.64;
        const wrappedU = Math.min(Math.abs(u - stormU), 1 - Math.abs(u - stormU));
        const stormDistance = Math.hypot(wrappedU / 0.095, (v - stormV) / 0.042);
        const stormBody = 1 - smoothstep(0.42, 1.0, stormDistance);
        const stormEye = 1 - smoothstep(0.0, 0.23, stormDistance);
        const stormRing = Math.max(0, stormBody - stormEye * 0.8);
        color = mixColor(color, accent, stormBody * 0.82);
        color = mixColor(color, multiplyColor(primary, 0.55), stormEye * 0.72);

        relief = clamp01(0.48 + broadBands * 0.6 + stormRing * 0.28);
        roughness = 0.64 + turbulence * 0.22;
      } else if (type === "terrestrial" || type === "boreal") {
        const continental =
          fbm3D(sphereX * 2.6, sphereY * 2.6, sphereZ * 2.6, 6, seed) * 0.94 +
          (ridged3D(sphereX * 5.2, sphereY * 5.2, sphereZ * 5.2, 4, seed + 41) - 0.5) *
            0.18;
        const landMask = smoothstep(0.48, 0.56, continental);
        const shelf = smoothstep(0.38, 0.52, continental);
        const mountains =
          ridged3D(sphereX * 11.0, sphereY * 11.0, sphereZ * 11.0, 4, seed + 83) *
          landMask;

        const deepOcean = multiplyColor(primary, 0.48);
        const shallowOcean = mixColor(primary, secondary, 0.2);
        const ocean = mixColor(deepOcean, shallowOcean, shelf);
        const lowland = mixColor(secondary, primary, type === "boreal" ? 0.2 : 0.08);
        const highland = mixColor(secondary, accent, 0.08 + mountains * 0.32);
        color = mixColor(ocean, mixColor(lowland, highland, mountains), landMask);

        const polarIce = smoothstep(0.78, 0.95, Math.abs(sphereY));
        color = mixColor(color, accent, polarIce * (0.45 + landMask * 0.35));
        relief = clamp01(0.2 + landMask * (0.28 + mountains * 0.5) + polarIce * 0.08);
        roughness = THREE.MathUtils.lerp(0.34, 0.82, landMask);

        const cloudWarp =
          fbm3D(sphereX * 2.0 + 4, sphereY * 2.0, sphereZ * 2.0 - 2, 4, seed + 151) -
          0.5;
        const cloudField = fbm3D(
          sphereX * 6.0 + cloudWarp,
          sphereY * 4.1,
          sphereZ * 6.0 - cloudWarp,
          5,
          seed + 173
        );
        cloudAlpha = smoothstep(0.62, 0.76, cloudField) * (0.68 - polarIce * 0.22);
        hasClouds ||= cloudAlpha > 0.02;

        const settlementNoise = fbm3D(
          sphereX * 27,
          sphereY * 27,
          sphereZ * 27,
          3,
          seed + 251
        );
        const populationBand = 1 - smoothstep(0.5, 0.92, Math.abs(sphereY));
        const city =
          smoothstep(0.78, 0.9, settlementNoise) * landMask * populationBand * 0.72;
        emissive = multiplyColor(cityGlow, city);
      } else if (type === "volcanic") {
        const crust = fbm3D(sphereX * 5.6, sphereY * 5.6, sphereZ * 5.6, 5, seed);
        const plates = fbm3D(sphereX * 2.1, sphereY * 2.1, sphereZ * 2.1, 4, seed + 29);
        const fissureField = Math.abs(
          fbm3D(sphereX * 11, sphereY * 11, sphereZ * 11, 4, seed + 67) - 0.5
        );
        const fissure = 1 - smoothstep(0.018, 0.095 + plates * 0.035, fissureField);
        const lava = Math.pow(fissure, 1.55);

        const rock = mixColor(multiplyColor(primary, 0.34), secondary, crust * 0.72);
        color = mixColor(rock, mixColor(accent, warmGlow, 0.48), lava);
        relief = clamp01(0.32 + crust * 0.5 - lava * 0.28);
        roughness = 0.84 - lava * 0.52;
        emissive = multiplyColor(warmGlow, lava);
      } else if (type === "ice") {
        const iceField = fbm3D(sphereX * 5.2, sphereY * 5.2, sphereZ * 5.2, 5, seed);
        const firstFracture = Math.abs(
          fbm3D(sphereX * 17, sphereY * 17, sphereZ * 17, 3, seed + 43) - 0.5
        );
        const secondFracture = Math.abs(
          fbm3D(sphereX * 29 + 5, sphereY * 29, sphereZ * 29 - 3, 2, seed + 71) - 0.5
        );
        const fracture = Math.max(
          1 - smoothstep(0.012, 0.06, firstFracture),
          (1 - smoothstep(0.01, 0.035, secondFracture)) * 0.65
        );
        const frozenSea = mixColor(primary, secondary, iceField);
        color = mixColor(frozenSea, accent, fracture * 0.76);
        color = mixColor(color, accent, smoothstep(0.8, 0.98, Math.abs(sphereY)) * 0.32);
        relief = clamp01(0.38 + iceField * 0.34 + fracture * 0.18);
        roughness = 0.34 + iceField * 0.38 + fracture * 0.2;
      } else {
        const base = fbm3D(sphereX * 7, sphereY * 7, sphereZ * 7, 5, seed);
        let craterRelief = 0;
        let rayBrightness = 0;

        for (const crater of craters) {
          const rawU = Math.abs(u - crater.u);
          const du = Math.min(rawU, 1 - rawU) * Math.max(0.22, cosLatitude);
          const dv = v - crater.v;
          const distance = Math.hypot(du, dv);
          const normalized = distance / crater.radius;
          if (normalized > 2.4) continue;

          const bowl = normalized < 0.82 ? -(1 - normalized / 0.82) * crater.depth : 0;
          const rim = Math.exp(-Math.pow((normalized - 0.96) / 0.13, 2)) * crater.depth * 1.15;
          craterRelief += bowl + rim;
          rayBrightness +=
            Math.max(0, 1 - normalized / 2.4) *
            (0.5 + 0.5 * Math.sin(Math.atan2(dv, du + 0.0001) * 9 + crater.u * 31)) *
            crater.depth *
            0.18;
        }

        const mineral = clamp01(base * 0.8 + craterRelief * 0.85 + rayBrightness);
        color = mixColor(primary, secondary, mineral);
        color = mixColor(color, accent, Math.max(0, craterRelief) * 0.32 + rayBrightness);
        relief = clamp01(0.5 + (base - 0.5) * 0.5 + craterRelief);
        roughness = clamp01(0.72 + base * 0.2 + Math.max(0, craterRelief) * 0.22);
      }

      // Fine mineral grain keeps close views from reading as a smooth painted ball.
      const microGrain =
        smoothNoise3D(sphereX * 96, sphereY * 96, sphereZ * 96, seed + 911) - 0.5;
      color = multiplyColor(color, 0.965 + microGrain * 0.11);
      relief = clamp01(relief + microGrain * 0.055);

      writeColor(colorImage.data, index, color);
      writeScalar(bumpImage.data, index, relief);
      writeScalar(roughnessImage.data, index, roughness);
      writeColor(emissiveImage.data, index, emissive);
      writeColor(
        cloudImage.data,
        index,
        [0.88 + cloudAlpha * 0.08, 0.94, 1],
        cloudAlpha
      );
    }
  }

  colorContext.putImageData(colorImage, 0, 0);
  bumpContext.putImageData(bumpImage, 0, 0);
  roughnessContext.putImageData(roughnessImage, 0, 0);
  emissiveContext.putImageData(emissiveImage, 0, 0);
  cloudContext.putImageData(cloudImage, 0, 0);

  const result: PlanetTextureSet = {
    map: makeTexture(colorCanvas, true),
    bumpMap: makeTexture(bumpCanvas, false),
    roughnessMap: makeTexture(roughnessCanvas, false),
    emissiveMap: makeTexture(emissiveCanvas, true),
    cloudMap: hasClouds ? makeTexture(cloudCanvas, true) : null,
  };

  textureCache[cacheKey] = result;
  return result;
}

export function getRingTexture(colorHex: string, innerRatio = 0.6): THREE.CanvasTexture {
  const cacheKey = `${colorHex}_${innerRatio.toFixed(3)}`;
  if (ringTextureCache[cacheKey]) return ringTextureCache[cacheKey];

  if (typeof document === "undefined") {
    return new THREE.CanvasTexture({} as HTMLCanvasElement);
  }

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d")!;
  const image = context.createImageData(size, size);
  const base = colorTuple(new THREE.Color(colorHex));
  const center = size / 2;

  // Broad material zones, narrow ringlets, particulate grain, and two divisions.
  const bands = [
    [0.0, 0.12, 0.16],
    [0.12, 0.36, 0.62],
    [0.36, 0.54, 0.9],
    [0.54, 0.59, 0.055],
    [0.59, 0.79, 0.74],
    [0.79, 0.82, 0.08],
    [0.82, 0.94, 0.48],
    [0.96, 0.985, 0.28],
  ] as const;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const dx = (x + 0.5 - center) / center;
      const dy = (y + 0.5 - center) / center;
      const radius = Math.hypot(dx, dy);

      if (radius < innerRatio || radius > 1) {
        writeColor(image.data, index, base, 0);
        continue;
      }

      const normalized = (radius - innerRatio) / (1 - innerRatio);
      let density = 0;
      for (const [start, end, opacity] of bands) {
        if (normalized < start || normalized >= end) continue;
        const local = (normalized - start) / (end - start);
        const edge = smoothstep(0, 0.08, local) * (1 - smoothstep(0.92, 1, local));
        density = opacity * edge;
        break;
      }

      const ringlets =
        0.7 +
        0.18 * Math.sin(normalized * 760) +
        0.1 * Math.sin(normalized * 1730 + 1.8);
      const particulate =
        0.9 +
        (pseudoNoise3D(x * 0.13, y * 0.13, normalized * 20, 917) - 0.5) * 0.18;
      const alpha = clamp01(density * ringlets * particulate);
      const brightness = 0.72 + normalized * 0.24 + Math.sin(normalized * 220) * 0.06;
      writeColor(image.data, index, multiplyColor(base, brightness), alpha);
    }
  }

  context.putImageData(image, 0, 0);
  const texture = makeTexture(canvas, true);
  ringTextureCache[cacheKey] = texture;
  return texture;
}
