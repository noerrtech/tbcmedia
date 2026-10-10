import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { corridorPose, resetCorridor } from "~/components/three/corridorCamera";
import { world } from "~/components/three/world";
import { SCREENS, focusPose, walkAt } from "~/lib/corridor";

const run = (secs: number, dt = 1 / 60) => {
  const pos = new THREE.Vector3(), look = new THREE.Vector3();
  for (let i = 0; i < secs * 60; i++) {
    corridorPose(pos, look, dt);
    for (const v of [...pos.toArray(), ...look.toArray()]) if (!Number.isFinite(v)) throw new Error("not finite");
  }
  return { pos, look };
};

describe("the corridor camera", () => {
  it("walks with the scroll, glides to a clicked screen, and back", () => {
    resetCorridor();
    Object.assign(world.work, { walk: 0, focus: -1 });
    run(1);
    world.work.walk = 0.5;
    let r = run(3);
    expect(r.pos.distanceTo(new THREE.Vector3(...walkAt(0.5).pos))).toBeLessThan(0.05);
    for (let k = 0; k < SCREENS.length; k++) {
      world.work.focus = k;
      r = run(5);
      expect(r.pos.distanceTo(new THREE.Vector3(...focusPose(SCREENS[k]).pos))).toBeLessThan(0.05);
    }
    world.work.focus = -1;
    r = run(5);
    expect(r.pos.distanceTo(new THREE.Vector3(...walkAt(0.5).pos))).toBeLessThan(0.05);
  });

  it("stays finite on a stuttering clock", () => {
    resetCorridor();
    for (const dt of [0, 1e-9, 5, 600, -1]) run(1, dt);
  });
});
