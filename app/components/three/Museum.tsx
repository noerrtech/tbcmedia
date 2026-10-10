import { Text } from "@react-three/drei";
import { useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { work, type WorkCategory } from "~/content/site";
import { CZ, EXHIBITS, GW, HALL_START, H_GALLERY, H_ROTUNDA, MONUMENT_R, R, R0, R1, X0, type Exhibit } from "~/lib/museum";
import { assets } from "./assets";
import { trackedText, useCanvasTexture } from "./canvasTexture";
import { extrudedText, flutedGeometry, metricUVs, radialTexture } from "./geometry";
import type { usePalette } from "./materials";
import { museumGo, museumNotify, world } from "./world";

/**
 * THE MUSEUM OF IMPACT — the building behind the Work room's curtain: an entrance hall, a top-lit
 * rotunda with the 419M+ monument at its centre, and five galleries opening off it, one per case
 * study. Each gallery's main exhibit is a lit wall you can read from the rotunda; hover it and it
 * brightens, click it and you walk there and its story opens. The plan is in ~/lib/museum.
 */

type Palette = ReturnType<typeof usePalette>;

const OPEN = Math.asin(GW / 2 / R); // half the angle a gallery opening takes out of the rotunda wall
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Each gallery's colour — the light in the room and the ground of its exhibit. */
const tones = [
  { light: "#ffcf9a", a: "#7a5530", b: "#2a1a10", c: "#0d0806" }, // built from zero — warm, raw
  { light: "#ffc7b0", a: "#6b3438", b: "#22100f", c: "#0b0606" }, // repositioned — oxblood
  { light: "#cfe0ff", a: "#3b4c5e", b: "#141b22", c: "#07090b" }, // made visible — screen blue
  { light: "#ffd59a", a: "#7c6232", b: "#261d10", c: "#0b0805" }, // made desirable — gold
  { light: "#d9f0c8", a: "#465a3e", b: "#161d14", c: "#070906" }, // made to grow — green
];

/* ------------------------------------------------------------------------- */
/*  Materials                                                                */
/* ------------------------------------------------------------------------- */

function useMuseumMaterials() {
  const m = useMemo(
    () => ({
      // warm limestone for the rotunda: light enough to read the space by
      limestone: new THREE.MeshStandardMaterial({ color: "#8c7660", roughness: 0.9, envMapIntensity: 0.5, side: THREE.BackSide }),
      // the gallery walls behind the exhibits: deep and matte, so the exhibit is the brightest thing
      gallery: new THREE.MeshStandardMaterial({ color: "#2a1d14", roughness: 0.95, envMapIntensity: 0.3 }),
      ceiling: new THREE.MeshStandardMaterial({ color: "#3b2a1e", roughness: 1, envMapIntensity: 0.2 }),
      plinth: new THREE.MeshStandardMaterial({ color: "#d8cbb4", roughness: 0.55, envMapIntensity: 0.6 }),
      stone: new THREE.MeshStandardMaterial({ color: "#5a4a3a", roughness: 0.85 }),
      brass: new THREE.MeshStandardMaterial({ color: "#C99A45", metalness: 1, roughness: 0.3 }),
      gold: new THREE.MeshStandardMaterial({ color: "#d9b77e", metalness: 1, roughness: 0.22, envMapIntensity: 1.8 }),
      oxblood: new THREE.MeshStandardMaterial({ color: "#4a1712", roughness: 0.8, side: THREE.DoubleSide }),
      grey: new THREE.MeshStandardMaterial({ color: "#4b4137", roughness: 0.7 }),
    }),
    [],
  );
  useLayoutEffect(() => () => Object.values(m).forEach((x) => x.dispose()), [m]);
  return m;
}
type Mats = ReturnType<typeof useMuseumMaterials>;

/* ------------------------------------------------------------------------- */
/*  The exhibit wall: readable from the rotunda                              */
/* ------------------------------------------------------------------------- */

function wrapLines(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > max && line) (lines.push(line), (line = w));
    else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

/** What you can read without clicking: which story, its headline, its result, and the invitation. */
function paintExhibit(c: WorkCategory, i: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const t = tones[i % tones.length];
    const g = ctx.createRadialGradient(w * 0.78, h * 0.2, 0, w * 0.55, h * 0.5, w * 0.9);
    g.addColorStop(0, t.a);
    g.addColorStop(0.55, t.b);
    g.addColorStop(1, t.c);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const pad = w * 0.065;
    // the gallery number, large and quiet, as the image until real work is hung
    ctx.fillStyle = "rgba(243,234,216,0.07)";
    ctx.font = '800 560px "Manrope", sans-serif';
    ctx.textAlign = "right";
    ctx.fillText(String(i + 1).padStart(2, "0"), w - pad * 0.5, h * 0.72);
    ctx.textAlign = "left";
    ctx.fillStyle = "#C99A45";
    ctx.font = '600 30px "Manrope", sans-serif';
    trackedText(ctx, `GALLERY ${String(i + 1).padStart(2, "0")}  ·  ${c.subtitle.toUpperCase()}`, pad, pad + 26, 5);
    ctx.fillStyle = "#F3EAD8";
    ctx.font = '700 132px "Manrope", sans-serif';
    ctx.fillText(c.title, pad, pad + 190);
    ctx.fillStyle = "rgba(243,234,216,0.88)";
    ctx.font = '400 42px "DM Sans", sans-serif';
    wrapLines(ctx, c.body, w * 0.62).slice(0, 3).forEach((l, k) => ctx.fillText(l, pad, pad + 270 + k * 56));
    // the result
    const m = c.metrics?.[0];
    const y = h - pad - 120;
    if (m) {
      ctx.fillStyle = "#D9B98A";
      ctx.font = '800 150px "Manrope", sans-serif';
      ctx.fillText(m.value, pad, y + 20);
      const vw = ctx.measureText(m.value).width;
      ctx.fillStyle = "rgba(243,234,216,0.85)";
      ctx.font = '500 34px "DM Sans", sans-serif';
      wrapLines(ctx, m.label, w * 0.3).forEach((l, k) => ctx.fillText(l, pad + vw + 30, y - 40 + k * 42));
    } else {
      ctx.fillStyle = "#D9B98A";
      ctx.font = '600 30px "Manrope", sans-serif';
      trackedText(ctx, "WHAT CHANGED", pad, y - 50, 5);
      ctx.fillStyle = "rgba(243,234,216,0.9)";
      ctx.font = 'italic 400 44px "DM Sans", sans-serif';
      wrapLines(ctx, c.change, w * 0.7).slice(0, 2).forEach((l, k) => ctx.fillText(l, pad, y + 6 + k * 54));
    }
    ctx.fillStyle = "#C99A45";
    ctx.font = '700 30px "Manrope", sans-serif';
    trackedText(ctx, "EXPLORE THIS STORY  →", pad, h - pad + 4, 5);
  };
}

const PANEL_W = 4.4;
const PANEL_H = 2.75;

/** Pointer handling shared by everything that belongs to an exhibit. */
function useExhibitPointer(i: number) {
  return {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (world.museum.hovered !== i) {
        world.museum.hovered = i;
        document.body.style.cursor = "pointer";
        museumNotify();
      }
    },
    onPointerOut: () => {
      if (world.museum.hovered === i) {
        world.museum.hovered = -1;
        document.body.style.cursor = "";
        museumNotify();
      }
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (world.museum.dragged) return;
      museumGo(EXHIBITS[i].node, true);
    },
  };
}

function ExhibitWall({ c, i, m }: { c: WorkCategory; i: number; m: Mats }) {
  const tex = useCanvasTexture(paintExhibit(c, i), 1536, 960, `exhibit-${c.id}`);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const halo = useRef<THREE.MeshBasicMaterial>(null);
  const pointer = useExhibitPointer(i);
  useFrame((_, dt) => {
    // a gentle lift on hover, and while its story is open
    const on = world.museum.hovered === i || world.museum.panel === i ? 1 : 0;
    if (mat.current) {
      const k = mat.current.userData.k ?? 0;
      const next = k + (on - k) * Math.min(1, dt * 6);
      mat.current.userData.k = next;
      mat.current.color.setScalar(0.9 + next * 0.14);
      if (halo.current) halo.current.opacity = 0.16 + next * 0.3;
    }
  });
  return (
    <group position={[0, 2.25, R1 - 0.06]} rotation-y={Math.PI} {...pointer}>
      {/* the lit niche around it */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[PANEL_W + 1.6, PANEL_H + 1.2]} />
        <meshBasicMaterial ref={halo} map={radialTexture()} color={tones[i].light} transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[PANEL_W, PANEL_H]} />
        <meshBasicMaterial ref={mat} map={tex} toneMapped={false} />
      </mesh>
      {/* a fine brass edge */}
      {[
        [0, PANEL_H / 2 + 0.015, PANEL_W + 0.06, 0.03],
        [0, -PANEL_H / 2 - 0.015, PANEL_W + 0.06, 0.03],
        [-PANEL_W / 2 - 0.015, 0, 0.03, PANEL_H + 0.06],
        [PANEL_W / 2 + 0.015, 0, 0.03, PANEL_H + 0.06],
      ].map(([x, y, w, h], k) => (
        <mesh key={k} material={m.brass} position={[x, y, 0.015]}>
          <boxGeometry args={[w, h, 0.03]} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------------- */
/*  The screens either side: the story in two beats                          */
/* ------------------------------------------------------------------------- */

/** Left: the problem. Right: what we did, and with what. */
function paintSide(c: WorkCategory, i: number, side: "problem" | "approach") {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const t = tones[i % tones.length];
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, side === "problem" ? t.c : t.b);
    g.addColorStop(1, side === "problem" ? t.b : t.c);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const pad = w * 0.08;
    ctx.fillStyle = "#C99A45";
    ctx.font = '600 30px "Manrope", sans-serif';
    trackedText(ctx, side === "problem" ? "THE PROBLEM" : "WHAT WE DID", pad, pad + 24, 5);
    ctx.fillStyle = "#F3EAD8";
    ctx.font = '600 58px "Manrope", sans-serif';
    const text = side === "problem" ? c.problem : c.approach;
    const lines = wrapLines(ctx, text, w - pad * 2).slice(0, 5);
    lines.forEach((l, k) => ctx.fillText(l, pad, pad + 120 + k * 72));
    if (side === "approach") {
      ctx.fillStyle = "rgba(217,185,138,0.9)";
      ctx.font = '500 28px "Manrope", sans-serif';
      trackedText(ctx, c.services.join("  ·  ").toUpperCase(), pad, h - pad, 3);
    } else {
      ctx.fillStyle = "rgba(243,234,216,0.55)";
      ctx.font = '500 28px "Manrope", sans-serif';
      trackedText(ctx, `GALLERY ${String(i + 1).padStart(2, "0")}  ·  ${c.title.toUpperCase()}`, pad, h - pad, 3);
    }
  };
}

const SIDE_W = 2.5;
const SIDE_H = 1.56;
const SIDE_TILT = 0.45; // turned toward the visitor coming in from the rotunda

function SideScreen({ c, i, side, m }: { c: WorkCategory; i: number; side: "problem" | "approach"; m: Mats }) {
  const tex = useCanvasTexture(paintSide(c, i, side), 1280, 800, `side-${side}-${c.id}`);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const pointer = useExhibitPointer(i);
  useFrame((_, dt) => {
    const on = world.museum.hovered === i || world.museum.panel === i ? 1 : 0;
    if (!mat.current) return;
    const k = mat.current.userData.k ?? 0;
    const next = k + (on - k) * Math.min(1, dt * 6);
    mat.current.userData.k = next;
    mat.current.color.setScalar(0.88 + next * 0.14);
  });
  // facing into the gallery (+z), your left is +x: the problem on the left, what we did on the right;
  // both turned toward the gallery's opening (-z)
  const s = side === "problem" ? 1 : -1;
  const rot = s < 0 ? Math.PI / 2 + SIDE_TILT : -Math.PI / 2 - SIDE_TILT;
  const x = s * (GW / 2 - 0.06 - (SIDE_W / 2) * Math.sin(SIDE_TILT));
  return (
    <group position={[x, 2.05, 10.7]} rotation-y={rot} {...pointer}>
      <mesh>
        <planeGeometry args={[SIDE_W, SIDE_H]} />
        <meshBasicMaterial ref={mat} map={tex} toneMapped={false} />
      </mesh>
      {[
        [0, SIDE_H / 2 + 0.015, SIDE_W + 0.06, 0.03],
        [0, -SIDE_H / 2 - 0.015, SIDE_W + 0.06, 0.03],
        [-SIDE_W / 2 - 0.015, 0, 0.03, SIDE_H + 0.06],
        [SIDE_W / 2 + 0.015, 0, 0.03, SIDE_H + 0.06],
      ].map(([px, py, w, h], k) => (
        <mesh key={k} material={m.brass} position={[px, py, 0.015]}>
          <boxGeometry args={[w, h, 0.03]} />
        </mesh>
      ))}
      {/* the bracket that holds it off the wall */}
      <mesh material={m.brass} position={[(-s * SIDE_W) / 2 + s * 0.05, 0, -0.12]}>
        <boxGeometry args={[0.04, SIDE_H * 0.6, 0.24]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------------- */
/*  The installations: each gallery composed for its story                   */
/* ------------------------------------------------------------------------- */

function Plinth({ x, z, h = 0.9, w = 0.9, m, children }: { x: number; z: number; h?: number; w?: number; m: Mats; children?: ReactNode }) {
  return (
    <group position={[x, 0, z]}>
      <mesh material={m.plinth} position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, w]} />
      </mesh>
      <group position={[0, h, 0]}>{children}</group>
    </group>
  );
}

/** Reels playing on a small screen: drifting light in the gallery's colours. */
function useReelMaterial(a: string, b: string, seed: number) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uA: { value: new THREE.Color(a) }, uB: { value: new THREE.Color(b) }, uSeed: { value: seed } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform float uSeed; varying vec2 vUv;
          void main(){
            float t = uTime * 0.35 + uSeed;
            float v = 0.5 + 0.5 * sin(vUv.x * 5.0 + t) * cos(vUv.y * 4.0 - t * 1.3);
            vec3 c = mix(uB, uA, clamp(v, 0.0, 1.0));
            c *= 0.75 + 0.25 * step(0.5, fract(vUv.y * 90.0));
            gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
          }`,
        toneMapped: false,
      }),
    [a, b, seed],
  );
  useLayoutEffect(() => () => mat.dispose(), [mat]);
  useFrame(({ clock }) => (mat.uniforms.uTime.value = clock.elapsedTime));
  return mat;
}

function ReelTower({ x, z, i, m }: { x: number; z: number; i: number; m: Mats }) {
  const t = tones[i];
  const mats = [useReelMaterial(t.a, t.c, 0), useReelMaterial("#C99A45", t.c, 2), useReelMaterial(t.a, "#1B120D", 4)];
  return (
    <group position={[x, 0, z]} rotation-y={x < 0 ? -Math.PI / 2 + 0.5 : Math.PI / 2 - 0.5}>
      <mesh material={m.stone} position={[0, 0.3, 0]}>
        <boxGeometry args={[0.7, 0.6, 0.5]} />
      </mesh>
      {mats.map((mat, k) => (
        <group key={k} position={[0, 0.98 + k * 0.78, 0]}>
          <mesh material={m.brass}>
            <boxGeometry args={[0.5, 0.74, 0.06]} />
          </mesh>
          <mesh material={mat} position={[0, 0, 0.032]}>
            <planeGeometry args={[0.44, 0.68]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Banner({ x, z, word, m }: { x: number; z: number; word: string; m: Mats }) {
  return (
    <group position={[x, 0, z]} rotation-y={x < 0 ? Math.PI / 2 - 0.45 : -Math.PI / 2 + 0.45}>
      <mesh material={m.brass} position={[0, 3.95, 0]}>
        <boxGeometry args={[1.2, 0.04, 0.04]} />
      </mesh>
      <mesh material={m.oxblood} position={[0, 2.4, 0]}>
        <planeGeometry args={[1.1, 3.0]} />
      </mesh>
      <Text font={assets.fonts.display} fontSize={0.17} letterSpacing={0.3} anchorX="center" position={[0, 2.6, 0.01]} maxWidth={1}>
        {word.toUpperCase()}
        <meshBasicMaterial color="#D9B98A" toneMapped={false} />
      </Text>
    </group>
  );
}

/** Each gallery's installation, on both sides of its walkway (where ~/lib/museum keeps the floor clear). */
function Installation({ e, m }: { e: Exhibit; m: Mats }) {
  const z = 12.6;
  switch (e.index) {
    case 0: // built from zero: the blank block, and the brand it became
      return (
        <>
          <Plinth x={-2.05} z={z} m={m}>
            <mesh material={m.stone} position={[0, 0.32, 0]} rotation-y={0.4} castShadow>
              <boxGeometry args={[0.62, 0.62, 0.62]} />
            </mesh>
          </Plinth>
          <Plinth x={2.05} z={z} m={m}>
            <mesh material={m.gold} position={[0, 0.3, 0]} rotation-y={0.4} castShadow>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
            </mesh>
          </Plinth>
        </>
      );
    case 1: // repositioned: the shelf of look-alikes, and the one that stands apart
      return (
        <>
          <Plinth x={-2.05} z={z} w={1.1} h={0.7} m={m}>
            {[-0.36, -0.12, 0.12, 0.36].map((dx) => (
              <mesh key={dx} material={m.grey} position={[dx, 0.17, 0]}>
                <boxGeometry args={[0.18, 0.34, 0.18]} />
              </mesh>
            ))}
          </Plinth>
          <Plinth x={2.05} z={z} h={1.15} w={0.7} m={m}>
            <mesh material={m.gold} position={[0, 0.2, 0]}>
              <boxGeometry args={[0.2, 0.4, 0.2]} />
            </mesh>
          </Plinth>
        </>
      );
    case 2: // made visible: towers of reels
      return (
        <>
          <ReelTower x={-2.05} z={z} i={e.index} m={m} />
          <ReelTower x={2.05} z={z} i={e.index} m={m} />
        </>
      );
    case 3: // made desirable: campaign banners
      return (
        <>
          <Banner x={-2.05} z={z} word={work[3].services[0]} m={m} />
          <Banner x={2.05} z={z} word={work[3].services[1]} m={m} />
        </>
      );
    default: // made to grow: results rising, and the reach of the community
      return (
        <>
          <Plinth x={-2.05} z={z} h={0.5} w={1.1} m={m}>
            {[0.35, 0.6, 0.9, 1.25, 1.65].map((hh, k) => (
              <mesh key={k} material={m.brass} position={[-0.4 + k * 0.2, hh / 2, 0]}>
                <boxGeometry args={[0.13, hh, 0.13]} />
              </mesh>
            ))}
          </Plinth>
          <Plinth x={2.05} z={z} m={m}>
            <mesh material={m.brass} position={[0, 0.42, 0]}>
              <sphereGeometry args={[0.38, 20, 14]} />
              <meshStandardMaterial color="#C99A45" metalness={1} roughness={0.3} wireframe />
            </mesh>
          </Plinth>
        </>
      );
  }
}

/* ------------------------------------------------------------------------- */
/*  The galleries                                                            */
/* ------------------------------------------------------------------------- */

function Gallery({ e, p, m }: { e: Exhibit; p: Palette; m: Mats }) {
  const c = work[e.index];
  const depth = R1 - R0 + 0.3;
  const mid = (R0 + R1) / 2;
  const side = useMemo(() => metricUVs(new THREE.PlaneGeometry(depth, H_GALLERY), 1.6), [depth]);
  const pointer = useExhibitPointer(e.index);
  return (
    // local frame: +z runs out from the rotunda's centre into the gallery
    <group position={[X0, 0, CZ]} rotation-y={rad(e.deg)}>
      {/* walls: walnut sides, a deep back wall for the exhibit */}
      <mesh geometry={side} material={p.walnut} position={[-GW / 2, H_GALLERY / 2, mid]} rotation-y={Math.PI / 2} receiveShadow />
      <mesh geometry={side} material={p.walnut} position={[GW / 2, H_GALLERY / 2, mid]} rotation-y={-Math.PI / 2} receiveShadow />
      <mesh material={m.gallery} position={[0, H_GALLERY / 2, R1]} rotation-y={Math.PI}>
        <planeGeometry args={[GW, H_GALLERY]} />
      </mesh>
      <mesh material={m.ceiling} position={[0, H_GALLERY, mid]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[GW, depth]} />
      </mesh>
      <mesh material={p.floor} position={[0, 0.002, mid]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[GW, depth]} />
      </mesh>
      {/* cove light along the back wall, and a brass threshold where the gallery opens */}
      <mesh position={[0, H_GALLERY - 0.12, R1 - 0.1]}>
        <boxGeometry args={[GW - 0.4, 0.03, 0.06]} />
        <meshBasicMaterial color={new THREE.Color(tones[e.index].light).multiplyScalar(1.4)} toneMapped={false} />
      </mesh>
      <mesh material={m.brass} position={[0, 0.004, R0 - 0.2]}>
        <boxGeometry args={[GW, 0.006, 0.05]} />
      </mesh>
      <ExhibitWall c={c} i={e.index} m={m} />
      <SideScreen c={c} i={e.index} side="problem" m={m} />
      <SideScreen c={c} i={e.index} side="approach" m={m} />
      <group {...pointer}>
        <Installation e={e} m={m} />
      </group>
      {/* the gallery's name over its opening, read from the rotunda */}
      <Text font={assets.fonts.sans} fontSize={0.16} letterSpacing={0.4} anchorX="center" position={[0, H_GALLERY + 0.35, R0 - 0.35]} rotation-y={Math.PI}>
        {`${String(e.index + 1).padStart(2, "0")} — ${c.title.toUpperCase()}`}
        <meshBasicMaterial color="#D9B98A" toneMapped={false} />
      </Text>
      {/* light: the room's own, and its glow on the floor */}
      <pointLight position={[0, 3.6, 11.2]} color={tones[e.index].light} intensity={26} distance={10} decay={2} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, R1 - 1.6]}>
        <planeGeometry args={[GW, 3]} />
        <meshBasicMaterial map={radialTexture()} color={tones[e.index].a} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------------- */
/*  The rotunda and the monument                                             */
/* ------------------------------------------------------------------------- */

function Monument({ m }: { m: Mats }) {
  const font = useLoader(FontLoader, assets.fonts.displayTypeface);
  const geometry = useMemo(() => {
    const g = extrudedText(font, "419M+", { size: 1.05, depth: 0.14, tracking: -0.02, bevel: 0.016 });
    g.computeBoundingBox();
    const b = g.boundingBox!;
    g.translate(-(b.min.x + b.max.x) / 2, 0, -(b.min.z + b.max.z) / 2);
    return g;
  }, [font]);
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group position={[X0, 0, CZ]}>
      <mesh material={m.plinth} position={[0, 0.22, 0]} receiveShadow>
        <cylinderGeometry args={[MONUMENT_R, MONUMENT_R + 0.08, 0.44, 64]} />
      </mesh>
      <mesh material={m.brass} position={[0, 0.445, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[MONUMENT_R - 0.06, MONUMENT_R, 64]} />
      </mesh>
      {/* a stone stele, the figure in gold on both faces: read from the entrance and from the far side */}
      <mesh material={m.stone} position={[0, 1.14, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.3, 1.4, 0.18]} />
      </mesh>
      {[0, Math.PI].map((r) => (
        <group key={r} rotation-y={r}>
          <mesh geometry={geometry} material={m.gold} position={[0, 0.66, 0.1]} castShadow />
          <Text font={assets.fonts.sans} fontSize={0.12} letterSpacing={0.45} anchorX="center" position={[0, 0.26, MONUMENT_R + 0.09]}>
            VIEWS · WITHOUT A RUPEE SPENT ON ADS
            <meshBasicMaterial color="#1B120D" toneMapped={false} />
          </Text>
        </group>
      ))}
    </group>
  );
}

function Rotunda({ p, m }: { p: Palette; m: Mats }) {
  const floor = useMemo(() => metricUVs(new THREE.CircleGeometry(R, 96), 3, false), []);
  return (
    <group>
      {/* wall between the openings, and the band above them */}
      {Array.from({ length: 6 }, (_, k) => (
        <mesh key={k} material={m.limestone} position={[X0, H_GALLERY / 2, CZ]}>
          <cylinderGeometry args={[R, R, H_GALLERY, 24, 1, true, rad(60 * k) + OPEN, rad(60) - 2 * OPEN]} />
        </mesh>
      ))}
      <mesh position={[X0, (H_GALLERY + H_ROTUNDA) / 2, CZ]}>
        <cylinderGeometry args={[R, R, H_ROTUNDA - H_GALLERY, 96, 1, true]} />
        <meshStandardMaterial color="#7a6552" roughness={0.9} side={THREE.BackSide} />
      </mesh>
      {/* brass lines: a cornice at the openings' height, a skirting at the floor */}
      {[H_GALLERY, 0.02].map((y) => (
        <mesh key={y} material={m.brass} position={[X0, y, CZ]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[R - 0.04, y > 1 ? 0.035 : 0.02, 6, 96]} />
        </mesh>
      ))}
      {/* stone floor with brass rings */}
      <mesh geometry={floor} material={p.stone} position={[X0, 0, CZ]} rotation-x={-Math.PI / 2} receiveShadow />
      {[4.1, 7.2].map((r) => (
        <mesh key={r} material={m.brass} position={[X0, 0.003, CZ]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[r - 0.025, r, 96]} />
        </mesh>
      ))}
      {/* ceiling with an oculus: daylight onto the monument */}
      <mesh material={m.ceiling} position={[X0, H_ROTUNDA, CZ]} rotation-x={Math.PI / 2}>
        <ringGeometry args={[2.3, R + 0.05, 96]} />
      </mesh>
      <mesh position={[X0, H_ROTUNDA + 0.4, CZ]} rotation-x={Math.PI / 2}>
        <circleGeometry args={[2.3, 48]} />
        <meshBasicMaterial color={new THREE.Color("#fff1dc").multiplyScalar(1.6)} toneMapped={false} />
      </mesh>
      <mesh position={[X0, H_ROTUNDA + 0.2, CZ]}>
        <cylinderGeometry args={[2.3, 2.3, 0.4, 48, 1, true]} />
        <meshStandardMaterial color="#3b2a1e" side={THREE.BackSide} />
      </mesh>
      <Monument m={m} />
      {/* light: daylight down from the oculus, and a soft fill around the room */}
      <pointLight position={[X0, H_ROTUNDA - 0.6, CZ]} color="#fff0dc" intensity={70} distance={20} decay={1.6} />
      <pointLight position={[X0, 3.2, CZ + 3]} color="#ffd9a8" intensity={14} distance={12} decay={2} />
    </group>
  );
}

function EntranceHall({ p }: { p: Palette }) {
  const end = CZ + R0;
  const len = HALL_START - end + 0.2;
  const mid = (HALL_START + end) / 2;
  const wall = useMemo(() => flutedGeometry(len, H_GALLERY), [len]);
  return (
    <group>
      <mesh geometry={wall} material={p.walnut} position={[X0 - 3, H_GALLERY / 2, mid]} rotation-y={Math.PI / 2} receiveShadow />
      <mesh geometry={wall} material={p.walnut} position={[X0 + 3, H_GALLERY / 2, mid]} rotation-y={-Math.PI / 2} receiveShadow />
      <mesh material={p.floor} position={[X0, 0, mid]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[6, len]} />
      </mesh>
      <mesh material={p.plaster} position={[X0, H_GALLERY, mid]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[6, len]} />
      </mesh>
      {/* proscenium header between the tall stage and the hall */}
      <mesh material={p.walnut} position={[X0, H_GALLERY + 0.5, HALL_START]}>
        <boxGeometry args={[6, 1, 0.1]} />
      </mesh>
      {/* the museum's name on the left wall as you come in */}
      <group position={[X0 - 2.97, 0, -16.6]} rotation-y={Math.PI / 2}>
        <Text font={assets.fonts.display} fontSize={0.34} letterSpacing={0.08} anchorX="center" position={[0, 2.75, 0]}>
          The Museum of Impact
          <meshBasicMaterial color="#F3EAD8" toneMapped={false} />
        </Text>
        <Text font={assets.fonts.sans} fontSize={0.11} letterSpacing={0.35} anchorX="center" position={[0, 2.35, 0]}>
          FIVE GROWTH PROBLEMS · FIVE GALLERIES
          <meshBasicMaterial color="#C99A45" toneMapped={false} />
        </Text>
      </group>
      <pointLight position={[X0, 3.8, mid]} color="#ffd9a8" intensity={12} distance={9} decay={2} />
    </group>
  );
}

/** Opens up the fog while you're in the museum, so its far walls read; restores it outside. */
function MuseumFog() {
  const scene = useThree((s) => s.scene);
  useFrame((_, dt) => {
    const f = scene.fog as THREE.Fog | null;
    if (!f) return;
    const inside = world.route === "work";
    const k = Math.min(1, dt * 2);
    f.near += ((inside ? 24 : 13) - f.near) * k;
    f.far += ((inside ? 60 : 34) - f.far) * k;
  });
  return null;
}

export function Museum({ p }: { p: Palette }) {
  const m = useMuseumMaterials();
  return (
    <group>
      <EntranceHall p={p} />
      <Rotunda p={p} m={m} />
      {EXHIBITS.map((e) => <Gallery key={e.id} e={e} p={p} m={m} />)}
      <MuseumFog />
    </group>
  );
}
