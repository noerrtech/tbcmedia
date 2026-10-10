import { Text } from "@react-three/drei";
import { useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { work, type WorkCategory } from "~/content/site";
import { END_WALL, H, HW, SCREEN, SCREENS, START, X0, type Screen } from "~/lib/corridor";
import { assets } from "./assets";
import { Beam } from "./Beam";
import { trackedText, useCanvasTexture } from "./canvasTexture";
import { extrudedText, flutedGeometry, metricUVs, radialTexture } from "./geometry";
import type { usePalette } from "./materials";
import { world, workNotify, type V3 } from "./world";

/**
 * The corridor behind the Work room's curtain: fluted walnut, a light along the ceiling, the case
 * studies on portrait displays down both walls, each under its own spot — title cards on the left,
 * each story in brief on the right — and 419M+ on the end wall. Hover a screen and it lifts; click it and the camera goes over to read it while
 * the page opens the full story (corridorCamera, CorridorRoom).
 */

type Palette = ReturnType<typeof usePalette>;

/** Each story's accent: a faint tint at the top of its display and the light it throws on the wall. */
const accents = ["#8a5a2b", "#7a3440", "#2f4d66", "#8a6d32", "#5a3f73"];

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

const two = (n: number) => String(n).padStart(2, "0");

/** A lit display: near-black glass, the story's accent glowing in from the top, a status line. */
function panel(ctx: CanvasRenderingContext2D, w: number, h: number, i: number, label: string) {
  ctx.fillStyle = "#070606";
  ctx.fillRect(0, 0, w, h);
  const tint = ctx.createRadialGradient(w * 0.7, -h * 0.05, 0, w * 0.7, -h * 0.05, h * 0.75);
  tint.addColorStop(0, accents[i % accents.length]);
  tint.addColorStop(1, "rgba(7,6,6,0)");
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
  const pad = w * 0.08;
  // status line: a live dot, which story, of how many
  ctx.fillStyle = "#E8C887";
  ctx.beginPath();
  ctx.arc(pad + 7, pad + 14, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '600 22px "Manrope", sans-serif';
  trackedText(ctx, label, pad + 28, pad + 22, 5);
  ctx.fillStyle = "rgba(243,234,216,0.45)";
  ctx.textAlign = "right";
  ctx.fillText(`${two(i + 1)} / ${two(work.length)}`, w - pad, pad + 22);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(243,234,216,0.14)";
  ctx.fillRect(pad, pad + 52, w - pad * 2, 2);
  return pad;
}

/** The call to action along the foot of a display. */
function cta(ctx: CanvasRenderingContext2D, w: number, h: number, pad: number, text: string) {
  const y = h - pad - 76;
  ctx.strokeStyle = "rgba(201,154,69,0.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(pad, y, w - pad * 2, 76);
  ctx.fillStyle = "#E8C887";
  ctx.font = '700 24px "Manrope", sans-serif';
  trackedText(ctx, text, w / 2, y + 46, 5, "center");
}

/** The title card: which story, what kind of problem, the result where there is one. */
function paintTitle(c: WorkCategory, i: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const pad = panel(ctx, w, h, i, "CASE STUDY");
    ctx.fillStyle = "rgba(243,234,216,0.05)";
    ctx.font = '800 560px "Manrope", sans-serif';
    ctx.textAlign = "right";
    ctx.fillText(two(i + 1), w + 20, h * 0.5);
    ctx.textAlign = "left";
    const m = c.metrics?.[0];
    if (m) {
      ctx.fillStyle = "#E8C887";
      ctx.font = '800 150px "Manrope", sans-serif';
      ctx.fillText(m.value, pad - 6, h * 0.36);
      ctx.fillStyle = "rgba(243,234,216,0.8)";
      ctx.font = '500 30px "DM Sans", sans-serif';
      wrapLines(ctx, m.label, w - pad * 2).slice(0, 2).forEach((l, n) => ctx.fillText(l, pad, h * 0.36 + 56 + n * 38));
    }
    ctx.fillStyle = "#F3EAD8";
    ctx.font = '700 92px "Manrope", sans-serif';
    const title = wrapLines(ctx, c.title.toUpperCase(), w - pad * 2).slice(0, 3);
    const top = h - pad - 76 - 80 - 52 - title.length * 96;
    title.forEach((l, n) => ctx.fillText(l, pad, top + 80 + n * 96));
    ctx.fillStyle = "rgba(243,234,216,0.7)";
    const sub = c.subtitle.toUpperCase();
    let size = 24;
    for (; size > 16; size--) {
      ctx.font = `500 ${size}px "Manrope", sans-serif`;
      if (ctx.measureText(sub).width + sub.length * 3 <= w - pad * 2) break;
    }
    trackedText(ctx, sub, pad, h - pad - 76 - 60, 3);
    cta(ctx, w, h, pad, "READ THE STORY  →");
  };
}

/** The story in brief: the three beats, stacked, big enough to read across the corridor. */
function paintStory(c: WorkCategory, i: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const pad = panel(ctx, w, h, i, c.title.toUpperCase());
    let y = pad + 120;
    [
      ["THE PROBLEM", c.problem],
      ["WHAT WE DID", c.approach],
      ["WHAT CHANGED", c.change],
    ].forEach(([k, v], n) => {
      ctx.fillStyle = "#C99A45";
      ctx.font = '700 22px "Manrope", sans-serif';
      ctx.fillText(two(n + 1), pad, y);
      ctx.fillStyle = "#E8C887";
      ctx.font = '600 22px "Manrope", sans-serif';
      trackedText(ctx, k, pad + 56, y, 5);
      ctx.fillStyle = n === 2 ? "#F3EAD8" : "rgba(243,234,216,0.88)";
      ctx.font = `${n === 2 ? 500 : 400} 40px "DM Sans", sans-serif`;
      const lines = wrapLines(ctx, v, w - pad * 2 - 56).slice(0, 4);
      lines.forEach((l, m) => ctx.fillText(l, pad + 56, y + 62 + m * 52));
      // a hairline down the side, gold for what changed
      ctx.fillStyle = n === 2 ? "#C99A45" : "rgba(243,234,216,0.18)";
      ctx.fillRect(pad + 10, y + 22, 2, lines.length * 52 + 8);
      y += 62 + lines.length * 52 + 70;
    });
    cta(ctx, w, h, pad, "READ THE FULL STORY  →");
  };
}

/** A soft diagonal reflection across the glass. */
function paintGlass(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w, h * 0.6);
  g.addColorStop(0, "rgba(255,255,255,0.10)");
  g.addColorStop(0.35, "rgba(255,255,255,0.03)");
  g.addColorStop(0.36, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

const CANVAS = { w: 820, h: Math.round((820 * SCREEN.h) / SCREEN.w) };
const BEZEL = 0.05;
// the spot in the ceiling, out from the wall, throwing its light down over the display to the floor
const SPOT: V3 = [0, H - SCREEN.y - 0.08, 1];
const SPOT_TO: V3 = [0, -SCREEN.y, 0.25];

function ScreenOnWall({ s, k, bezel, can }: { s: Screen; k: number; bezel: THREE.Material; can: THREE.Material }) {
  const c = work[s.index];
  const tex = useCanvasTexture(s.side === "left" ? paintTitle(c, s.index) : paintStory(c, s.index), CANVAS.w, CANVAS.h, `corridor-${s.key}`);
  const glass = useCanvasTexture(paintGlass, 256, 420, "corridor-glass");
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const wash = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((_, dt) => {
    const on = world.work.hovered === k || world.work.focus === k ? 1 : 0;
    const m = mat.current;
    if (!m) return;
    const v = (m.userData.v ?? 0) + (on - (m.userData.v ?? 0)) * Math.min(1, dt * 6);
    m.userData.v = v;
    m.color.setScalar(1.1 + v * 0.25);
    if (wash.current) wash.current.opacity = 0.3 + v * 0.25;
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
    <group position={s.at} rotation-y={s.rotY}>
      {/* the spot's light on the wall: brightest above, where it lands, spilling past the display */}
      <mesh position={[0, 0.35, -0.06]}>
        <planeGeometry args={[w + 1.6, h + 1.6]} />
        <meshBasicMaterial ref={wash} map={radialTexture()} color="#ffcf94" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* and a faint backlight in the story's colour */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[w + 0.7, h + 0.7]} />
        <meshBasicMaterial map={radialTexture()} color={accents[s.index % accents.length]} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <group {...events}>
        {/* the slim black body */}
        <mesh material={bezel} position={[0, 0, -0.03]}>
          <boxGeometry args={[w + BEZEL * 2, h + BEZEL * 2, 0.05]} />
        </mesh>
        <mesh>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial ref={mat} map={tex} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.002]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={glass} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      {/* the spot: a can in the ceiling, its lit lens, the shaft of light, the pool on the floor */}
      <mesh material={can} position={[SPOT[0], SPOT[1] + 0.02, SPOT[2]]}>
        <cylinderGeometry args={[0.11, 0.09, 0.12, 24]} />
      </mesh>
      <mesh position={[SPOT[0], SPOT[1] - 0.045, SPOT[2]]} rotation-x={Math.PI / 2}>
        <circleGeometry args={[0.075, 24]} />
        <meshBasicMaterial color={[4, 3.3, 2.4]} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <Beam from={SPOT} to={SPOT_TO} radius={1.15} opacity={0.06} />
      <mesh position={[0, -SCREEN.y + 0.006, 0.55]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[2.4, 1.7]} />
        <meshBasicMaterial map={radialTexture()} color="#ffcf94" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
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
  // the displays' black bodies, and the spot cans above them
  const bezel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0b0b0c", metalness: 0.6, roughness: 0.3 }), []);
  const can = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1a1714", metalness: 0.8, roughness: 0.4 }), []);
  useLayoutEffect(() => () => (bezel.dispose(), can.dispose()), [bezel, can]);
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
      {/* two light lines along the ceiling, off to the sides — the middle stays clear for the words */}
      {[-1.5, 1.5].map((dx) => (
        <mesh key={dx} material={p.glow} position={[X0 + dx, H - 0.02, mid]}>
          <boxGeometry args={[0.05, 0.01, len - 0.4]} />
        </mesh>
      ))}
      {SCREENS.map((s, k) => <ScreenOnWall key={s.key} s={s} k={k} bezel={bezel} can={can} />)}
      <EndWall p={p} />
      {[0.15, 0.45, 0.75].map((f) => (
        <pointLight key={f} position={[X0, 3.9, START - len * f]} color="#ffd29a" intensity={22} distance={18} decay={2} />
      ))}
    </group>
  );
}
