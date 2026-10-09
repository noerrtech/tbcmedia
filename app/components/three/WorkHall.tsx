import { Text } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { work, type WorkCategory } from "~/content/site";
import { assets } from "./assets";
import { trackedText, useCanvasTexture } from "./canvasTexture";
import { extrudedText, flutedGeometry, metricUVs, radialTexture } from "./geometry";
import { velvetMaterial, type usePalette } from "./materials";
import { RoomShell, type Bounds } from "./Rooms";
import { workHall, world } from "./world";

type Palette = ReturnType<typeof usePalette>;

const X = workHall.x;
const HW = workHall.halfWidth;
const STAGE: Bounds = { minX: X - HW, maxX: X + HW, minZ: workHall.start, maxZ: -8.05, h: 5.6 };
const CORRIDOR_H = 4.6;
const LEN = workHall.length(work.length);
const END = workHall.start - LEN;

const smooth = (a: number, b: number, v: number) => THREE.MathUtils.smoothstep(v, a, b);

/** How far the curtain is open (0 closed … 1 gathered at the sides), from the page scroll. */
export const curtainOpen = () => smooth(0.06, 0.72, world.work.curtain);

/* ------------------------------------------------------------------------- */
/*  The curtain                                                              */
/* ------------------------------------------------------------------------- */

/**
 * One half of a velvet stage curtain. The folds, the gathering toward the side and the
 * hem lifting as it opens all happen in the vertex shader, with matching normals so the
 * sheen runs down every fold.
 */
function CurtainHalf({ side, width, height }: { side: -1 | 1; width: number; height: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, height, 160, 28);
    g.translate(width / 2, height / 2, 0); // x: 0 at the outer edge … width at the centre
    return g;
  }, [width, height]);

  const material = useMemo(() => {
    const m = velvetMaterial();
    const uniforms = { uOpen: { value: 0 }, uTime: { value: 0 }, uWidth: { value: width }, uHeight: { value: height } };
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform float uOpen, uTime, uWidth, uHeight;
          float cFolds(float x) { return 6.2831853 * 11.0 / uWidth * x; }
          float cAmp(float g) { return mix(0.055, 0.15, uOpen) * (0.75 + 0.25 * g); }`,
        )
        .replace(
          "#include <beginnormal_vertex>",
          `float g = position.x / uWidth;            // 0 outer edge … 1 centre
          float yN = position.y / uHeight;          // 0 hem … 1 top
          float ph = cFolds(position.x);
          float amp = cAmp(g);
          float squash = mix(1.0, 0.2, uOpen);
          float sway = sin(uTime * 0.7 + ph * 0.25) * 0.012 * (1.0 - yN);
          float dz = cos(ph) * amp * cFolds(1.0) + cos(ph * 2.3 + 1.7) * amp * 0.25 * cFolds(2.3);
          vec3 objectNormal = normalize(vec3(-dz / squash, 0.0, 1.0));
          #ifdef USE_TANGENT
          vec3 objectTangent = vec3(1.0, 0.0, 0.0);
          #endif`,
        )
        .replace(
          "#include <begin_vertex>",
          `vec3 transformed = position;
          transformed.x = position.x * squash;
          transformed.z = sin(ph) * amp + sin(ph * 2.3 + 1.7) * amp * 0.25 + sway;
          // tie-back: the inner hem lifts and swings out as it opens
          float lift = uOpen * g * g * (1.0 - yN) * (1.0 - yN);
          transformed.y += lift * 1.1;
          transformed.x -= lift * 0.6;`,
        );
      m.userData.uniforms = uniforms;
    };
    m.customProgramCacheKey = () => "curtain";
    return m;
  }, [width, height]);
  useLayoutEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material]);

  useFrame(({ clock }) => {
    const u = material.userData.uniforms;
    if (!u) return;
    u.uOpen.value = curtainOpen();
    u.uTime.value = clock.elapsedTime;
  });

  // left half hangs from the left jamb; the right half is its mirror image
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[side < 0 ? X - HW : X + HW, 0, workHall.curtainZ]}
      scale={[side < 0 ? 1 : -1, 1, 1]}
      receiveShadow
    />
  );
}

/** "419M+" in brass hanging before the curtain; it rises into the fly loft as the curtain opens. */
function BrassFigure() {
  const font = useLoader(FontLoader, assets.fonts.displayTypeface);
  const geometry = useMemo(() => extrudedText(font, "419M+", { size: 0.62, depth: 0.06, tracking: -0.02, bevel: 0.01 }), [font]);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d9b77e", metalness: 1, roughness: 0.25, envMapIntensity: 1.8 }), []);
  useLayoutEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material]);
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.position.y = smooth(0.0, 0.55, world.work.curtain) * 4.2;
  });
  return (
    <group ref={group}>
      <group position={[X, 0, workHall.curtainZ + 0.45]}>
        <mesh geometry={geometry} material={material} position-y={2.42} />
        <Text font={assets.fonts.sans} fontSize={0.075} letterSpacing={0.55} anchorX="center" position={[0, 2.22, 0.05]}>
          ORGANIC VIEWS
          <meshBasicMaterial color="#ead6ad" toneMapped={false} />
        </Text>
      </group>
    </group>
  );
}

function Stage({ p }: { p: Palette }) {
  const [target] = useState(() => new THREE.Object3D());
  const pelmet = useMemo(() => velvetMaterial(), []);
  useLayoutEffect(() => () => pelmet.dispose(), [pelmet]);
  return (
    <group>
      <RoomShell b={STAGE} p={p} door={{ wall: "maxZ", u: X }} open={["minZ"]} />
      <CurtainHalf side={-1} width={HW + 0.08} height={5.25} />
      <CurtainHalf side={1} width={HW + 0.08} height={5.25} />
      {/* pelmet with a brass fringe line */}
      <mesh material={pelmet} position={[X, 5.35, workHall.curtainZ + 0.12]}>
        <boxGeometry args={[HW * 2, 0.5, 0.2]} />
      </mesh>
      <mesh material={p.brass} position={[X, 5.1, workHall.curtainZ + 0.23]}>
        <boxGeometry args={[HW * 2, 0.025, 0.02]} />
      </mesh>
      {/* footlights */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} material={p.glow} position={[X - HW + 0.4 + (i * (HW * 2 - 0.8)) / 8, 0.04, workHall.curtainZ + 0.5]}>
          <sphereGeometry args={[0.035, 12, 8]} />
        </mesh>
      ))}
      <BrassFigure />
      <primitive object={target} position={[X, 2.4, workHall.curtainZ]} />
      <spotLight target={target} position={[X, 5.4, -9.0]} angle={0.62} penumbra={0.9} intensity={95} distance={12} decay={2} color="#ffcf9a" />
    </group>
  );
}

/* ------------------------------------------------------------------------- */
/*  The corridor                                                             */
/* ------------------------------------------------------------------------- */

const palettes = [
  ["#6b4a2b", "#23170f", "#0b0806"],
  ["#4b2a2f", "#1c1012", "#090606"],
  ["#34404a", "#151a1f", "#070809"],
  ["#6a5532", "#241c10", "#0a0805"],
  ["#3d4a37", "#161b14", "#070806"],
];

/** A lit screen: the title card on the left wall, the client's words on the right. */
function Screen({ c, i, variant, pos, rotY }: { c: WorkCategory; i: number; variant: "title" | "detail"; pos: [number, number, number]; rotY: number }) {
  const texture = useCanvasTexture(
    (ctx, w, h) => {
      const [a, b, d] = palettes[i % palettes.length];
      const g = ctx.createRadialGradient(w * (variant === "title" ? 0.3 : 0.7), h * 0.25, 0, w * 0.5, h * 0.5, w * 0.8);
      g.addColorStop(0, a);
      g.addColorStop(0.55, b);
      g.addColorStop(1, d);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const shade = ctx.createLinearGradient(0, h * 0.4, 0, h);
      shade.addColorStop(0, "rgba(0,0,0,0)");
      shade.addColorStop(1, "rgba(0,0,0,0.7)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, w, h);
      const pad = w * 0.06;
      if (variant === "title") {
        ctx.fillStyle = "#c9a46a";
        ctx.font = '600 20px "Manrope", sans-serif';
        trackedText(ctx, `NO. 0${i + 1}`, pad, h - pad - 150, 6);
        ctx.fillStyle = "#f4ede1";
        ctx.font = '300 96px "Cormorant Garamond", serif';
        ctx.fillText(c.title.toUpperCase(), pad, h - pad - 52);
        ctx.fillStyle = "rgba(244,237,225,0.7)";
        ctx.font = '500 20px "Manrope", sans-serif';
        trackedText(ctx, c.subtitle.toUpperCase(), pad, h - pad, 3.5);
      } else {
        ctx.fillStyle = "rgba(244,237,225,0.92)";
        ctx.font = 'italic 400 46px "Cormorant Garamond", serif';
        // wrap the line
        const words = `“${c.body}”`.split(" ");
        const lines: string[] = [];
        let line = "";
        for (const wd of words) {
          const t = line ? `${line} ${wd}` : wd;
          if (ctx.measureText(t).width > w - pad * 2) {
            lines.push(line);
            line = wd;
          } else line = t;
        }
        lines.push(line);
        const y0 = h - pad - 60 - (lines.length - 1) * 54;
        lines.forEach((l, k) => ctx.fillText(l, pad, y0 + k * 54));
        ctx.fillStyle = "#c9a46a";
        ctx.font = '600 20px "Manrope", sans-serif';
        trackedText(ctx, (c.items[0]?.client ?? "").toUpperCase(), pad, h - pad, 6);
      }
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
    },
    1024,
    640,
    `${c.id}-${variant}`,
  );

  return (
    <group position={pos} rotation-y={rotY}>
      <mesh>
        <planeGeometry args={[3.2, 2]} />
        {/* a lit display, not a print: lifted above 1 so it glows a little */}
        <meshBasicMaterial map={texture} color={[1.7, 1.7, 1.7]} toneMapped={false} />
      </mesh>
      {[
        [0, 1.03, 3.32, 0.06],
        [0, -1.03, 3.32, 0.06],
        [-1.63, 0, 0.06, 2.12],
        [1.63, 0, 0.06, 2.12],
      ].map(([x, y, w, h], k) => (
        <mesh key={k} position={[x, y, 0.01]}>
          <boxGeometry args={[w, h, 0.04]} />
          <meshStandardMaterial color="#c9a46a" metalness={1} roughness={0.35} />
        </mesh>
      ))}
      {/* the screen's light on the floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -2.17, 1.2]}>
        <planeGeometry args={[3.6, 2.4]} />
        <meshBasicMaterial map={radialTexture()} color={palettes[i % palettes.length][0]} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function EndWall({ p }: { p: Palette }) {
  const font = useLoader(FontLoader, assets.fonts.displayTypeface);
  const geometry = useMemo(() => extrudedText(font, "419M+", { size: 1.25, depth: 0.08, tracking: -0.02, bevel: 0.014 }), [font]);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d9b77e", metalness: 1, roughness: 0.25, envMapIntensity: 1.8 }), []);
  useLayoutEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material]);
  return (
    <group position={[X, 0, END + 0.05]}>
      <mesh position={[0, 2.3, 0.01]}>
        <planeGeometry args={[HW * 2, CORRIDOR_H]} />
        <meshBasicMaterial map={radialTexture()} color="#c9a46a" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <Text font={assets.fonts.sans} fontSize={0.12} letterSpacing={0.55} anchorX="center" position={[0, 3.45, 0.05]}>
        AND COUNTING
        <meshBasicMaterial color="#c9a46a" toneMapped={false} />
      </Text>
      <mesh geometry={geometry} material={material} position={[0, 2.0, 0.08]} />
      <Text font={assets.fonts.sans} fontSize={0.13} letterSpacing={0.55} anchorX="center" position={[0, 1.55, 0.05]}>
        ORGANIC VIEWS
        <meshBasicMaterial color="#ead6ad" toneMapped={false} />
      </Text>
      <mesh material={p.brass} position={[0, 0.06, 0.02]}>
        <boxGeometry args={[HW * 2, 0.12, 0.02]} />
      </mesh>
    </group>
  );
}

function Corridor({ p }: { p: Palette }) {
  const wall = useMemo(() => flutedGeometry(LEN, CORRIDOR_H), []);
  const endWall = useMemo(() => metricUVs(new THREE.PlaneGeometry(HW * 2, CORRIDOR_H), 1.6), []);
  const header = useMemo(() => metricUVs(new THREE.PlaneGeometry(HW * 2, STAGE.h - CORRIDOR_H), 1.6), []);
  const midZ = workHall.start - LEN / 2;
  const inlays = useMemo(() => {
    const zs: number[] = [];
    for (let z = workHall.start - 1.2; z > END; z -= 2.4) zs.push(z);
    return zs;
  }, []);

  return (
    <group>
      {/* fluted walnut walls, both sides */}
      <mesh geometry={wall} material={p.walnut} position={[X - HW, CORRIDOR_H / 2, midZ]} rotation-y={Math.PI / 2} receiveShadow />
      <mesh geometry={wall} material={p.walnut} position={[X + HW, CORRIDOR_H / 2, midZ]} rotation-y={-Math.PI / 2} receiveShadow />
      <mesh geometry={endWall} material={p.walnut} position={[X, CORRIDOR_H / 2, END]} />
      {/* proscenium header between the tall stage and the corridor */}
      <mesh geometry={header} material={p.walnut} position={[X, CORRIDOR_H + (STAGE.h - CORRIDOR_H) / 2, workHall.start]} />
      {/* polished floor with brass inlays */}
      <mesh rotation-x={-Math.PI / 2} position={[X, 0, midZ]} material={p.floor} receiveShadow>
        <planeGeometry args={[HW * 2, LEN]} />
      </mesh>
      {inlays.map((z) => (
        <mesh key={z} material={p.brass} position={[X, 0.003, z]}>
          <boxGeometry args={[HW * 2, 0.004, 0.025]} />
        </mesh>
      ))}
      {/* ceiling with a light strip down the middle */}
      <mesh rotation-x={Math.PI / 2} position={[X, CORRIDOR_H, midZ]} material={p.plaster}>
        <planeGeometry args={[HW * 2, LEN]} />
      </mesh>
      <mesh material={p.glow} position={[X, CORRIDOR_H - 0.02, midZ]}>
        <boxGeometry args={[0.06, 0.01, LEN - 0.4]} />
      </mesh>
      {work.map((c, i) => {
        const z = workHall.screenZ(i);
        return (
          <group key={c.id}>
            <Screen c={c} i={i} variant="title" pos={[X - HW + 0.03, 2.2, z]} rotY={Math.PI / 2} />
            <Screen c={c} i={i} variant="detail" pos={[X + HW - 0.03, 2.2, z - workHall.gap / 2]} rotY={-Math.PI / 2} />
          </group>
        );
      })}
      <EndWall p={p} />
      <pointLight position={[X, 3.9, workHall.start - LEN * 0.3]} color="#ffd29a" intensity={22} distance={18} decay={2} />
      <pointLight position={[X, 3.9, workHall.start - LEN * 0.78]} color="#ffd29a" intensity={22} distance={18} decay={2} />
    </group>
  );
}

export function WorkHall({ p }: { p: Palette }) {
  return (
    <group>
      <Stage p={p} />
      <Corridor p={p} />
    </group>
  );
}
