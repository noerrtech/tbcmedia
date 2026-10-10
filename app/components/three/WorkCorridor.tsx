import { Text } from "@react-three/drei";
import { useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { work, type WorkCategory } from "~/content/site";
import { END_WALL, H, HW, SCREEN, SCREENS, START, X0, type Screen } from "~/lib/corridor";
import { assets } from "./assets";
import { trackedText, useCanvasTexture } from "./canvasTexture";
import { extrudedText, flutedGeometry, metricUVs, radialTexture } from "./geometry";
import type { usePalette } from "./materials";
import { world, workNotify } from "./world";

/**
 * The corridor behind the Work room's curtain: fluted walnut, a light along the ceiling, the case
 * studies lit on both walls — title cards on the left, each story in brief on the right — and 419M+
 * on the end wall. Hover a screen and it lifts; click it and the camera goes over to read it while
 * the page opens the full story (corridorCamera, CorridorRoom).
 */

type Palette = ReturnType<typeof usePalette>;

const palettes = [
  ["#6b4a2b", "#23170f", "#0b0806"],
  ["#4b2a2f", "#1c1012", "#090606"],
  ["#34404a", "#151a1f", "#070809"],
  ["#6a5532", "#241c10", "#0a0805"],
  ["#3d4a37", "#161b14", "#070806"],
];

function wrapLines(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const lines: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > max && line) (lines.push(line), (line = w));
    else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function ground(ctx: CanvasRenderingContext2D, w: number, h: number, i: number, fx: number) {
  const [a, b, d] = palettes[i % palettes.length];
  const g = ctx.createRadialGradient(w * fx, h * 0.25, 0, w * 0.5, h * 0.5, w * 0.85);
  g.addColorStop(0, a);
  g.addColorStop(0.55, b);
  g.addColorStop(1, d);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const shade = ctx.createLinearGradient(0, h * 0.35, 0, h);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
}

/** The title card: which story, what kind of problem, the result where there is one. */
function paintTitle(c: WorkCategory, i: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ground(ctx, w, h, i, 0.3);
    const pad = w * 0.07;
    ctx.fillStyle = "rgba(243,234,216,0.07)";
    ctx.font = '800 460px "Manrope", sans-serif';
    ctx.textAlign = "right";
    ctx.fillText(String(i + 1).padStart(2, "0"), w - pad * 0.5, h * 0.62);
    ctx.textAlign = "left";
    ctx.fillStyle = "#C99A45";
    ctx.font = '600 28px "Manrope", sans-serif';
    trackedText(ctx, `NO. ${String(i + 1).padStart(2, "0")}`, pad, pad + 24, 7);
    const m = c.metrics?.[0];
    if (m) {
      ctx.fillStyle = "#D9B98A";
      ctx.font = '800 120px "Manrope", sans-serif';
      ctx.fillText(m.value, pad, h * 0.44);
      ctx.fillStyle = "rgba(243,234,216,0.8)";
      ctx.font = '500 28px "DM Sans", sans-serif';
      ctx.fillText(m.label, pad + 4, h * 0.44 + 44);
    }
    ctx.fillStyle = "#F3EAD8";
    ctx.font = '700 104px "Manrope", sans-serif';
    ctx.fillText(c.title.toUpperCase(), pad, h - pad - 112);
    ctx.fillStyle = "rgba(243,234,216,0.75)";
    ctx.font = '500 26px "Manrope", sans-serif';
    trackedText(ctx, c.subtitle.toUpperCase(), pad, h - pad - 62, 3);
    ctx.fillStyle = "#C99A45";
    ctx.font = '700 26px "Manrope", sans-serif';
    trackedText(ctx, "READ THE STORY  →", pad, h - pad, 5);
  };
}

/** The story in brief: the three beats, big enough to read across the corridor. */
function paintStory(c: WorkCategory, i: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ground(ctx, w, h, i, 0.75);
    const pad = w * 0.07;
    let y = pad + 10;
    for (const [k, v] of [
      ["THE PROBLEM", c.problem],
      ["WHAT WE DID", c.approach],
      ["WHAT CHANGED", c.change],
    ]) {
      ctx.fillStyle = "#C99A45";
      ctx.font = '600 24px "Manrope", sans-serif';
      trackedText(ctx, k, pad, y + 20, 5);
      ctx.fillStyle = "rgba(243,234,216,0.92)";
      ctx.font = '400 38px "DM Sans", sans-serif';
      const lines = wrapLines(ctx, v, w - pad * 2).slice(0, 2);
      lines.forEach((l, n) => ctx.fillText(l, pad, y + 70 + n * 46));
      y += 70 + lines.length * 46 + 34;
    }
    ctx.fillStyle = "#C99A45";
    ctx.font = '700 26px "Manrope", sans-serif';
    trackedText(ctx, `${c.title.toUpperCase()}  ·  READ THE STORY  →`, pad, h - pad, 4);
  };
}

function ScreenOnWall({ s, k, brass }: { s: Screen; k: number; brass: THREE.Material }) {
  const c = work[s.index];
  const tex = useCanvasTexture(s.side === "left" ? paintTitle(c, s.index) : paintStory(c, s.index), 1280, 800, `corridor-${s.key}`);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const halo = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((_, dt) => {
    const on = world.work.hovered === k || world.work.focus === k ? 1 : 0;
    const m = mat.current;
    if (!m) return;
    const v = (m.userData.v ?? 0) + (on - (m.userData.v ?? 0)) * Math.min(1, dt * 6);
    m.userData.v = v;
    m.color.setScalar(1.15 + v * 0.2);
    if (halo.current) halo.current.opacity = 0.18 + v * 0.3;
  });
  const events = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (world.work.hovered !== k) {
        world.work.hovered = k;
        document.body.style.cursor = "pointer";
        workNotify();
      }
    },
    onPointerOut: () => {
      if (world.work.hovered === k) {
        world.work.hovered = -1;
        document.body.style.cursor = "";
        workNotify();
      }
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (world.route !== "work" || world.work.curtain < 0.9) return;
      world.work.focus = k;
      workNotify();
    },
  };
  const { w, h } = SCREEN;
  return (
    <group position={s.at} rotation-y={s.rotY} {...events}>
      <mesh position={[0, 0, -0.03]}>
        <planeGeometry args={[w + 1.4, h + 1.1]} />
        <meshBasicMaterial ref={halo} map={radialTexture()} color={palettes[s.index % palettes.length][0]} transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial ref={mat} map={tex} toneMapped={false} />
      </mesh>
      {[
        [0, h / 2 + 0.03, w + 0.12, 0.06],
        [0, -h / 2 - 0.03, w + 0.12, 0.06],
        [-w / 2 - 0.03, 0, 0.06, h + 0.12],
        [w / 2 + 0.03, 0, 0.06, h + 0.12],
      ].map(([x, y, bw, bh], n) => (
        <mesh key={n} material={brass} position={[x, y, 0.01]}>
          <boxGeometry args={[bw, bh, 0.05]} />
        </mesh>
      ))}
      {/* picture light */}
      <mesh material={brass} position={[0, h / 2 + 0.2, 0.3]}>
        <boxGeometry args={[w * 0.5, 0.05, 0.08]} />
      </mesh>
      <mesh position={[0, h / 2 + 0.175, 0.3]}>
        <boxGeometry args={[w * 0.48, 0.01, 0.05]} />
        <meshBasicMaterial color={[3, 2.5, 1.8]} toneMapped={false} />
      </mesh>
    </group>
  );
}

function EndWall({ p }: { p: Palette }) {
  const font = useLoader(FontLoader, assets.fonts.displayTypeface);
  const geometry = useMemo(() => extrudedText(font, "419M+", { size: 1.2, depth: 0.08, tracking: -0.02, bevel: 0.014 }), [font]);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d9b77e", metalness: 1, roughness: 0.25, envMapIntensity: 1.8 }), []);
  useLayoutEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material]);
  return (
    <group position={[X0, 0, END_WALL + 0.05]}>
      <mesh position={[0, 2.3, 0.01]}>
        <planeGeometry args={[HW * 2, H]} />
        <meshBasicMaterial map={radialTexture()} color="#C99A45" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <Text font={assets.fonts.sans} fontSize={0.12} letterSpacing={0.55} anchorX="center" position={[0, 3.4, 0.05]}>
        AND COUNTING
        <meshBasicMaterial color="#C99A45" toneMapped={false} />
      </Text>
      <mesh geometry={geometry} material={material} position={[0, 1.95, 0.08]} />
      <Text font={assets.fonts.sans} fontSize={0.12} letterSpacing={0.5} anchorX="center" position={[0, 1.55, 0.05]}>
        VIEWS · WITHOUT A RUPEE SPENT ON ADS
        <meshBasicMaterial color="#D9B98A" toneMapped={false} />
      </Text>
      <mesh material={p.brass} position={[0, 0.06, 0.02]}>
        <boxGeometry args={[HW * 2, 0.12, 0.02]} />
      </mesh>
    </group>
  );
}

export function WorkCorridor({ p, stageH }: { p: Palette; stageH: number }) {
  const len = START - END_WALL;
  const mid = START - len / 2;
  const wall = useMemo(() => flutedGeometry(len, H), [len]);
  const endWall = useMemo(() => metricUVs(new THREE.PlaneGeometry(HW * 2, H), 1.6), []);
  const header = useMemo(() => metricUVs(new THREE.PlaneGeometry(HW * 2, stageH - H), 1.6), [stageH]);
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#C99A45", metalness: 1, roughness: 0.35 }), []);
  useLayoutEffect(() => () => brass.dispose(), [brass]);
  const inlays = useMemo(() => {
    const zs: number[] = [];
    for (let z = START - 1.2; z > END_WALL; z -= 2.4) zs.push(z);
    return zs;
  }, []);
  return (
    <group>
      <mesh geometry={wall} material={p.walnut} position={[X0 - HW, H / 2, mid]} rotation-y={Math.PI / 2} receiveShadow />
      <mesh geometry={wall} material={p.walnut} position={[X0 + HW, H / 2, mid]} rotation-y={-Math.PI / 2} receiveShadow />
      <mesh geometry={endWall} material={p.walnut} position={[X0, H / 2, END_WALL]} />
      <mesh geometry={header} material={p.walnut} position={[X0, H + (stageH - H) / 2, START]} />
      <mesh rotation-x={-Math.PI / 2} position={[X0, 0, mid]} material={p.floor} receiveShadow>
        <planeGeometry args={[HW * 2, len]} />
      </mesh>
      {inlays.map((z) => (
        <mesh key={z} material={p.brass} position={[X0, 0.003, z]}>
          <boxGeometry args={[HW * 2, 0.004, 0.025]} />
        </mesh>
      ))}
      <mesh rotation-x={Math.PI / 2} position={[X0, H, mid]} material={p.plaster}>
        <planeGeometry args={[HW * 2, len]} />
      </mesh>
      <mesh material={p.glow} position={[X0, H - 0.02, mid]}>
        <boxGeometry args={[0.06, 0.01, len - 0.4]} />
      </mesh>
      {SCREENS.map((s, k) => <ScreenOnWall key={s.key} s={s} k={k} brass={brass} />)}
      <EndWall p={p} />
      {[0.15, 0.45, 0.75].map((f) => (
        <pointLight key={f} position={[X0, 3.9, START - len * f]} color="#ffd29a" intensity={22} distance={18} decay={2} />
      ))}
    </group>
  );
}
