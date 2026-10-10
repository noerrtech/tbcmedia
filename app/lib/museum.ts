/**
 * The Museum of Impact — the Work room's floor plan and the paths through it. Pure data and maths
 * (no three.js), shared by the 3D scene, the camera and the page, and tested in tests/museum.test.ts.
 *
 * Plan (looking down, entrance at the top):
 *
 *            stage (the curtain)
 *                  │
 *            entrance hall
 *                  │
 *        ┌──── rotunda ────┐      a round, top-lit hall with the 419M+ monument at its centre;
 *    G5  │      ( 419M+ )  │  G1  five galleries open off it through wide openings, one per case
 *    G4  │                 │  G2  study, so from the middle you can see into several at once
 *        └───────  G3 ─────┘
 *
 * Moving around: a small network of walkable nodes (the entrance, a ring around the monument,
 * one viewing spot per gallery). Journeys follow the network and are smoothed into curves.
 */
import { work } from "~/content/site";

export type P2 = [number, number]; // x, z
export type P3 = [number, number, number];

/* ---- the building -------------------------------------------------------- */

export const X0 = -4.7; // the work room's centre line (the stage and the entrance hall)
export const CZ = -30; // the rotunda's centre
export const R = 9; // rotunda radius (to the wall)
export const RING = 5.6; // the walking ring around the monument
export const MONUMENT_R = 2.4; // the monument's plinth
export const GW = 6; // gallery width
export const R1 = 15; // gallery back wall, from the rotunda centre
export const R0 = Math.sqrt(R * R - (GW / 2) ** 2); // where a gallery's side walls meet the rotunda
export const HALL_START = -12.6; // the entrance hall begins behind the curtain
export const STAGE_FRONT = -8.05; // the stage's front wall (the door from the lobby side)
export const H_ROTUNDA = 7.5;
export const H_GALLERY = 4.6;
export const EYE = 1.65;

const PAD = 0.45; // keep this far from any wall

/** the direction (x, z) of an angle around the rotunda; 0 = toward the entrance */
export const dirOf = (deg: number): P2 => [Math.sin((deg * Math.PI) / 180), Math.cos((deg * Math.PI) / 180)];
const at = (deg: number, r: number): P2 => {
  const [dx, dz] = dirOf(deg);
  return [X0 + dx * r, CZ + dz * r];
};

/* ---- the exhibitions ----------------------------------------------------- */

export type Exhibit = {
  index: number; // into `work`
  id: string;
  deg: number; // where its gallery opens off the rotunda
  dir: P2; // from the rotunda centre into the gallery
  across: P2; // along the gallery's width
  /** centre of the main exhibit wall panel, and the way it faces (rotation about y) */
  panel: P3;
  panelRotY: number;
  node: string; // where you stand to see it
  /** freestanding installations in the gallery: the floor they take up */
  obstacles: { at: P2; r: number }[];
};

export const EXHIBITS: Exhibit[] = work.map((c, i) => {
  const deg = 60 * (i + 1);
  const [dx, dz] = dirOf(deg);
  const across: P2 = [dz, -dx];
  const [px, pz] = at(deg, R1 - 0.08);
  // installations stand along both sides of the gallery, clear of the middle where you walk
  const side = (s: number, r: number): P2 => [X0 + dx * r + across[0] * s, CZ + dz * r + across[1] * s];
  return {
    index: i,
    id: c.id,
    deg,
    dir: [dx, dz],
    across,
    panel: [px, 2.2, pz],
    panelRotY: Math.atan2(-dx, -dz),
    node: `gallery${i + 1}`,
    obstacles: [
      // the installations, either side of the way in
      { at: side(-2.1, 10.6), r: 0.75 },
      { at: side(2.1, 10.6), r: 0.75 },
      // the story screens, angled out from the back wall either side of the main exhibit
      { at: side(-2.3, 14.2), r: 0.6 },
      { at: side(2.3, 14.2), r: 0.6 },
    ],
  };
});

/* ---- where you can stand ------------------------------------------------- */

const inGallery = (x: number, z: number, e: Exhibit) => {
  const rx = x - X0, rz = z - CZ;
  const along = rx * e.dir[0] + rz * e.dir[1];
  const side = rx * e.across[0] + rz * e.across[1];
  return Math.abs(side) <= GW / 2 - PAD && along >= R0 - 1 && along <= R1 - PAD - 0.4;
};

export function walkable(x: number, z: number): boolean {
  for (const e of EXHIBITS) for (const o of e.obstacles) if (Math.hypot(x - o.at[0], z - o.at[1]) < o.r + 0.3) return false;
  // the stage and the entrance hall
  if (Math.abs(x - X0) <= 3 - PAD && z <= STAGE_FRONT - 0.1 && z >= CZ + R0 - 0.6) return true;
  // the rotunda, around the monument
  const r = Math.hypot(x - X0, z - CZ);
  if (r <= MONUMENT_R + 0.6) return false;
  if (r <= R - PAD) return true;
  return EXHIBITS.some((e) => inGallery(x, z, e));
}

/* ---- the path network ---------------------------------------------------- */

export type Node = { at: P2; y: number; look: P3; label: string };

const ringNodes = Object.fromEntries(
  Array.from({ length: 6 }, (_, k) => {
    const p = at(60 * k, RING);
    return [`ring${k}`, { at: p, y: EYE, look: [X0, 1.9, CZ] as P3, label: k === 0 ? "The 419M+ monument" : "The rotunda" }];
  }),
);

export const NODES: Record<string, Node> = {
  stage: { at: [X0, -8.15], y: 1.9, look: [X0, 1.5, -12.2], label: "The stage" },
  door: { at: [X0, -13.6], y: EYE, look: [X0, 2, CZ], label: "The entrance" },
  entrance: { at: [X0, -18.6], y: EYE, look: [X0, 2.1, CZ], label: "The entrance hall" },
  ...ringNodes,
  ...Object.fromEntries(
    EXHIBITS.map((e) => {
      // back far enough to take in the whole triptych: the main exhibit and the screens either side
      const p = at(e.deg, R1 - 6);
      return [e.node, { at: p, y: EYE, look: [e.panel[0], 2.05, e.panel[2]] as P3, label: work[e.index].title }];
    }),
  ),
};

const EDGES: [string, string][] = [
  ["stage", "door"],
  ["door", "entrance"],
  ["entrance", "ring0"],
  ...Array.from({ length: 6 }, (_, k) => [`ring${k}`, `ring${(k + 1) % 6}`] as [string, string]),
  ...EXHIBITS.map((e, i) => [`ring${i + 1}`, e.node] as [string, string]),
];

const isRing = (id: string) => id.startsWith("ring");
const ringIndex = (id: string) => Number(id.slice(4));
const len = (a: string, b: string) => {
  if (isRing(a) && isRing(b)) return (RING * Math.PI) / 3;
  const [p, q] = [NODES[a].at, NODES[b].at];
  return Math.hypot(p[0] - q[0], p[1] - q[1]);
};
const neighbours = (id: string) => EDGES.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []));

/** The shortest chain of nodes from a to b (both included). */
export function route(a: string, b: string): string[] {
  const dist: Record<string, number> = { [a]: 0 };
  const prev: Record<string, string> = {};
  const open = new Set(Object.keys(NODES));
  while (open.size) {
    let u = "";
    for (const n of open) if (dist[n] !== undefined && (u === "" || dist[n] < dist[u])) u = n;
    if (u === "") break;
    open.delete(u);
    if (u === b) break;
    for (const v of neighbours(u)) {
      const d = dist[u] + len(u, v);
      if (dist[v] === undefined || d < dist[v]) (dist[v] = d), (prev[v] = u);
    }
  }
  if (dist[b] === undefined) return [];
  const out = [b];
  while (out[0] !== a) out.unshift(prev[out[0]]);
  return out;
}

/** The route as floor points: ring legs follow the arc around the monument. */
export function routePoints(a: string, b: string): P2[] {
  const ids = route(a, b);
  const pts: P2[] = [NODES[ids[0]].at];
  for (let i = 1; i < ids.length; i++) {
    const [p, q] = [ids[i - 1], ids[i]];
    if (isRing(p) && isRing(q)) {
      const from = ringIndex(p) * 60;
      let to = ringIndex(q) * 60;
      if (to - from > 180) to -= 360;
      if (from - to > 180) to += 360;
      for (let k = 1; k < 4; k++) pts.push(at(from + ((to - from) * k) / 4, RING));
    }
    pts.push(NODES[q].at);
  }
  return pts;
}

/** The nearest node you can walk to in a straight line from p (for leaving free exploration). */
export function nearestReachable(p: P2): string | null {
  const clear = (q: P2) => {
    const n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 0.2);
    for (let i = 0; i <= n; i++) if (!walkable(p[0] + ((q[0] - p[0]) * i) / n, p[1] + ((q[1] - p[1]) * i) / n)) return false;
    return true;
  };
  const ids = Object.keys(NODES)
    .filter((id) => id !== "stage")
    .sort((x, y) => Math.hypot(NODES[x].at[0] - p[0], NODES[x].at[1] - p[1]) - Math.hypot(NODES[y].at[0] - p[0], NODES[y].at[1] - p[1]));
  return ids.find((id) => clear(NODES[id].at)) ?? null;
}

/* ---- smoothing ----------------------------------------------------------- */

/** A centripetal Catmull-Rom curve through the points, `n` samples per segment. */
export function catmullRom(points: P2[], n = 12): P2[] {
  if (points.length < 2) return points.slice();
  const pts = [
    [2 * points[0][0] - points[1][0], 2 * points[0][1] - points[1][1]] as P2,
    ...points,
    [2 * points[points.length - 1][0] - points[points.length - 2][0], 2 * points[points.length - 1][1] - points[points.length - 2][1]] as P2,
  ];
  const out: P2[] = [points[0]];
  const tj = (ti: number, a: P2, b: P2) => ti + Math.max(1e-4, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])));
  for (let s = 1; s < pts.length - 2; s++) {
    const [p0, p1, p2, p3] = [pts[s - 1], pts[s], pts[s + 1], pts[s + 2]];
    const t0 = 0, t1 = tj(t0, p0, p1), t2 = tj(t1, p1, p2), t3 = tj(t2, p2, p3);
    for (let k = 1; k <= n; k++) {
      const t = t1 + ((t2 - t1) * k) / n;
      const lerp = (a: P2, b: P2, ta: number, tb: number): P2 => {
        const w = (t - ta) / (tb - ta);
        return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w];
      };
      const A1 = lerp(p0, p1, t0, t1), A2 = lerp(p1, p2, t1, t2), A3 = lerp(p2, p3, t2, t3);
      const B1 = lerp(A1, A2, t0, t2), B2 = lerp(A2, A3, t1, t3);
      out.push(lerp(B1, B2, t1, t2));
    }
  }
  return out;
}

/** Cumulative lengths along a polyline, for moving along it at an even pace. */
export function lengths(path: P2[]) {
  const acc = [0];
  for (let i = 1; i < path.length; i++) acc.push(acc[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  return acc;
}

/** The point a given distance along a polyline. */
export function pointAt(path: P2[], acc: number[], d: number): P2 {
  if (d <= 0) return path[0];
  const total = acc[acc.length - 1];
  if (d >= total) return path[path.length - 1];
  let i = 1;
  while (acc[i] < d) i++;
  const w = (d - acc[i - 1]) / (acc[i] - acc[i - 1] || 1);
  return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * w, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * w];
}
