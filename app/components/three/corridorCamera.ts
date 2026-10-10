import * as THREE from "three";
import { SCREENS, focusPose, walkAt } from "~/lib/corridor";
import { world } from "./world";

/**
 * The camera in the Work room's corridor. Walking, it follows the scroll straight down the middle.
 * Reading a screen (`world.work.focus`), it glides across to face it; letting go, it glides back to
 * the walk. One controller, damped toward one target, so nothing ever snaps or fights.
 */
const s = {
  pos: new THREE.Vector3(),
  look: new THREE.Vector3(),
  target: new THREE.Vector3(),
  targetLook: new THREE.Vector3(),
  init: false,
};

export function corridorPose(pos: THREE.Vector3, look: THREE.Vector3, dt: number, still = false) {
  const { walk, focus } = world.work;
  const screen = focus >= 0 ? SCREENS[focus] : null;
  const want = screen ? focusPose(screen) : walkAt(walk);
  s.target.set(...want.pos);
  s.targetLook.set(...want.look);
  if (!s.init || still) {
    s.pos.copy(s.target);
    s.look.copy(s.targetLook);
    s.init = true;
  }
  // gliding to a screen is unhurried; following the scroll is close behind it
  const k = 1 - Math.exp(-Math.min(Math.max(dt, 0), 0.1) * (screen ? 2.6 : 7));
  s.pos.lerp(s.target, k);
  s.look.lerp(s.targetLook, k);
  pos.copy(s.pos);
  look.copy(s.look);
}

/** Back on the stage, curtain closed — for a fresh visit to the room. */
export function resetCorridor() {
  s.init = false;
}
