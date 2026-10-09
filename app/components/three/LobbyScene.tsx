import { SpotLight, Text, useGLTF } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { assets } from "./assets";
import { doors } from "./doors";
import { ARCH_H, ARCH_W, Doorway } from "./Doorway";
import { extrudedText, flutedGeometry, metricUVs, radialTexture } from "./geometry";
import { DeskDressing, LampPendant, Lounge } from "./Furniture";
import { cutMaterial, useFloorTextures, usePalette, useSculptureMaps, useVaseMap } from "./materials";
import { PausableReflectorMaterial } from "./PausableReflector";
import { world } from "./world";

/* Lobby dimensions, metres. Camera looks down -z; the entrance is behind it. */
const W = 14; // wall to wall
const BACK = -8; // back wall
const FRONT = 12; // the entrance wall — the action room is through it
const H = 6.2; // ceiling
const SIDE_DOOR_Z = -5.4;
const FRONT_DOOR = { width: 3.2, height: 4.4 };

type Palette = ReturnType<typeof usePalette>;

/* ------------------------------------------------------------------------- */

/** True while the camera is in (or in a doorway of) the lobby. */
export function inLobby([x, , z]: number[]) {
  return z > BACK - 1.2 && z < FRONT + 1.2 && Math.abs(x) < W / 2 + 1.2;
}

function Floor() {
  const t = useFloorTextures();
  const depth = FRONT - BACK;
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, (FRONT + BACK) / 2]} receiveShadow>
      <planeGeometry args={[W, depth]} />
      {/* the mirror re-renders the building — only while you're standing in the lobby */}
      <PausableReflectorMaterial
        active={() => inLobby(world.camera) && !world.travel}
        {...t}
        color="#6d5c4b"
        roughness={1}
        normalScale={new THREE.Vector2(0.35, 0.35)}
        envMapIntensity={0.5}
        blur={REFLECTION_BLUR}
        resolution={512}
        mixBlur={1}
        mixStrength={2.2}
        mixContrast={1}
      />
    </mesh>
  );
}
const REFLECTION_BLUR: [number, number] = [320, 90];

function Walls({ p }: { p: Palette }) {
  const back = useMemo(() => flutedGeometry(W, H), []);
  const side = useMemo(() => metricUVs(new THREE.PlaneGeometry(FRONT - BACK, H), 1.6), []);
  const front = useMemo(() => metricUVs(new THREE.PlaneGeometry(W, H), 1.6), []);
  // real openings through the walls, so the camera can walk on into each room
  const mats = useMemo(
    () => ({
      back: cutMaterial(p.walnut, doors.filter((d) => d.normal[2] !== 0).map((d) => ({ axis: "x" as const, u: d.pos[0], width: ARCH_W, height: ARCH_H }))),
      side: cutMaterial(p.walnut, [{ axis: "z", u: SIDE_DOOR_Z, width: ARCH_W, height: ARCH_H }]),
      front: cutMaterial(p.walnut, [{ axis: "x", u: 0, width: FRONT_DOOR.width, height: FRONT_DOOR.height }]),
    }),
    [p.walnut],
  );
  useLayoutEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  const reveals = useMemo(() => {
    const zs: number[] = [];
    for (let z = BACK + 1.2; z < FRONT; z += 2.4) if (Math.abs(z - SIDE_DOOR_Z) > ARCH_W / 2 + 0.25) zs.push(z);
    return zs;
  }, []);
  // skirting runs between the doorways
  const frameHalf = ARCH_W / 2 + 0.14;
  const skirting = [
    [-W / 2, -4.7 - frameHalf],
    [-4.7 + frameHalf, 4.7 - frameHalf],
    [4.7 + frameHalf, W / 2],
  ];

  return (
    <group>
      {/* back wall: full-height fluted walnut */}
      <mesh geometry={back} material={mats.back} position={[0, H / 2, BACK]} receiveShadow />
      {/* side walls: flat walnut with brass reveals */}
      {[-1, 1].map((s) => (
        <group key={s} position={[(s * W) / 2, H / 2, (FRONT + BACK) / 2]} rotation-y={(-s * Math.PI) / 2}>
          <mesh geometry={side} material={mats.side} receiveShadow />
          {reveals.map((z) => (
            <mesh key={z} material={p.brass} position={[s * (z - (FRONT + BACK) / 2), 0, 0.005]}>
              <boxGeometry args={[0.025, H, 0.01]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* entrance wall, facing back into the lobby */}
      <mesh geometry={front} material={mats.front} position={[0, H / 2, FRONT]} rotation-y={Math.PI} receiveShadow />
      {/* ceiling */}
      <mesh rotation-x={Math.PI / 2} position={[0, H, (FRONT + BACK) / 2]} material={p.plaster}>
        <planeGeometry args={[W, FRONT - BACK]} />
      </mesh>
      {/* cove light where the ceiling meets the walls */}
      <mesh material={p.glow} position={[0, H - 0.06, BACK + 0.05]}>
        <boxGeometry args={[W, 0.015, 0.015]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={p.glow} position={[(s * W) / 2 - s * 0.05, H - 0.06, (FRONT + BACK) / 2]}>
          <boxGeometry args={[0.015, 0.015, FRONT - BACK]} />
        </mesh>
      ))}
      {/* brass skirting */}
      {skirting.map(([a, b]) => (
        <mesh key={a} material={p.brass} position={[(a + b) / 2, 0.06, BACK + 0.04]}>
          <boxGeometry args={[b - a, 0.12, 0.02]} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------------- */

/** "TBC" in solid polished brass: extruded, bevelled, tracked tight like the monogram. */
function SignLetters() {
  const font = useLoader(FontLoader, assets.fonts.displayTypeface);
  const geometry = useMemo(() => extrudedText(font, "TBC", { size: 1.6, depth: 0.07, tracking: -0.07, bevel: 0.016 }), [font]);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#d9b77e", metalness: 1, roughness: 0.26, envMapIntensity: 1.7 }),
    [],
  );
  useLayoutEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material]);
  return <mesh geometry={geometry} material={material} position={[0, 3.98, 0.1]} castShadow />;
}

function Signage({ p }: { p: Palette }) {
  return (
    <group position={[0, 0, BACK + 0.06]}>
      {/* backlight halo on the flutes */}
      <mesh position={[0, 4.45, 0.01]}>
        <planeGeometry args={[7, 3.4]} />
        <meshBasicMaterial
          map={radialTexture()}
          color="#C99A45"
          transparent
          opacity={0.32}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <SignLetters />
      <Text
        font={assets.fonts.sans}
        fontSize={0.13}
        letterSpacing={0.55}
        anchorX="center"
        anchorY="middle"
        position={[0, 3.45, 0.12]}
      >
        THE BRAND CAPPUCCINO
        <meshBasicMaterial color="#b9ab95" toneMapped={false} />
      </Text>
    </group>
  );
}

function Desk({ p }: { p: Palette }) {
  const front = useMemo(() => flutedGeometry(4.4, 1.0, { flute: 0.06, depth: 0.018 }), []);
  const z = -4.6;
  return (
    <group position={[0, 0, z]}>
      <mesh material={p.walnut} position={[0, 0.52, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.36, 1.04, 0.8]} />
      </mesh>
      <mesh geometry={front} material={p.walnut} position={[0, 0.56, 0.41]} castShadow receiveShadow />
      {/* black stone top */}
      <mesh material={p.stone} position={[0, 1.1, 0.04]} castShadow receiveShadow>
        <boxGeometry args={[4.6, 0.07, 0.98]} />
      </mesh>
      {/* LED line under the lip */}
      <mesh material={p.glow} position={[0, 1.055, 0.5]}>
        <boxGeometry args={[4.4, 0.008, 0.008]} />
      </mesh>
      {/* brass kick */}
      <mesh material={p.brass} position={[0, 0.03, 0.43]}>
        <boxGeometry args={[4.4, 0.06, 0.02]} />
      </mesh>
      <Text font={assets.fonts.sans} fontSize={0.055} letterSpacing={0.6} anchorX="center" position={[0, 0.7, 0.45]} material={p.brass}>
        CONCIERGE
      </Text>
    </group>
  );
}

/* ------------------------------------------------------------------------- */

function Plinth({ x, z, p, children }: { x: number; z: number; p: Palette; children: React.ReactNode }) {
  const [target] = useState(() => new THREE.Object3D());
  const top = 1.15;
  return (
    <group position={[x, 0, z]}>
      <mesh material={p.walnut} position={[0, top / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.52, top, 0.52]} />
      </mesh>
      <mesh material={p.brass} position={[0, top + 0.01, 0]}>
        <boxGeometry args={[0.56, 0.02, 0.56]} />
      </mesh>
      <group position={[0, top + 0.02, 0]}>{children}</group>
      <primitive object={target} position={[0, top + 0.2, 0]} />
      <SpotLight
        target={target}
        position={[0, H - 0.2, 0.6]}
        angle={0.2}
        penumbra={0.7}
        intensity={70}
        distance={7}
        decay={2}
        color="#ffdcae"
        attenuation={4.5}
        anglePower={5}
        radiusTop={0.04}
        radiusBottom={0.75}
        opacity={0.14}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
    </group>
  );
}

function Vase() {
  const { scene } = useGLTF(assets.vase.model);
  const { map } = useVaseMap();
  const obj = useMemo(() => {
    const o = scene.clone(true);
    o.traverse((m) => {
      if (m instanceof THREE.Mesh) {
        m.material = new THREE.MeshPhysicalMaterial({ map, roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.08, envMapIntensity: 1.2 }); // glazed porcelain
        m.castShadow = true;
      }
    });
    return o;
  }, [scene, map]);
  const s = 1.25;
  return <primitive object={obj} scale={s} position-y={0.2155 * s} />;
}

function Sculpture() {
  const { scene } = useGLTF(assets.sculpture.model);
  const maps = useSculptureMaps();
  const obj = useMemo(() => {
    const o = scene.clone(true);
    o.traverse((m) => {
      if (m instanceof THREE.Mesh) {
        m.material = new THREE.MeshStandardMaterial({ ...maps, roughness: 0.42, envMapIntensity: 1 }); // honed marble
        m.castShadow = true;
      }
    });
    return o;
  }, [scene, maps]);
  const s = 1.8;
  return <primitive object={obj} scale={s} position-y={0.1513 * s} />;
}

/* ------------------------------------------------------------------------- */

function WallWash() {
  const targets = useMemo(() => [-3, 3].map((x) => {
    const o = new THREE.Object3D();
    o.position.set(x, 1.2, BACK);
    return o;
  }), []);
  return (
    <>
      {targets.map((t, i) => (
        <group key={i}>
          <primitive object={t} />
          <spotLight target={t} position={[t.position.x, H - 0.1, BACK + 1.6]} angle={0.75} penumbra={1} intensity={90} distance={10} decay={2} color="#ffcf98" />
        </group>
      ))}
    </>
  );
}

export function LobbyScene({ p }: { p: Palette }) {
  return (
    <>
      <Floor />
      <Walls p={p} />
      <Signage p={p} />
      <Desk p={p} />
      <DeskDressing z={-4.6} top={1.135} />
      {[-1.7, 0, 1.7].map((x, i) => (
        <LampPendant key={x} x={x} z={-4.4} delay={0.2 + i * 0.25} p={p} ceiling={H} />
      ))}
      <Lounge side={-1} p={p} />
      <Lounge side={1} p={p} />
      <Plinth x={-3.3} z={-5.9} p={p}>
        <Vase />
      </Plinth>
      <Plinth x={3.3} z={-5.9} p={p}>
        <Sculpture />
      </Plinth>
      {doors.map((d) => (
        <Doorway key={d.key} p={p} id={d.key} pos={d.pos} normal={d.normal} tint={d.tint} label={d.label} />
      ))}
      {/* behind you as you walk in: the way on to the action room */}
      <Doorway
        p={p}
        id="next"
        pos={[0, 0, FRONT - 0.06]}
        normal={[0, 0, -1]}
        tint="#D9B98A"
        label="Start a project"
        width={FRONT_DOOR.width}
        height={FRONT_DOOR.height}
      />
      <WallWash />
    </>
  );
}

useGLTF.preload(assets.vase.model);
useGLTF.preload(assets.sculpture.model);
