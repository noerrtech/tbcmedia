import { describe, expect, it } from "vitest";
import { work } from "~/content/site";
import { EXHIBITS, NODES, catmullRom, nearestReachable, route, routePoints, walkable, type P2 } from "~/lib/museum";

const dist = (a: P2, b: P2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe("the Museum of Impact — floor plan", () => {
  it("has one exhibition per case study, each with a viewing spot inside the building", () => {
    expect(EXHIBITS.length).toBe(work.length);
    for (const e of EXHIBITS) {
      expect(walkable(...NODES[e.node].at)).toBe(true);
      // a comfortable reading distance from the exhibit
      const d = dist(NODES[e.node].at, [e.panel[0], e.panel[2]]);
      expect(d).toBeGreaterThan(3);
      expect(d).toBeLessThan(6.2);
    }
  });

  it("puts every node on walkable floor", () => {
    for (const [id, n] of Object.entries(NODES)) expect(walkable(...n.at), id).toBe(true);
  });

  it("keeps the monument and the walls off the floor", () => {
    expect(walkable(EXHIBITS[0].panel[0], EXHIBITS[0].panel[2])).toBe(false); // the wall the exhibit hangs on
    expect(walkable(NODES.ring0.at[0], NODES.ring0.at[1] - 5.6)).toBe(false); // the monument at the centre
  });
});

describe("the Museum of Impact — moving around", () => {
  const ids = Object.keys(NODES);

  it("can reach every exhibition from the entrance, and every exhibition from every other", () => {
    for (const a of ids) for (const b of ids) expect(route(a, b).length, `${a} → ${b}`).toBeGreaterThan(0);
  });

  it("never passes through a wall or the monument, on any journey", () => {
    for (const a of ids)
      for (const b of ids) {
        if (a === b) continue;
        const path = catmullRom(routePoints(a, b), 12);
        for (const p of path) expect(walkable(p[0], p[1]), `${a} → ${b} at ${p.map((v) => v.toFixed(2))}`).toBe(true);
      }
  });

  it("curves rather than turning on the spot mid-walk", () => {
    const path = catmullRom(routePoints("entrance", "gallery3"), 12);
    let worst = 0;
    for (let i = 2; i < path.length; i++) {
      const a = Math.atan2(path[i - 1][1] - path[i - 2][1], path[i - 1][0] - path[i - 2][0]);
      const b = Math.atan2(path[i][1] - path[i - 1][1], path[i][0] - path[i - 1][0]);
      let d = Math.abs(b - a);
      if (d > Math.PI) d = 2 * Math.PI - d;
      worst = Math.max(worst, d);
    }
    expect(worst).toBeLessThan(0.5); // under ~30° between neighbouring steps of ~0.4 m
  });

  it("walks to an exhibition from wherever you stand while exploring freely", () => {
    const here: P2 = [NODES.ring2.at[0] + 0.8, NODES.ring2.at[1] - 0.5];
    const start = nearestReachable(here);
    expect(start).not.toBeNull();
    const path = catmullRom([here, ...routePoints(start!, "gallery5")], 12);
    for (const p of path) expect(walkable(p[0], p[1])).toBe(true);
  });
});
