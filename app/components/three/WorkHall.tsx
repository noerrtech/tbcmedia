import { Sparkles, Text, useGLTF } from "@react-three/drei";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { work, type WorkCategory } from "~/content/site";
import { assets } from "./assets";
import { trackedText, useCanvasTexture } from "./canvasTexture";
import { extrudedText, flutedGeometry, metricUVs, radialTexture } from "./geometry";
import { velvetMaterial, type usePalette } from "./materials";
import { RoomShell, type Bounds } from "./Rooms";
import { workHall, world, type V3 } from "./world";

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

/** How deep the folds stand, relative to the half's width. */
const FOLD_DEPTH = 1.1;

/**
 * Velvet for the stage curtain. The mesh (scripts/make-curtain.mjs) carries the curtain twice,
 * hanging closed and gathered to the side; the vertex shader slides between the two with its real
 * folds, the hem trailing the top a little, and lets it breathe.
 */
function useCurtainMaterial() {
  const material = useMemo(() => {
    const m = velvetMaterial();
    const uniforms = { uOpen: { value: 0 }, uTime: { value: 0 } };
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
          attribute vec3 _open_position;
          attribute vec3 _open_normal;
          uniform float uOpen, uTime;
          // the hem (y 0) follows the top (y 1) a beat behind
          float openAt(float yN) { return smoothstep(0.0, 1.0, clamp(uOpen * 1.25 - (1.0 - yN) * 0.25, 0.0, 1.0)); }`,
        )
        .replace(
          "#include <beginnormal_vertex>",
          `float oa = openAt(position.y);
          vec3 objectNormal = normalize(mix(normal, _open_normal, oa));
          #ifdef USE_TANGENT
          vec3 objectTangent = vec3(1.0, 0.0, 0.0);
          #endif`,
        )
        .replace(
          "#include <begin_vertex>",
          `vec3 transformed = mix(position, _open_position, oa);
          transformed.z += sin(uTime * 0.7 + transformed.x * 9.0) * 0.004 * (1.0 - transformed.y);`,
        );
      m.userData.uniforms = uniforms;
    };
    m.customProgramCacheKey = () => "stage-curtain";
    return m;
  }, []);
  useLayoutEffect(() => () => material.dispose(), [material]);
  useFrame(({ clock }) => {
    const u = material.userData.uniforms;
    if (!u) return;
    u.uOpen.value = curtainOpen();
    u.uTime.value = clock.elapsedTime;
  });
  return material;
}

/** One half: hangs from its jamb (x 0 in the mesh) to the centre; the right half is the mirror image. */
function CurtainHalf({ side, width, height, material }: { side: -1 | 1; width: number; height: number; material: THREE.Material }) {
  const { scene } = useGLTF(assets.curtain);
  const geometry = useMemo(() => (scene.getObjectByName("curtain") as THREE.Mesh).geometry, [scene]);
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[side < 0 ? X - HW : X + HW, 0, workHall.curtainZ]}
      scale={[side < 0 ? width : -width, height, width * FOLD_DEPTH]}
      receiveShadow
    />
  );
}
useGLTF.preload(assets.curtain);

/* ------------------------------------------------------------------------- */
/*  The stage around it: lacquered floor, light beams, haze                  */
/* ------------------------------------------------------------------------- */

const FLOOR_FROM = workHall.curtainZ - 0.35;
const FLOOR_DEPTH = STAGE.maxZ - FLOOR_FROM;

/**
 * Black lacquer stage boards: a mirror under a dark, glossy coat, so the curtain, the lights and the
 * brass figure show faintly in the floor. The mirror only renders while it's on screen.
 */
function StageFloor() {
  const mirror = useMemo(() => {
    const r = new Reflector(new THREE.PlaneGeometry(HW * 2, FLOOR_DEPTH), { textureWidth: 1024, textureHeight: 512, color: 0x888888, clipBias: 0.003 });
    r.rotation.x = -Math.PI / 2;
    r.position.set(X, 0.002, FLOOR_FROM + FLOOR_DEPTH / 2);
    return r;
  }, []);
  useLayoutEffect(
    () => () => {
      mirror.getRenderTarget().dispose();
      mirror.geometry.dispose();
      (mirror.material as THREE.Material).dispose();
    },
    [mirror],
  );
  return (
    <>
      <primitive object={mirror} />
      <mesh rotation-x={-Math.PI / 2} position={[X, 0.004, FLOOR_FROM + FLOOR_DEPTH / 2]} receiveShadow>
        <planeGeometry args={[HW * 2, FLOOR_DEPTH]} />
        <meshStandardMaterial color="#150D09" roughness={0.28} metalness={0} transparent opacity={0.72} />
      </mesh>
    </>
  );
}

/** A visible shaft of light: an open cone, brightest at the lamp, fading down and at its edges. */
function Beam({ from, to, radius, opacity = 0.07 }: { from: V3; to: V3; radius: number; opacity?: number }) {
  const { geometry, material, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const length = dir.length();
    const geometry = new THREE.ConeGeometry(radius, length, 40, 1, true).translate(0, -length / 2, 0).rotateY(Math.PI);
    const material = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color("#ffd9a8") }, uOpacity: { value: opacity }, uLen: { value: length } },
      vertexShader: `uniform float uLen; varying float vY; varying vec3 vN; varying vec3 vView;
        void main() {
          vY = -position.y / uLen;
          vN = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vY; varying vec3 vN; varying vec3 vView;
        void main() {
          float edge = pow(abs(dot(normalize(vN), normalize(vView))), 2.0);
          float fall = pow(1.0 - vY, 1.6) * smoothstep(0.0, 0.06, vY);
          gl_FragColor = vec4(uColor, uOpacity * edge * fall);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
    return { geometry, material, quaternion, length };
  }, [from, to, radius, opacity]);
  useLayoutEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material]);
  return <mesh geometry={geometry} material={material} position={from} quaternion={quaternion} userData={{ length }} />;
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
        <mesh geometry={geometry} material={material} position-y={2.05} castShadow />
        <Text font={assets.fonts.sans} fontSize={0.075} letterSpacing={0.55} anchorX="center" position={[0, 1.85, 0.05]}>
          VIEWS · WITHOUT A RUPEE SPENT ON ADS
          <meshBasicMaterial color="#D9B98A" toneMapped={false} />
        </Text>
      </group>
    </group>
  );
}

/** Where the lights hang: a key light from the front (it casts the figure's shadow on the curtain), two side spots. */
const KEY: V3 = [X, 5.3, workHall.curtainZ + 3.6];
const SIDES: { from: V3; to: V3 }[] = [-1, 1].map((k) => ({
  from: [X + k * 2.1, 5.45, workHall.curtainZ + 1.5] as V3,
  to: [X + k * 1.7, 0, workHall.curtainZ + 0.15] as V3,
}));

function Stage({ p }: { p: Palette }) {
  const [targets] = useState(() => [new THREE.Object3D(), new THREE.Object3D(), new THREE.Object3D()]);
  const pelmet = useMemo(() => velvetMaterial(), []);
  const curtain = useCurtainMaterial();
  useLayoutEffect(() => () => pelmet.dispose(), [pelmet]);

  // shadows are drawn once for the whole office; here they follow the curtain as it opens
  const gl = useThree((s) => s.gl);
  const last = useRef(-1);
  useFrame(() => {
    const c = world.work.curtain;
    if (world.route === "work" && Math.abs(c - last.current) > 1e-4) {
      last.current = c;
      gl.shadowMap.needsUpdate = true;
    }
  });

  return (
    <group>
      <RoomShell b={STAGE} p={p} door={{ wall: "maxZ", u: X }} open={["minZ"]} />
      <StageFloor />
      <CurtainHalf side={-1} width={HW + 0.08} height={5.25} material={curtain} />
      <CurtainHalf side={1} width={HW + 0.08} height={5.25} material={curtain} />
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

      {/* light */}
      <primitive object={targets[0]} position={[X, 2.1, workHall.curtainZ]} />
      <spotLight
        target={targets[0]}
        position={KEY}
        angle={0.5}
        penumbra={0.75}
        intensity={120}
        distance={14}
        decay={2}
        color="#ffcf9a"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-near={1}
        shadow-camera-far={12}
      />
      {SIDES.map((s, i) => (
        <group key={i}>
          <primitive object={targets[i + 1]} position={s.to} />
          <spotLight target={targets[i + 1]} position={s.from} angle={0.36} penumbra={0.9} intensity={45} distance={9} decay={2} color="#ffd9a8" />
          <Beam from={s.from} to={s.to} radius={1.05} />
        </group>
      ))}
      <Beam from={KEY} to={[X, 0, workHall.curtainZ + 0.6]} radius={1.6} opacity={0.035} />

      {/* haze: dust in the light, and a low warm mist along the boards */}
      <Sparkles count={70} scale={[HW * 2 - 0.4, 4.4, 2.6]} position={[X, 2.5, workHall.curtainZ + 1.5]} size={1.6} speed={0.18} opacity={0.4} noise={0.6} color="#D9B98A" />
      <mesh position={[X, 0.9, workHall.curtainZ + 1.1]}>
        <planeGeometry args={[HW * 2, 2.2]} />
        <meshBasicMaterial map={radialTexture()} color="#8A6A35" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
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
        ctx.fillStyle = "#C99A45";
        ctx.font = '600 20px "Manrope", sans-serif';
        trackedText(ctx, `NO. 0${i + 1}`, pad, h - pad - 150, 6);
        ctx.fillStyle = "#F3EAD8";
        ctx.font = '700 80px "Manrope", sans-serif';
        ctx.fillText(c.title.toUpperCase(), pad, h - pad - 52);
        ctx.fillStyle = "rgba(244,237,225,0.7)";
        ctx.font = '500 20px "Manrope", sans-serif';
        trackedText(ctx, c.subtitle.toUpperCase(), pad, h - pad, 3.5);
      } else {
        ctx.fillStyle = "rgba(244,237,225,0.92)";
        ctx.font = 'italic 400 40px "DM Sans", sans-serif';
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
        ctx.fillStyle = "#C99A45";
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
          <meshStandardMaterial color="#C99A45" metalness={1} roughness={0.35} />
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
        <meshBasicMaterial map={radialTexture()} color="#C99A45" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <Text font={assets.fonts.sans} fontSize={0.12} letterSpacing={0.55} anchorX="center" position={[0, 3.45, 0.05]}>
        AND COUNTING
        <meshBasicMaterial color="#C99A45" toneMapped={false} />
      </Text>
      <mesh geometry={geometry} material={material} position={[0, 2.0, 0.08]} />
      <Text font={assets.fonts.sans} fontSize={0.13} letterSpacing={0.55} anchorX="center" position={[0, 1.55, 0.05]}>
        VIEWS · WITHOUT A RUPEE ON ADS
        <meshBasicMaterial color="#D9B98A" toneMapped={false} />
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
