import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import type { V3 } from "./world";

/** A visible shaft of light: an open cone, brightest at the lamp, fading down and at its edges. */
export function Beam({ from, to, radius, opacity = 0.07 }: { from: V3; to: V3; radius: number; opacity?: number }) {
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
