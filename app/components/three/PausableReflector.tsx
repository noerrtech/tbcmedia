/**
 * drei's MeshReflectorMaterial (MIT, pmndrs/drei), trimmed — with one change: the reflection
 * is only re-rendered while `active()` is true. drei's version re-renders the whole scene
 * into the mirror every frame and forces its mesh visible, which across the whole office
 * building stalls the camera walk. Paused, the floor keeps its last reflection.
 */
import { extend, useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import { BlurPass } from "@react-three/drei/materials/BlurPass.js";
import { MeshReflectorMaterial as MeshReflectorMaterialImpl } from "@react-three/drei/materials/MeshReflectorMaterial.js";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

extend({ MeshReflectorMaterialImpl });

type Props = Omit<ThreeElements["meshStandardMaterial"], "args"> & {
  active: () => boolean;
  resolution?: number;
  blur?: [number, number];
  mixBlur?: number;
  mixStrength?: number;
  mixContrast?: number;
};

export function PausableReflectorMaterial({ active, resolution = 512, blur = [0, 0], mixBlur = 0, mixStrength = 1, mixContrast = 1, ...props }: Props) {
  const { gl, camera, scene } = useThree();
  const material = useRef<THREE.Material & { parent?: THREE.Object3D }>(null);
  const [s] = useState(() => ({
    plane: new THREE.Plane(),
    normal: new THREE.Vector3(),
    reflectorPos: new THREE.Vector3(),
    cameraPos: new THREE.Vector3(),
    rotation: new THREE.Matrix4(),
    lookAt: new THREE.Vector3(0, 0, -1),
    clipPlane: new THREE.Vector4(),
    view: new THREE.Vector3(),
    target: new THREE.Vector3(),
    q: new THREE.Vector4(),
    textureMatrix: new THREE.Matrix4(),
    virtualCamera: new THREE.PerspectiveCamera(),
  }));
  const hasBlur = blur[0] + blur[1] > 0;

  const [bx, by] = blur;
  const [fbo1, fbo2, blurpass] = useMemo(() => {
    const params = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: THREE.HalfFloatType };
    const a = new THREE.WebGLRenderTarget(resolution, resolution, params);
    a.depthBuffer = true;
    a.depthTexture = new THREE.DepthTexture(resolution, resolution);
    a.depthTexture.format = THREE.DepthFormat;
    a.depthTexture.type = THREE.UnsignedShortType;
    const b = new THREE.WebGLRenderTarget(resolution, resolution, params);
    const pass = new BlurPass({ gl, resolution, width: bx, height: by, minDepthThreshold: 0.9, maxDepthThreshold: 1, depthScale: 0, depthToBlurRatioBias: 0.25 });
    return [a, b, pass];
  }, [gl, resolution, bx, by]);
  useEffect(() => () => (fbo1.dispose(), fbo2.dispose()), [fbo1, fbo2]);
  const frames = useRef(0);

  useFrame(() => {
    const mesh = material.current && (material.current as unknown as { __r3f?: { parent?: { object: THREE.Object3D } } }).__r3f?.parent?.object;
    // always draw the first few frames, so a visit that starts in another room still has a reflection
    if (!mesh || (frames.current++ > 3 && !active())) return;
    const { plane, normal, reflectorPos, cameraPos, rotation, lookAt, clipPlane, view, target, q, textureMatrix, virtualCamera } = s;

    reflectorPos.setFromMatrixPosition(mesh.matrixWorld);
    cameraPos.setFromMatrixPosition(camera.matrixWorld);
    rotation.extractRotation(mesh.matrixWorld);
    normal.set(0, 0, 1).applyMatrix4(rotation);
    view.subVectors(reflectorPos, cameraPos);
    if (view.dot(normal) > 0) return;
    view.reflect(normal).negate().add(reflectorPos);
    rotation.extractRotation(camera.matrixWorld);
    lookAt.set(0, 0, -1).applyMatrix4(rotation).add(cameraPos);
    target.subVectors(reflectorPos, lookAt).reflect(normal).negate().add(reflectorPos);
    virtualCamera.position.copy(view);
    virtualCamera.up.set(0, 1, 0).applyMatrix4(rotation).reflect(normal);
    virtualCamera.lookAt(target);
    virtualCamera.far = camera.far;
    virtualCamera.updateMatrixWorld();
    virtualCamera.projectionMatrix.copy(camera.projectionMatrix);
    textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    textureMatrix.multiply(virtualCamera.projectionMatrix).multiply(virtualCamera.matrixWorldInverse).multiply(mesh.matrixWorld);
    // oblique near plane (terathon.com/code/oblique.html)
    plane.setFromNormalAndCoplanarPoint(normal, reflectorPos).applyMatrix4(virtualCamera.matrixWorldInverse);
    clipPlane.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    const pm = virtualCamera.projectionMatrix.elements;
    q.set((Math.sign(clipPlane.x) + pm[8]) / pm[0], (Math.sign(clipPlane.y) + pm[9]) / pm[5], -1, (1 + pm[10]) / pm[14]);
    clipPlane.multiplyScalar(2 / clipPlane.dot(q));
    pm[2] = clipPlane.x;
    pm[6] = clipPlane.y;
    pm[10] = clipPlane.z + 1;
    pm[14] = clipPlane.w;

    mesh.visible = false;
    const shadows = gl.shadowMap.autoUpdate;
    gl.shadowMap.autoUpdate = false;
    gl.setRenderTarget(fbo1);
    gl.state.buffers.depth.setMask(true);
    if (!gl.autoClear) gl.clear();
    gl.render(scene, virtualCamera);
    if (hasBlur) blurpass.render(gl, fbo1, fbo2);
    gl.shadowMap.autoUpdate = shadows;
    mesh.visible = true;
    gl.setRenderTarget(null);
  });

  return (
    <meshReflectorMaterialImpl
      ref={material}
      attach="material"
      key={`reflector-${hasBlur}`}
      mirror={0}
      textureMatrix={s.textureMatrix}
      mixBlur={mixBlur}
      tDiffuse={fbo1.texture}
      tDepth={fbo1.depthTexture}
      tDiffuseBlur={fbo2.texture}
      hasBlur={hasBlur}
      mixStrength={mixStrength}
      minDepthThreshold={0.9}
      maxDepthThreshold={1}
      depthScale={0}
      depthToBlurRatioBias={0.25}
      distortion={1}
      mixContrast={mixContrast}
      defines-USE_BLUR={hasBlur ? "" : undefined}
      {...props}
    />
  );
}
