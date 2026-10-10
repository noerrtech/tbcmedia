import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { museumPose } from "~/components/three/museumCamera";
import { museumGo, world } from "~/components/three/world";
import { EXHIBITS } from "~/lib/museum";

/** Run the camera for `secs` of simulated time at 60 fps; return what it ends on. */
function run(secs: number, start: number, dt = 1 / 60) {
  const pos = new THREE.Vector3(), look = new THREE.Vector3();
  let now = start;
  for (let i = 0; i < secs * 60; i++) {
    now += 1000 / 60;
    museumPose(pos, look, dt, now, false);
    for (const v of [pos.x, pos.y, pos.z, look.x, look.y, look.z]) if (!Number.isFinite(v)) throw new Error(`not finite at frame ${i}: pos ${pos.toArray()} look ${look.toArray()}`);
  }
  return { pos, look, now };
}

describe("the museum camera", () => {
  it("walks the visitor in, around, and to every exhibit without ever losing its way (no NaN)", () => {
    world.museum.reset++;
    world.museum.at = "stage";
    let t = 0;
    museumGo("entrance");
    t = run(12, t).now;
    expect(world.museum.at).toBe("entrance");
    museumGo("ring0");
    t = run(10, t).now;
    expect(world.museum.at).toBe("ring0");
    for (const e of EXHIBITS) {
      museumGo(e.node, true);
      const r = run(14, t);
      t = r.now;
      expect(world.museum.at).toBe(e.node);
      expect(world.museum.panel).toBe(e.index);
      // standing at reading distance from its wall, facing it
      expect(Math.hypot(r.pos.x - e.panel[0], r.pos.z - e.panel[2])).toBeLessThan(6.2);
    }
  });
});

describe("the museum camera on a stuttering frame clock", () => {
  it("stays finite with huge or zero frame times", () => {
    world.museum.reset++;
    world.museum.at = "stage";
    let t = 1e6;
    for (const dt of [600, 0, 1e-9, 5]) {
      museumGo(EXHIBITS[2].node, true);
      t = run(14, t, dt).now;
    }
    expect(world.museum.at).toBe(EXHIBITS[2].node);
  });
});
