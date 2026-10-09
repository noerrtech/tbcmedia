import { useGLTF } from "@react-three/drei";
import { useFrame, useLoader, type ThreeElements } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { assets } from "./assets";
import type { usePalette } from "./materials";

type Palette = ReturnType<typeof usePalette>;
type Tweak = (mat: THREE.MeshStandardMaterial, mesh: THREE.Mesh) => void;

/** A placed copy of a glTF model, with its own materials so per-instance tweaks don't leak. */
function useModel(url: string, tweak?: Tweak) {
  const { scene } = useGLTF(url);
  return useMemo(() => {
    const o = scene.clone(true);
    o.traverse((m) => {
      if (!(m instanceof THREE.Mesh)) return;
      m.castShadow = true;
      m.receiveShadow = true;
      const own = (x: THREE.Material) => {
        const c = x.clone() as THREE.MeshStandardMaterial;
        c.envMapIntensity = 0.9;
        tweak?.(c, m);
        return c;
      };
      m.material = Array.isArray(m.material) ? m.material.map(own) : own(m.material);
    });
    return o;
    // tweak is defined inline by callers; the model only needs building once per url
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);
}

export function Model({ url, tweak, ...props }: { url: string; tweak?: Tweak } & ThreeElements["group"]) {
  const obj = useModel(url, tweak);
  return (
    <group {...props}>
      <primitive object={obj} />
    </group>
  );
}

/* ------------------------------------------------------------------------- */

const isNamed = (mat: THREE.Material, part: string) => mat.name.toLowerCase().includes(part);

/**
 * The lobby pendant: the Poly Haven ceiling lamp on a long brass cable, its globe
 * flickering on like the lights coming up.
 */
export function LampPendant({
  x,
  z,
  delay,
  p,
  ceiling,
  hang = 3.0,
  intensity = 14,
}: {
  x: number;
  z: number;
  delay: number;
  p: Palette;
  ceiling: number;
  /** height of the lamp's base */
  hang?: number;
  intensity?: number;
}) {
  const globes = useRef<THREE.MeshStandardMaterial[]>([]);
  const light = useRef<THREE.PointLight>(null);
  const t0 = useRef<number | null>(null);
  const top = hang + 1.17;

  const obj = useModel(assets.furniture.ceilingLamp, (mat) => {
    if (isNamed(mat, "globe")) {
      mat.emissive = new THREE.Color("#ffc985");
      mat.emissiveIntensity = 0;
      mat.toneMapped = false;
      globes.current.push(mat);
    } else if (isNamed(mat, "glass")) {
      // frosted shell, softly lit from within. Front faces only, so the lamp's own light
      // can't blow out its inside; no transmission pass.
      mat.side = THREE.FrontSide;
      mat.transparent = true;
      mat.opacity = 0.55;
      mat.depthWrite = false;
      mat.color = new THREE.Color("#f3e3c7");
      mat.emissive = new THREE.Color("#ffc985");
      mat.emissiveIntensity = 0;
      globes.current.push(mat);
    }
  });

  useFrame(({ clock }) => {
    if (t0.current === null) t0.current = clock.elapsedTime;
    const t = clock.elapsedTime - t0.current - delay;
    // 0 → on → dip → on, over 0.6s
    let k = 0;
    if (t > 0.6) k = 1;
    else if (t > 0) k = t < 0.18 ? t / 0.18 : t < 0.3 ? 1 - ((t - 0.18) / 0.12) * 0.4 : 0.6 + ((t - 0.3) / 0.3) * 0.4;
    for (const g of globes.current) g.emissiveIntensity = (isNamed(g, "glass") ? 0.28 : 0.85) * k;
    if (light.current) light.current.intensity = intensity * k;
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, (ceiling + top) / 2, 0]} material={p.brass}>
        <cylinderGeometry args={[0.005, 0.005, ceiling - top, 6]} />
      </mesh>
      <primitive object={obj} position-y={hang} />
      <pointLight
        ref={light}
        position={[0, hang - 0.08, 0]}
        color="#ffd29a"
        intensity={0}
        distance={9}
        decay={2}
      />
    </group>
  );
}

/**
 * An open laptop, built from boxes: aluminium body, black bezel, a softly lit screen and the TBC
 * logo on the lid. Local frame: hinge at the back (-z), screen facing +z — rotate it to face its user.
 */
export function Laptop(props: ThreeElements["group"]) {
  const logo = useLoader(THREE.TextureLoader, assets.logo);
  const mats = useMemo(() => {
    logo.colorSpace = THREE.SRGBColorSpace;
    return {
      body: new THREE.MeshStandardMaterial({ color: "#3d3f42", metalness: 0.85, roughness: 0.32 }),
      bezel: new THREE.MeshStandardMaterial({ color: "#0d0d0e", roughness: 0.4 }),
      keys: new THREE.MeshStandardMaterial({ color: "#151516", roughness: 0.8 }),
      screen: new THREE.MeshBasicMaterial({ color: "#F3EAD8", toneMapped: false }),
      badge: new THREE.MeshBasicMaterial({ map: logo, transparent: true, alphaTest: 0.45, toneMapped: false }),
    };
  }, [logo]);
  const W = 0.34;
  const D = 0.235;
  const lid = 0.225;
  const tilt = 0.29; // lid leans back from upright, radians (opened about 107°)
  return (
    <group {...props}>
      {/* base */}
      <mesh material={mats.body} position={[0, 0.0075, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, 0.015, D]} />
      </mesh>
      <mesh material={mats.keys} position={[0, 0.0152, -0.02]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[W * 0.86, D * 0.42]} />
      </mesh>
      {/* lid, hinged at the back edge */}
      <group position={[0, 0.015, -D / 2]} rotation-x={-tilt}>
        <mesh material={mats.body} position={[0, lid / 2, -0.004]} castShadow>
          <boxGeometry args={[W, lid, 0.007]} />
        </mesh>
        <mesh material={mats.bezel} position={[0, lid / 2, 0.0002]}>
          <planeGeometry args={[W * 0.97, lid * 0.96]} />
        </mesh>
        <mesh material={mats.screen} position={[0, lid / 2 + 0.004, 0.0006]}>
          <planeGeometry args={[W * 0.9, lid * 0.82]} />
        </mesh>
        {/* logo on the back of the lid */}
        <mesh material={mats.badge} position={[0, lid / 2, -0.0082]} rotation-y={Math.PI}>
          <planeGeometry args={[0.09, 0.09 * (943 / 1202)]} />
        </mesh>
      </group>
      {/* a little screen light on whoever sits at it */}
      <pointLight position={[0, 0.2, 0.25]} intensity={0.5} distance={1.2} decay={2} color="#f6ead2" />
    </group>
  );
}

/** A reading corner: armchair, walnut side table with a brass vase on it, a plant behind. */
export function Lounge({ side, p }: { side: -1 | 1; p: Palette }) {
  const [target] = useState(() => new THREE.Object3D());
  const chair = side < 0 ? assets.furniture.armchairClassic : assets.furniture.armchairModern;
  return (
    <group>
      <Model url={chair} position={[side * 5.2, 0, -2.4]} rotation-y={-side * 1.1} />
      {/* side table */}
      <group position={[side * 5.95, 0, -1.25]}>
        <mesh material={p.walnut} position={[0, 0.27, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.46, 0.54, 0.46]} />
        </mesh>
        <mesh material={p.stone} position={[0, 0.56, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.04, 0.5]} />
        </mesh>
        <Model url={assets.furniture.brassVase} position={[0, 0.58, 0]} scale={0.85} />
      </group>
      <Model url={assets.furniture.plant} position={[side * 6.25, 0, -3.55]} rotation-y={side * 0.8} />
      {/* a soft pool of light over the corner */}
      <primitive object={target} position={[side * 5.5, 0.4, -2.2]} />
      <spotLight target={target} position={[side * 5, 6, -1.4]} angle={0.42} penumbra={1} intensity={45} distance={9} decay={2} color="#ffd6a3" />
    </group>
  );
}

for (const url of Object.values(assets.furniture)) useGLTF.preload(url);
