import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { actions, jbn } from "~/content/site";
import { assets } from "./assets";
import { trackedText, useCanvasTexture } from "./canvasTexture";
import { ArchFrame, ARCH_H, ARCH_W, Doorway } from "./Doorway";
import { LampPendant, Model } from "./Furniture";
import { archShape, flutedGeometry, metricUVs } from "./geometry";
import { cutMaterial, type usePalette } from "./materials";
import { world } from "./world";

type Palette = ReturnType<typeof usePalette>;
type Wall = "minX" | "maxX" | "minZ" | "maxZ";
export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number; h: number };

/* ------------------------------------------------------------------------- */
/*  A room: floor, ceiling, four walls facing in — one with a doorway cut    */
/* ------------------------------------------------------------------------- */

const wallSpec = (b: Bounds, w: Wall) => {
  const cx = (b.minX + b.maxX) / 2;
  const cz = (b.minZ + b.maxZ) / 2;
  switch (w) {
    case "minZ":
      return { len: b.maxX - b.minX, pos: [cx, b.h / 2, b.minZ] as const, rotY: 0, axis: "x" as const };
    case "maxZ":
      return { len: b.maxX - b.minX, pos: [cx, b.h / 2, b.maxZ] as const, rotY: Math.PI, axis: "x" as const };
    case "minX":
      return { len: b.maxZ - b.minZ, pos: [b.minX, b.h / 2, cz] as const, rotY: Math.PI / 2, axis: "z" as const };
    case "maxX":
      return { len: b.maxZ - b.minZ, pos: [b.maxX, b.h / 2, cz] as const, rotY: -Math.PI / 2, axis: "z" as const };
  }
};

export function RoomShell({
  b,
  p,
  door,
  fluted = [],
  open = [],
}: {
  b: Bounds;
  p: Palette;
  door: { wall: Wall; u: number; width?: number; height?: number };
  fluted?: Wall[];
  /** walls to leave out — e.g. where the stage opens onto the corridor */
  open?: Wall[];
}) {
  const dw = door.width ?? ARCH_W;
  const dh = door.height ?? ARCH_H;
  const doorMat = useMemo(() => cutMaterial(p.walnut, [{ axis: wallSpec(b, door.wall).axis, u: door.u, width: dw, height: dh }]), [p.walnut, b, door, dw, dh]);
  useLayoutEffect(() => () => doorMat.dispose(), [doorMat]);

  const walls = useMemo(
    () =>
      (["minX", "maxX", "minZ", "maxZ"] as Wall[]).filter((w) => !open.includes(w)).map((w) => {
        const s = wallSpec(b, w);
        const geometry = fluted.includes(w) ? flutedGeometry(s.len, b.h) : metricUVs(new THREE.PlaneGeometry(s.len, b.h), 1.6);
        return { w, s, geometry };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [b, fluted.join(), open.join()],
  );
  const d = wallSpec(b, door.wall);
  // the doorway frame on this side of the wall
  const framePos: [number, number, number] =
    d.axis === "x" ? [door.u, 0, d.pos[2]] : [d.pos[0], 0, door.u];

  return (
    <group>
      {walls.map(({ w, s, geometry }) => (
        <mesh key={w} geometry={geometry} material={w === door.wall ? doorMat : p.walnut} position={s.pos} rotation-y={s.rotY} receiveShadow />
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[(b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2]} material={p.floor} receiveShadow>
        <planeGeometry args={[b.maxX - b.minX, b.maxZ - b.minZ]} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[(b.minX + b.maxX) / 2, b.h, (b.minZ + b.maxZ) / 2]} material={p.plaster}>
        <planeGeometry args={[b.maxX - b.minX, b.maxZ - b.minZ]} />
      </mesh>
      <group position={framePos} rotation-y={d.rotY}>
        <ArchFrame p={p} width={dw} height={dh} z={0.01} />
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------------- */
/*  01 — The Founder's cabin (and 02, Why TBC Exists, from its window side)   */
/* ------------------------------------------------------------------------- */

const windowFragment = /* glsl */ `
  uniform vec2 uSize;
  varying vec2 vP;
  void main() {
    float y = vP.y / uSize.y;
    // dusk over the city: amber low, deepening to blue-violet
    vec3 low = vec3(1.0, 0.46, 0.17);
    vec3 high = vec3(0.07, 0.065, 0.13);
    vec3 col = mix(low, high, smoothstep(0.0, 0.7, y)) * 0.42;
    // glazing bars
    float bar = step(abs(vP.x), 0.018) + step(abs(vP.y - uSize.y * 0.55), 0.018);
    col = mix(col, vec3(0.05, 0.04, 0.03), clamp(bar, 0.0, 1.0));
    gl_FragColor = vec4(col, 1.0);
  }
`;
const plainVertex = /* glsl */ `
  varying vec2 vP;
  void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

function ArchedWindow({ p, pos, rotY, width = 1.7, height = 2.9 }: { p: Palette; pos: [number, number, number]; rotY: number; width?: number; height?: number }) {
  const geometry = useMemo(() => new THREE.ShapeGeometry(archShape(width, height), 48), [width, height]);
  const uniforms = useMemo(() => ({ uSize: { value: new THREE.Vector2(width, height) } }), [width, height]);
  return (
    <group position={pos} rotation-y={rotY}>
      <mesh geometry={geometry} position-z={0.02}>
        <shaderMaterial uniforms={uniforms} vertexShader={plainVertex} fragmentShader={windowFragment} toneMapped={false} />
      </mesh>
      {/* walnut, not brass: polished metal this close catches a hot glare */}
      <ArchFrame p={p} width={width} height={height} z={0.03} material={p.walnut} />
    </group>
  );
}

const CABIN: Bounds = { minX: 1.9, maxX: 7.5, minZ: -18, maxZ: -8.05, h: 4.2 };

export function FounderCabin({ p }: { p: Palette }) {
  const [deskTarget] = useState(() => new THREE.Object3D());
  return (
    <group>
      <RoomShell b={CABIN} p={p} door={{ wall: "maxZ", u: 4.7 }} fluted={["minZ"]} />
      <ArchedWindow p={p} pos={[CABIN.maxX - 0.01, 0.75, -13.8]} rotY={-Math.PI / 2} />
      {/* writing desk */}
      <group position={[4.7, 0, -15.9]}>
        {[-1, 1].map((s) => (
          <mesh key={s} material={p.walnut} position={[s * 1.02, 0.37, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.5, 0.74, 0.8]} />
          </mesh>
        ))}
        <mesh material={p.stone} position={[0, 0.765, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.6, 0.05, 0.9]} />
        </mesh>
        <mesh material={p.brass} position={[0, 0.735, 0.452]}>
          <boxGeometry args={[2.6, 0.012, 0.012]} />
        </mesh>
        <Model url={assets.furniture.books} position={[-1.1, 0.79, -0.2]} scale={0.8} />
        <Model url={assets.furniture.brassVase} position={[0.95, 0.79, -0.15]} scale={0.7} />
      </group>
      <Model url={assets.furniture.armchairModern} position={[4.7, 0, -16.85]} rotation-y={Math.PI} />
      <Model url={assets.furniture.armchairClassic} position={[2.8, 0, -11.6]} rotation-y={Math.PI - 0.6} />
      <Model url={assets.furniture.plant} position={[7.0, 0, -17.3]} />
      <LampPendant x={4.7} z={-15.7} delay={0} p={p} ceiling={CABIN.h} hang={2.2} intensity={9} />
      {/* evening light through the window, across the desk */}
      <primitive object={deskTarget} position={[4.7, 0.8, -15.6]} />
      <spotLight target={deskTarget} position={[5.8, 3.7, -12.4]} angle={0.75} penumbra={1} intensity={35} distance={9} decay={2} color="#ffb47a" />
    </group>
  );
}

/* ------------------------------------------------------------------------- */
/*  03 — The Strategy Library                                                 */
/* ------------------------------------------------------------------------- */

const LIBRARY: Bounds = { minX: -15, maxX: -7.05, minZ: -7.9, maxZ: -1.9, h: 4.6 };
const SHELF_YS = [0.32, 0.9, 1.48, 2.06, 2.64, 3.22, 3.8];

/** Shelf runs along three walls, filled with ~3,000 books in one instanced draw. */
function Bookshelves({ p }: { p: Palette }) {
  const runs = useMemo(
    () => [
      // [start, end, fixed, axis, facing]
      { from: [-14.95, -7.6], to: [-14.95, -2.2], along: "z" as const, inward: 1 },
      { from: [-14.6, -7.85], to: [-7.6, -7.85], along: "x" as const, inward: 1 },
      { from: [-14.6, -1.95], to: [-7.6, -1.95], along: "x" as const, inward: -1 },
    ],
    [],
  );

  const books = useMemo(() => {
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ roughness: 0.7, envMapIntensity: 0.6 }),
      4000,
    );
    const leather = ["#3b1d14", "#4d2a18", "#2a1c14", "#5b3b22", "#1f2a26", "#3a2f22", "#6b4a2a", "#24201c", "#5a1f18"].map((c) => new THREE.Color(c));
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    let i = 0;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const r of runs) {
      const len = r.along === "z" ? r.to[1] - r.from[1] : r.to[0] - r.from[0];
      for (const y of SHELF_YS) {
        let t = 0.05;
        while (t < len - 0.05 && i < 4000) {
          const thick = 0.022 + rnd() * 0.03;
          const tall = 0.2 + rnd() * 0.12;
          const deep = 0.15 + rnd() * 0.05;
          if (rnd() < 0.06) {
            t += 0.08 + rnd() * 0.15; // a gap now and then
            continue;
          }
          const lean = rnd() < 0.08 ? (rnd() - 0.5) * 0.3 : 0;
          const c = r.along === "z" ? [r.from[0] + r.inward * (deep / 2 + 0.03), r.from[1] + t] : [r.from[0] + t, r.from[1] + r.inward * (deep / 2 + 0.03)];
          const pos = new THREE.Vector3(c[0], y + 0.02 + tall / 2, c[1]);
          const scale = r.along === "z" ? new THREE.Vector3(deep, tall, thick) : new THREE.Vector3(thick, tall, deep);
          e.set(r.along === "z" ? lean : 0, 0, r.along === "x" ? lean : 0);
          q.setFromEuler(e);
          m.compose(pos, q, scale);
          mesh.setMatrixAt(i, m);
          mesh.setColorAt(i, leather[Math.floor(rnd() * leather.length)].clone().multiplyScalar(0.8 + rnd() * 0.5));
          i++;
          t += thick + 0.002;
        }
      }
    }
    mesh.count = i;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    return mesh;
  }, [runs]);
  useLayoutEffect(() => () => (books.geometry.dispose(), (books.material as THREE.Material).dispose()), [books]);

  return (
    <group>
      <primitive object={books} />
      {runs.map((r, k) =>
        SHELF_YS.map((y) => {
          const len = r.along === "z" ? r.to[1] - r.from[1] : r.to[0] - r.from[0];
          const mid: [number, number, number] =
            r.along === "z" ? [r.from[0] + r.inward * 0.16, y, (r.from[1] + r.to[1]) / 2] : [(r.from[0] + r.to[0]) / 2, y, r.from[1] + r.inward * 0.16];
          return (
            <mesh key={`${k}-${y}`} material={p.walnut} position={mid} receiveShadow>
              <boxGeometry args={r.along === "z" ? [0.32, 0.035, len] : [len, 0.035, 0.32]} />
            </mesh>
          );
        }),
      )}
    </group>
  );
}

/** The six disciplines, as backlit panels floating in the middle of the library. */
function FloatingPanels() {
  const group = useRef<THREE.Group>(null);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#d9cbb0", emissive: new THREE.Color("#f6e6c3"), emissiveIntensity: 0.05, roughness: 0.75 }),
    [],
  );
  useLayoutEffect(() => () => mat.dispose(), [mat]);
  useFrame(({ clock }) => {
    group.current?.children.forEach((c, i) => {
      c.position.y = 2.15 + Math.sin(clock.elapsedTime * 0.45 + i * 1.3) * 0.05;
    });
  });
  return (
    <group ref={group}>
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i - 2.5) * 0.22;
        const x = -12.4 - Math.cos(a) * 0.8;
        const z = -4.9 - Math.sin(a) * 3.6; // facing the camera, 01 reads first on the left
        return (
          <group key={i} position={[x, 2.15, z]} rotation-y={Math.PI / 2 + a * 0.9}>
            <mesh material={mat} castShadow>
              <boxGeometry args={[0.5, 1.4, 0.025]} />
            </mesh>
            <Text font={assets.fonts.display} fontSize={0.16} anchorX="center" position={[0, 0.48, 0.016]}>
              {`0${i + 1}`}
              <meshBasicMaterial color="#8f6c3e" />
            </Text>
          </group>
        );
      })}
    </group>
  );
}

export function Library({ p }: { p: Palette }) {
  return (
    <group>
      <RoomShell b={LIBRARY} p={p} door={{ wall: "maxX", u: -5.4 }} />
      <Bookshelves p={p} />
      <FloatingPanels />
      <pointLight position={[-10.4, 3.9, -4.9]} color="#ffd9a8" intensity={22} distance={13} decay={2} />
    </group>
  );
}

/* ------------------------------------------------------------------------- */
/*  05 — The JBN room: a screening room with one big screen                   */
/* ------------------------------------------------------------------------- */

const JBN: Bounds = { minX: 7.05, maxX: 15, minZ: -7.9, maxZ: -1.9, h: 4.6 };

function JbnScreen() {
  const texture = useCanvasTexture((ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.35, w * 0.65);
    g.addColorStop(0, "#2c2117");
    g.addColorStop(1, "#090706");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#c9a46a";
    ctx.font = '600 22px "Manrope", sans-serif';
    trackedText(ctx, jbn.title.toUpperCase(), w / 2, h * 0.27, 9, "center");
    ctx.fillStyle = "#f4ede1";
    ctx.textAlign = "center";
    ctx.font = '300 78px "Cormorant Garamond", serif';
    ctx.fillText("20-MIN SOCIAL", w / 2, h * 0.47);
    ctx.fillText("MEDIA AUDIT", w / 2, h * 0.61);
    ctx.fillStyle = "#a79d8f";
    ctx.font = 'italic 400 34px "Cormorant Garamond", serif';
    ctx.fillText(`For the first ${jbn.total} members`, w / 2, h * 0.75);
    // scanlines
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  });

  const panel = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef<THREE.PointLight>(null);
  const state = useRef({ on: false, t0: 0 });

  useFrame(() => {
    const s = state.current;
    const here = world.route === "jbn" && !world.travel;
    if (here && !s.on) {
      s.on = true;
      s.t0 = performance.now();
    } else if (world.route !== "jbn") s.on = false;
    // CRT power-on: a bright line opens into the picture
    const t = s.on ? Math.min(1, (performance.now() - s.t0) / 900) : 0;
    const open = t < 0.25 ? 0.02 : 0.02 + 0.98 * (1 - Math.pow(1 - (t - 0.25) / 0.75, 3));
    if (panel.current) panel.current.scale.y = open;
    if (mat.current) mat.current.color.setScalar(t < 0.25 ? 2.5 * (t / 0.25) : 1 + 1.4 * (1 - t));
    if (glow.current) glow.current.intensity = 10 * t;
  });

  return (
    <group position={[JBN.maxX - 0.03, 2.3, -4.9]} rotation-y={-Math.PI / 2}>
      <mesh ref={panel}>
        <planeGeometry args={[5, 2.8]} />
        <meshBasicMaterial ref={mat} map={texture} toneMapped={false} />
      </mesh>
      {/* bezel */}
      {[
        [0, 1.44, 5.16, 0.08],
        [0, -1.44, 5.16, 0.08],
        [-2.54, 0, 0.08, 2.96],
        [2.54, 0, 0.08, 2.96],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.01]}>
          <boxGeometry args={[w, h, 0.04]} />
          <meshStandardMaterial color="#c9a46a" metalness={1} roughness={0.35} />
        </mesh>
      ))}
      <pointLight ref={glow} position={[0, 0, 1.4]} color="#ffd9a8" intensity={0} distance={7} decay={2} />
    </group>
  );
}

export function JbnRoom({ p }: { p: Palette }) {
  return (
    <group>
      <RoomShell b={JBN} p={p} door={{ wall: "minX", u: -5.4 }} fluted={["minZ", "maxZ"]} />
      <JbnScreen />
      <Model url={assets.furniture.armchairClassic} position={[11.6, 0, -6.2]} rotation-y={Math.PI / 2 + 0.15} />
      <Model url={assets.furniture.armchairClassic} position={[11.6, 0, -3.6]} rotation-y={Math.PI / 2 - 0.15} />
      <pointLight position={[10.2, 3.9, -4.9]} color="#ffd29a" intensity={9} distance={10} decay={2} />
    </group>
  );
}

/* ------------------------------------------------------------------------- */
/*  06 — The Action Room: three lit doorways, through the lobby's entrance    */
/* ------------------------------------------------------------------------- */

const ACTION: Bounds = { minX: -6, maxX: 6, minZ: 12.05, maxZ: 20, h: 5.2 };
const actionTints = ["#ead6ad", "#f2c98a", "#d9694a"];

export function ActionRoomScene({ p }: { p: Palette }) {
  return (
    <group>
      <RoomShell b={ACTION} p={p} door={{ wall: "minZ", u: 0, width: 3.2, height: 4.4 }} fluted={["maxZ"]} />
      {actions.map((a, i) => (
        <Doorway
          key={a.title}
          p={p}
          pos={[-(i - 1) * 3.1, 0, ACTION.maxZ - 0.06]} // facing +z, so -x is on the right
          normal={[0, 0, -1]}
          tint={actionTints[i]}
          label="" // the page itself names the three doors
          passable={false}
        />
      ))}
      <pointLight position={[0, 4.2, 16]} color="#ffd9a8" intensity={20} distance={12} decay={2} />
    </group>
  );
}
