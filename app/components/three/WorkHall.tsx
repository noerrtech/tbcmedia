import { Sparkles, Text, useGLTF } from "@react-three/drei";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { work, type WorkCategory } from "~/content/site";
import { assets } from "./assets";
import { trackedText, useCanvasTexture } from "./canvasTexture";
import { extrudedText, flutedGeometry, metricUVs, radialTexture } from "./geometry";
import { velvetMaterial, type usePalette } from "./materials";
import { RoomShell, type Bounds } from "./Rooms";
import { workHall, world, type V3 } from "./world";
import { ACTS, fly } from "~/lib/acts";

type Palette = ReturnType<typeof usePalette>;

const X = workHall.x;
const HW = workHall.halfWidth;
const STAGE: Bounds = { minX: X - HW, maxX: X + HW, minZ: workHall.start, maxZ: -8.05, h: 5.6 };

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
 * Black lacquer stage boards: glossy enough to catch the footlights and the spots. (A true mirror
 * would show little more from the stalls, and its extra render inside the effects pass blanked the
 * whole frame on some GPUs.)
 */
function StageFloor() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[X, 0.004, FLOOR_FROM + FLOOR_DEPTH / 2]} receiveShadow>
      <planeGeometry args={[HW * 2, FLOOR_DEPTH]} />
      <meshStandardMaterial color="#150D09" roughness={0.22} metalness={0.15} envMapIntensity={0.9} />
    </mesh>
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
/*  Backstage: the case studies, played as acts                              */
/* ------------------------------------------------------------------------- */

const BACK_END = workHall.start - workHall.depth;
const SCREEN = workHall.screen;

/** Each act's light — the wash on the walls takes the colour of the act on stage. */
const palettes = [
  ["#6b4a2b", "#23170f", "#0b0806"],
  ["#4b2a2f", "#1c1012", "#090606"],
  ["#34404a", "#151a1f", "#070809"],
  ["#6a5532", "#241c10", "#0a0805"],
  ["#3d4a37", "#161b14", "#070806"],
];

/** The act's title card, painted for reading head-on: act number, title, what kind of problem. */
function paintCard(c: WorkCategory, i: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const [a, b, d] = palettes[i % palettes.length];
    const g = ctx.createRadialGradient(w * 0.72, h * 0.28, 0, w * 0.5, h * 0.5, w * 0.85);
    g.addColorStop(0, a);
    g.addColorStop(0.55, b);
    g.addColorStop(1, d);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const shade = ctx.createLinearGradient(0, h * 0.35, 0, h);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(0,0,0,0.72)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);
    const pad = w * 0.07;
    // a large, faint act numeral as the backdrop
    ctx.fillStyle = "rgba(243,234,216,0.07)";
    ctx.font = '800 420px "Manrope", sans-serif';
    ctx.textAlign = "right";
    ctx.fillText(String(i + 1).padStart(2, "0"), w - pad * 0.6, h * 0.62);
    ctx.textAlign = "left";
    ctx.fillStyle = "#C99A45";
    ctx.font = '600 24px "Manrope", sans-serif';
    trackedText(ctx, `ACT ${String(i + 1).padStart(2, "0")}`, pad, h - pad - 170, 7);
    ctx.fillStyle = "#F3EAD8";
    ctx.font = '700 104px "Manrope", sans-serif';
    ctx.fillText(c.title, pad, h - pad - 70);
    ctx.fillStyle = "rgba(243,234,216,0.75)";
    ctx.font = '500 24px "Manrope", sans-serif';
    trackedText(ctx, c.subtitle.toUpperCase(), pad, h - pad, 3);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  };
}

/**
 * One act's screen, hung from the fly loft on its own batten. It lowers in as its act begins
 * and flies out as the next comes down (the timing is shared with the page: ~/lib/acts).
 */
function ActScreen({ c, i, brass }: { c: WorkCategory; i: number; brass: THREE.Material }) {
  const texture = useCanvasTexture(paintCard(c, i), 1024, 640, `act-${c.id}`);
  const group = useRef<THREE.Group>(null);
  // each act hangs on the batten behind the last, so the new screen comes down behind the old one
  // as it lifts away; scaled up a touch to make up for the depth, so every act reads the same size
  const z = SCREEN.z - i * 0.3;
  const scale = (workHall.camEnd - z) / (workHall.camEnd - SCREEN.z);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const f = fly(i, world.work.acts * ACTS);
    g.visible = f.visible;
    g.position.y = SCREEN.y + f.up * 3.8;
    g.rotation.z = f.up * (i % 2 ? 0.03 : -0.03); // a slight swing on the lines
  });
  const { w, h } = SCREEN;
  return (
    <group ref={group} position={[X + SCREEN.x, SCREEN.y, z]} scale={scale} visible={i === 0}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} color={[1.55, 1.55, 1.55]} toneMapped={false} />
      </mesh>
      {[
        [0, h / 2 + 0.03, w + 0.12, 0.06],
        [0, -h / 2 - 0.03, w + 0.12, 0.06],
        [-w / 2 - 0.03, 0, 0.06, h + 0.12],
        [w / 2 + 0.03, 0, 0.06, h + 0.12],
      ].map(([x, y, bw, bh], k) => (
        <mesh key={k} material={brass} position={[x, y, 0.01]}>
          <boxGeometry args={[bw, bh, 0.05]} />
        </mesh>
      ))}
      {/* the lines it hangs from */}
      {[-w * 0.32, w * 0.32].map((x) => (
        <mesh key={x} position={[x, h / 2 + 3.2, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 6.4, 6]} />
          <meshBasicMaterial color="#8A6A35" />
        </mesh>
      ))}
    </group>
  );
}

/** The space behind the curtain: fluted walnut, a dark fly loft, a warm floor, the act's light. */
function Backstage({ p }: { p: Palette }) {
  const H = STAGE.h;
  const wall = useMemo(() => flutedGeometry(workHall.depth, H), [H]);
  const back = useMemo(() => metricUVs(new THREE.PlaneGeometry(HW * 2, H), 1.6), [H]);
  const midZ = workHall.start - workHall.depth / 2;
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#C99A45", metalness: 1, roughness: 0.35 }), []);
  useLayoutEffect(() => () => brass.dispose(), [brass]);

  // the wash takes the colour of the act on stage, blending as the scenery changes
  const wash = useRef<THREE.PointLight>(null);
  const from = useMemo(() => new THREE.Color(), []);
  const to = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    const l = wash.current;
    if (!l) return;
    const pp = Math.min(ACTS - 1, Math.max(0, world.work.acts * ACTS - 0.5));
    const k = Math.floor(pp);
    from.set(palettes[k % palettes.length][0]);
    to.set(palettes[Math.min(ACTS - 1, k + 1) % palettes.length][0]);
    l.color.copy(from).lerp(to, smooth(0, 1, pp - k)).multiplyScalar(1.6);
  });

  return (
    <group>
      <mesh geometry={wall} material={p.walnut} position={[X - HW, H / 2, midZ]} rotation-y={Math.PI / 2} receiveShadow />
      <mesh geometry={wall} material={p.walnut} position={[X + HW, H / 2, midZ]} rotation-y={-Math.PI / 2} receiveShadow />
      <mesh geometry={back} material={p.walnut} position={[X, H / 2, BACK_END]} />
      <mesh rotation-x={-Math.PI / 2} position={[X, 0, midZ]} material={p.floor} receiveShadow>
        <planeGeometry args={[HW * 2, workHall.depth]} />
      </mesh>
      {/* the fly loft: dark, so the screens vanish up into it */}
      <mesh rotation-x={Math.PI / 2} position={[X, H, midZ]}>
        <planeGeometry args={[HW * 2, workHall.depth]} />
        <meshBasicMaterial color="#0b0705" />
      </mesh>
      {work.map((c, i) => <ActScreen key={c.id} c={c} i={i} brass={brass} />)}
      {/* the screen's glow on the floor */}
      <mesh rotation-x={-Math.PI / 2} position={[X + SCREEN.x, 0.01, SCREEN.z + 1.3]}>
        <planeGeometry args={[SCREEN.w * 1.3, 2.6]} />
        <meshBasicMaterial map={radialTexture()} color="#C99A45" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight ref={wash} position={[X, 4.2, SCREEN.z + 2.5]} intensity={18} distance={12} decay={2} />
      <pointLight position={[X - 1.6, 3.2, workHall.start - 1.2]} color="#ffd29a" intensity={6} distance={7} decay={2} />
    </group>
  );
}

export function WorkHall({ p }: { p: Palette }) {
  return (
    <group>
      <Stage p={p} />
      <Backstage p={p} />
    </group>
  );
}
