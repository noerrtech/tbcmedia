import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { assets } from "./assets";
import { archFrameGeometry, archShape, radialTexture } from "./geometry";
import type { usePalette } from "./materials";
import { world, type V3 } from "./world";

type Palette = ReturnType<typeof usePalette>;

export const ARCH_W = 2.2;
export const ARCH_H = 3.7;

const glowVertex = /* glsl */ `
  varying vec2 vP;
  void main() {
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const glowFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uFade;
  uniform vec2 uSize;
  varying vec2 vP;

  // 1 inside an arch of half-width w and total height h (base on y = 0), soft edged
  float arch(vec2 p, float w, float h, float soft) {
    float shoulder = h - w;
    float d = p.y < shoulder ? abs(p.x) - w : length(vec2(p.x, p.y - shoulder)) - w;
    d = max(d, -p.y);
    return 1.0 - smoothstep(-soft, soft, d);
  }

  void main() {
    float w = uSize.x * 0.5;
    float h = uSize.y;
    float y = vP.y / h;
    float x = abs(vP.x) / w;
    // a short passage: dim reveals, lit from a brighter doorway at the far end
    float reveal = mix(0.025, 0.2, exp(-y * 2.5)) * (1.0 - x * 0.6);
    float pool = exp(-y * 6.0) * (1.0 - smoothstep(0.2, 1.0, x)) * 0.55;
    float far = arch(vP, w * 0.42, h * 0.62, 0.04) * mix(0.5, 1.0, exp(-y * 1.8));
    gl_FragColor = vec4(uColor * (reveal + pool + far) * uIntensity, uFade);
  }
`;

/** A brass arch frame around an opening, `z` metres out from the wall. */
export function ArchFrame({
  p,
  width = ARCH_W,
  height = ARCH_H,
  z = 0.02,
  material,
}: {
  p: Palette;
  width?: number;
  height?: number;
  z?: number;
  /** defaults to brass */
  material?: THREE.Material;
}) {
  const frame = useMemo(() => archFrameGeometry(width, height), [width, height]);
  return <mesh geometry={frame} material={material ?? p.brass} position-z={z} castShadow />;
}

/**
 * An arched doorway glowing with the light of the room beyond, framed in brass.
 * The glow brightens when its option is hovered or chosen, and fades away as the camera
 * walks up to it, so you see the real room through the opening.
 */
export function Doorway({
  p,
  pos,
  normal,
  tint,
  label,
  id,
  width = ARCH_W,
  height = ARCH_H,
  passable = true,
}: {
  p: Palette;
  pos: V3;
  normal: V3;
  tint: string;
  label: string;
  /** station / hover key this doorway answers to */
  id?: string;
  width?: number;
  height?: number;
  passable?: boolean;
}) {
  const opening = useMemo(() => new THREE.ShapeGeometry(archShape(width, height), 48), [width, height]);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(tint) },
      uIntensity: { value: 0 },
      uFade: { value: 1 },
      uSize: { value: new THREE.Vector2(width, height) },
    }),
    [tint, width, height],
  );
  const glow = useRef<THREE.ShaderMaterial>(null);
  const spill = useRef<THREE.MeshBasicMaterial>(null);
  const plaque = useRef<THREE.MeshBasicMaterial>(null);
  const rotY = Math.atan2(normal[0], normal[2]);
  const front = useMemo(() => new THREE.Vector3(pos[0] + normal[0] * 0.9, 1.6, pos[2] + normal[2] * 0.9), [pos, normal]);
  const cam = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const m = glow.current;
    if (!m) return;
    const leaving = Boolean(id && world.travel?.to === id);
    const target = leaving ? 2.4 : id && world.hovered === id ? 1.7 : 1;
    const u = m.uniforms.uIntensity;
    u.value = THREE.MathUtils.damp(u.value, target, 4, dt);
    // walking up to it: the painted light gives way to the real room
    const fade = passable ? THREE.MathUtils.smoothstep(cam.set(...world.camera).distanceTo(front), 0.4, 3) : 1;
    m.uniforms.uFade.value = fade;
    if (spill.current) spill.current.opacity = 0.16 * u.value;
    if (plaque.current) plaque.current.color.setScalar(0.75 + 0.3 * u.value);
  });

  return (
    <group position={pos} rotation-y={rotY}>
      <mesh geometry={opening} position-z={0.03}>
        <shaderMaterial
          ref={glow}
          uniforms={uniforms}
          vertexShader={glowVertex}
          fragmentShader={glowFragment}
          toneMapped={false}
          transparent
        />
      </mesh>
      <ArchFrame p={p} width={width} height={height} />
      {/* light spilling onto the floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 1.3]}>
        <planeGeometry args={[width * 1.55, 3]} />
        <meshBasicMaterial
          ref={spill}
          map={radialTexture()}
          color={tint}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <Text
        font={assets.fonts.sans}
        fontSize={0.125}
        letterSpacing={0.3}
        anchorX="center"
        anchorY="middle"
        position={[0, height + 0.42, 0.05]}
      >
        {label.toUpperCase()}
        <meshBasicMaterial ref={plaque} color="#ead6ad" toneMapped={false} />
      </Text>
    </group>
  );
}
