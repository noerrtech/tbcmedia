import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { assets } from "./assets";

function prep<T extends Record<string, THREE.Texture>>(set: T, { srgb = ["map"], flipY = true } = {}) {
  for (const [key, t] of Object.entries(set)) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    t.flipY = flipY;
    t.colorSpace = srgb.includes(key) ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.needsUpdate = true;
  }
  return set;
}

/** The lobby's material palette: smoked walnut, worn-in brass, black stone, plaster. */
export function usePalette() {
  const walnutTex = useTexture(assets.walnut);
  const brassTex = useTexture(assets.brass);

  return useMemo(() => {
    prep(walnutTex);
    prep(brassTex, { srgb: [] });

    const walnut = new THREE.MeshStandardMaterial({
      ...walnutTex,
      color: "#6b4630", // the veneer scan is light; tint it down to a deep smoked walnut
      roughness: 0.95,
      normalScale: new THREE.Vector2(0.8, 0.8),
      envMapIntensity: 0.8,
    });

    const brass = new THREE.MeshStandardMaterial({
      color: "#C99A45",
      metalness: 1,
      roughness: 0.55, // × the worn-brass map: a satin brass, not a mirror
      roughnessMap: brassTex.roughnessMap,
      normalMap: brassTex.normalMap,
      normalScale: new THREE.Vector2(0.12, 0.12),
      envMapIntensity: 1.3,
    });

    const stone = new THREE.MeshPhysicalMaterial({
      color: "#15110e",
      roughness: 0.22,
      clearcoat: 0.7,
      clearcoatRoughness: 0.12,
      envMapIntensity: 0.9,
    });

    const plaster = new THREE.MeshStandardMaterial({ color: "#0f0c0a", roughness: 1, envMapIntensity: 0.3 });

    // dark honed stone for room floors — no clearcoat, low env, so it doesn't glare at grazing angles
    const floor = new THREE.MeshStandardMaterial({ color: "#0d0b09", roughness: 0.42, envMapIntensity: 0.12 });

    const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffd9a8").multiplyScalar(2.2), toneMapped: false });

    return { walnut, brass, stone, plaster, glow, floor };
  }, [walnutTex, brassTex]);
}

export function useFloorTextures() {
  const t = useTexture(assets.marble);
  return useMemo(() => {
    prep(t);
    for (const tex of Object.values(t)) tex.repeat.set(5, 8);
    return t;
  }, [t]);
}

/** An arched doorway cut through a wall: centred at `u` along the wall's axis, base on the floor. */
export type Cut = { axis: "x" | "z"; u: number; width: number; height: number };

/**
 * A copy of `base` with arched openings cut through it (fragments discarded in world space),
 * so the camera can walk through real doorways without splitting the wall geometry.
 */
export function cutMaterial<T extends THREE.MeshStandardMaterial>(base: T, cuts: Cut[]): T {
  const m = base.clone() as T;
  const MAX = 3;
  const values = Array.from({ length: MAX }, (_, i) => {
    const c = cuts[i];
    return c ? new THREE.Vector4(c.u, c.width / 2, c.height, c.axis === "x" ? 0 : 1) : new THREE.Vector4();
  });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uCuts = { value: values };
    shader.uniforms.uCutCount = { value: Math.min(MAX, cuts.length) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vCutPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvCutPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vCutPos;
        uniform vec4 uCuts[${MAX}];
        uniform int uCutCount;
        float cutArch(vec2 p, float w, float h) {
          float sh = h - w;
          float d = p.y < sh ? abs(p.x) - w : length(vec2(p.x, p.y - sh)) - w;
          return max(d, -p.y);
        }`,
      )
      .replace(
        "void main() {",
        `void main() {
        for (int i = 0; i < ${MAX}; i++) {
          if (i >= uCutCount) break;
          vec4 c = uCuts[i];
          float u = c.w < 0.5 ? vCutPos.x : vCutPos.z;
          if (cutArch(vec2(u - c.x, vCutPos.y), c.y, c.z) < 0.0) discard;
        }`,
      );
  };
  m.customProgramCacheKey = () => `cut${MAX}`;
  return m;
}

/** Deep velvet, with sheen — the curtain and the stage drapes. */
export function velvetMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: "#200a08", // oxblood: the Mughal Noir browns, with enough red to read as velvet
    roughness: 0.85,
    sheen: 1,
    sheenColor: new THREE.Color("#733c2c"),
    sheenRoughness: 0.42,
    envMapIntensity: 0.6,
    side: THREE.DoubleSide,
  });
}
