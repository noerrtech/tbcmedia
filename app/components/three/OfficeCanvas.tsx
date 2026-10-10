import { Environment, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { useReducedMotion } from "framer-motion";
import { ToneMappingMode } from "postprocessing";
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { assets } from "./assets";
import { doors } from "./doors";
import { LobbyScene } from "./LobbyScene";
import { usePalette } from "./materials";
import { ActionRoomScene, FounderCabin, JbnRoom, Library } from "./Rooms";
import { WorkHall } from "./WorkHall";
import { frameZ, hallZ, stations, workHall, world, type V3 } from "./world";
import { FRAMES, galleryAt } from "~/lib/gallery";

const INTRO_FROM = new THREE.Vector3(0, 1.9, 11.5);
const INTRO = 2.2; // s — the walk in from the street

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (a: number, b: number, v: number) => THREE.MathUtils.smoothstep(v, a, b);
const v3 = (p: V3, out = new THREE.Vector3()) => out.set(p[0], p[1], p[2]);

/** Heading of a direction as yaw/pitch (camera looks down -z at yaw 0). */
function anglesOf(d: THREE.Vector3) {
  const len = d.length() || 1;
  return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.asin(THREE.MathUtils.clamp(d.y / len, -1, 1)) };
}
/** Shortest way round between two yaws. */
function lerpYaw(a: number, b: number, t: number) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

/**
 * Where the Work room's camera is. The curtain parts and it steps through the proscenium into the
 * hall; then it walks the hall down the left, and at each piece on the right wall it stops and turns
 * to face it (the same way every time), turns back and walks on — ending at the end wall.
 */
const hallLook = new THREE.Vector3();
const pieceLook = new THREE.Vector3();
function workPose(pos: THREE.Vector3, look: THREE.Vector3) {
  const { curtain, hall } = world.work;
  const X = workHall.x;
  const { pos: from, look: at } = stations.work;
  const dolly = smooth(0.45, 1, curtain);
  const g = galleryAt(hall);
  const x = X + workHall.walkX * smooth(0.6, 1, curtain);
  const z = hallZ(g.walk);
  pos.set(x, THREE.MathUtils.lerp(from[1], 1.65, dolly), THREE.MathUtils.lerp(from[2], z, dolly));
  hallLook.set(x, THREE.MathUtils.lerp(at[1], 1.75, dolly), THREE.MathUtils.lerp(at[2], z - 8, dolly));
  if (g.stop < 0 || g.facing <= 0) return void look.copy(hallLook);
  if (g.stop >= FRAMES) {
    // the end wall: straight ahead, a little higher
    pieceLook.set(X - 0.3, 2.05, z - 8);
  } else {
    // aim a little short of the piece (toward the door), so it sits right of the words on screen
    const F = workHall.frame;
    pieceLook.set(X + F.x, F.y + 0.05, frameZ(g.stop) + 1.25);
  }
  look.lerpVectors(hallLook, pieceLook, g.facing);
}

/**
 * The camera. At a station it holds the station's view (with the lobby walk-in, a little
 * pointer drift, a glance at the doorway being considered, a dolly as you scroll). Between
 * stations it walks the path through the building, turning the way a person would.
 */
function Director({ still }: { still: boolean }) {
  const { camera, pointer } = useThree();
  const s = useRef({
    travelId: 0,
    curve: null as THREE.CatmullRomCurve3 | null,
    startYaw: 0,
    startPitch: 0,
    introStart: null as number | null,
    introDone: false,
    drift: new THREE.Vector2(),
    glance: new THREE.Vector2(),
    pos: new THREE.Vector3(),
    look: new THREE.Vector3(),
    tmp: new THREE.Vector3(),
    tmp2: new THREE.Vector3(),
  });

  useFrame((_, dt) => {
    const st = s.current;
    const now = performance.now();
    const tr = world.travel;

    if (tr && still) {
      world.travel = null; // reduced motion: no walking, the view just changes
      world.fade = 0;
    }
    else if (tr && tr.mode === "cut") {
      // a revisit: dip to black, move, come back up — 0.2s out, 0.3s in
      const t = THREE.MathUtils.clamp((now - tr.start) / 1000 / tr.duration, 0, 1);
      world.fade = t < 0.4 ? t / 0.4 : 1 - (t - 0.4) / 0.6;
      if (t >= 0.4) {
        v3(stations[tr.to].pos, camera.position);
        camera.lookAt(...stations[tr.to].look);
        st.introDone = true;
      }
      world.camera = [camera.position.x, camera.position.y, camera.position.z];
      if (t >= 1) {
        world.travel = null;
        world.fade = 0;
        st.drift.set(0, 0);
        st.glance.set(0, 0);
      }
      return;
    } else if (tr) {
      if (tr.id !== st.travelId) {
        st.travelId = tr.id;
        st.curve = new THREE.CatmullRomCurve3(tr.points.map((p) => v3(p)), false, "centripetal");
        const a = anglesOf(camera.getWorldDirection(st.tmp));
        st.startYaw = a.yaw;
        st.startPitch = a.pitch;
        st.introDone = true;
      }
      const t = THREE.MathUtils.clamp((now - tr.start) / 1000 / tr.duration, 0, 1);
      const u = easeInOutCubic(t);
      const curve = st.curve!;
      curve.getPointAt(u, camera.position);
      // face the way you're walking, then settle on the room's view
      const ahead = curve.getPointAt(Math.min(1, u + 0.04), st.tmp2).sub(camera.position);
      const end = stations[tr.to];
      const endA = anglesOf(v3(end.look, st.tmp).sub(v3(end.pos, st.pos)));
      const pathA = ahead.lengthSq() > 1e-6 ? anglesOf(ahead) : endA;
      // going back: step backwards out of the room a moment before turning round
      const w1 = tr.direction === "back" ? smooth(0.15, 0.45, u) : smooth(0, 0.28, u);
      const w2 = smooth(0.6, 1, u);
      const yaw = lerpYaw(lerpYaw(st.startYaw, pathA.yaw, w1), endA.yaw, w2);
      const pitch = THREE.MathUtils.lerp(THREE.MathUtils.lerp(st.startPitch, pathA.pitch * 0.3, w1), endA.pitch, w2);
      camera.rotation.set(pitch, yaw, 0, "YXZ");
      world.camera = [camera.position.x, camera.position.y, camera.position.z];
      if (t >= 1) {
        world.travel = null;
        st.drift.set(0, 0);
        st.glance.set(0, 0);
      }
      return;
    }

    // ---- at a station
    const key = world.route ?? "reception";
    const station = stations[key];
    const { pos, look } = st;
    v3(station.pos, pos);
    v3(station.look, look);

    if (key === "reception") {
      // the walk in from the street — only on arrival at the lobby
      if (world.first === "reception" && !st.introDone && !still) {
        if (st.introStart === null) st.introStart = now;
        const k = easeOutCubic(Math.min(1, (now - st.introStart) / 1000 / INTRO));
        pos.lerpVectors(INTRO_FROM, pos.clone(), k);
        if (k >= 1) st.introDone = true;
      }
      const door = world.hovered && world.hovered !== "next" ? doors.find((d) => d.key === world.hovered) : null;
      const gx = door ? (door.pos[0] - look.x) * (door.normal[2] === 0 ? 0.24 : 0.16) : 0;
      st.glance.x = THREE.MathUtils.damp(st.glance.x, still ? 0 : gx, 3, dt);
      st.glance.y = THREE.MathUtils.damp(st.glance.y, still || !door ? 0 : -0.25, 3, dt);
    } else if (key === "work") {
      workPose(pos, look);
    } else {
      // a slow dolly into the room as you read down the page
      const d = st.tmp.subVectors(look, pos).setY(0).normalize();
      pos.addScaledVector(d, still ? 0 : 0.5 * Math.min(1.5, world.scroll));
    }

    // a hint of life in the lobby; rooms hold still for reading
    const amt = key === "reception" ? 0.35 : 0;
    st.drift.x = THREE.MathUtils.damp(st.drift.x, still ? 0 : pointer.x * 0.35 * amt, 2.5, dt);
    st.drift.y = THREE.MathUtils.damp(st.drift.y, still ? 0 : pointer.y * 0.12 * amt, 2.5, dt);

    camera.position.set(pos.x + st.drift.x, pos.y + st.drift.y, pos.z);
    camera.lookAt(look.x + st.drift.x * 0.3 + st.glance.x, look.y + st.glance.y, look.z);
    world.camera = [pos.x, pos.y, pos.z];
  });

  return null;
}

/**
 * Tells the page the world is built — after compiling shaders and drawing the (static)
 * shadows once, so moving through it never hitches.
 */
function Ready({ onReady }: { onReady: () => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    // Compile every shader for the target the scene actually renders into (the effects
    // buffer: half-float, no tone mapping) — compiling for the screen builds different
    // variants, and the real ones would then compile mid-walk, the first time a room is seen.
    const target = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType });
    gl.setRenderTarget(target);
    gl.compile(scene, camera);
    // A quick tour behind the veil: one tiny frame from every station uploads each room's
    // geometry to the GPU now, instead of on the first walk into it.
    const pos = camera.position.clone();
    const quat = camera.quaternion.clone();
    for (const st of Object.values(stations)) {
      camera.position.set(...st.pos);
      camera.lookAt(...st.look);
      camera.updateMatrixWorld();
      gl.render(scene, camera);
    }
    camera.position.copy(pos);
    camera.quaternion.copy(quat);
    camera.updateMatrixWorld();
    gl.setRenderTarget(null);
    target.dispose();
    // …and upload every texture now rather than on first sight
    scene.traverse((o) => {
      const mats = (o as THREE.Mesh).material;
      for (const m of Array.isArray(mats) ? mats : mats ? [mats] : []) {
        for (const v of Object.values(m)) if (v instanceof THREE.Texture) gl.initTexture(v);
      }
    });
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    const again = window.setTimeout(() => (gl.shadowMap.needsUpdate = true), 1200);
    const id = requestAnimationFrame(onReady);
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(again);
    };
  }, [gl, scene, camera, onReady]);
  return null;
}

/** Dev only: exposes the live scene as window.__tbc for debugging in the console. */
function DevHandle() {
  const state = useThree();
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __tbc: unknown }).__tbc = state;
  }, [state]);
  return null;
}

/** Every room, in one world. */
function Building() {
  const p = usePalette();
  useLayoutEffect(() => () => Object.values(p).forEach((m) => m.dispose()), [p]);
  return (
    <>
      <LobbyScene p={p} />
      <FounderCabin p={p} />
      <Library p={p} />
      <JbnRoom p={p} />
      <ActionRoomScene p={p} />
      <WorkHall p={p} />
    </>
  );
}

export default function OfficeCanvas({ onReady }: { onReady: () => void }) {
  const [dpr, setDpr] = useState(1.5);
  const still = useReducedMotion() ?? false;
  return (
    <Canvas
      shadows
      dpr={dpr}
      camera={{ position: v3(stations.reception.pos).toArray(), fov: 45, near: 0.1, far: 80 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
      <color attach="background" args={["#150D09"]} />
      <fog attach="fog" args={["#150D09", 13, 34]} />
      <ambientLight intensity={0.04} />
      <Suspense fallback={null}>
        <Environment files={assets.hdri} environmentIntensity={0.35} />
        <Building />
        <Director still={still} />
        <Ready onReady={onReady} />
        <DevHandle />
      </Suspense>
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.45} />
        <Vignette offset={0.22} darkness={0.85} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}
