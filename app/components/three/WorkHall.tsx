import { Text, useGLTF } from "@react-three/drei";
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
import { Museum } from "./Museum";

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

/**
 * Dust drifting in the light. (drei's Sparkles divides by the distance to each point's centre —
 * infinite at the centre pixel, which on some GPUs blacked out the frame through the bloom.)
 */
function Dust({ count, size, position }: { count: number; size: V3; position: V3 }) {
  const { geometry, material } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    let r = 7;
    const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      pos.set([(rnd() - 0.5) * size[0], (rnd() - 0.5) * size[1], (rnd() - 0.5) * size[2]], i * 3);
      seed[i] = rnd() * 100;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color("#D9B98A") }, uScale: { value: 1 } },
      vertexShader: `attribute float seed; uniform float uTime; uniform float uScale; varying float vA;
        void main() {
          vec3 p = position + vec3(sin(uTime * 0.13 + seed) * 0.25, mod(uTime * 0.05 + seed, 1.0) * 0.6 - 0.3, cos(uTime * 0.11 + seed * 1.7) * 0.2);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = clamp(uScale * 22.0 / max(-mv.z, 0.5), 1.0, 12.0);
          vA = 0.35 + 0.35 * sin(uTime * 0.6 + seed);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `uniform vec3 uColor; varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = clamp((0.5 - d) * 2.0, 0.0, 1.0);
          gl_FragColor = vec4(uColor, a * a * clamp(vA, 0.0, 1.0) * 0.6);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry, material };
  }, [count, size]);
  useLayoutEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material]);
  const dpr = useThree((s) => s.viewport.dpr);
  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uScale.value = dpr;
  });
  return <points geometry={geometry} material={material} position={position} />;
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
          // every term clamped: one NaN here would be smeared over the whole frame by the bloom
          float y = clamp(vY, 0.0, 1.0);
          float edge = clamp(abs(dot(normalize(vN + 1e-5), normalize(vView + 1e-5))), 0.0, 1.0);
          float fall = pow(max(1.0 - y, 0.0), 1.6) * smoothstep(0.0, 0.06, y);
          gl_FragColor = vec4(uColor, clamp(uOpacity * edge * edge * fall, 0.0, 1.0));
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
const DUST_SIZE: V3 = [HW * 2 - 0.4, 4.4, 2.6];
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
      <Dust count={70} size={DUST_SIZE} position={[X, 2.5, workHall.curtainZ + 1.5]} />
      <mesh position={[X, 0.9, workHall.curtainZ + 1.1]}>
        <planeGeometry args={[HW * 2, 2.2]} />
        <meshBasicMaterial map={radialTexture()} color="#8A6A35" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function WorkHall({ p }: { p: Palette }) {
  return (
    <group>
      <Stage p={p} />
      <Museum p={p} />
    </group>
  );
}
