/**
 * The office as one place. Every route is a camera "station" somewhere in a single 3D world;
 * changing route walks the camera from where it is, through the doorways, to the next station.
 *
 * Pure data + a tiny mutable store — no three.js import — so pages can read it without
 * pulling the 3D bundle. The canvas reads `world` every frame; pages write to it.
 */
import type { DoorKey } from "./doors";

export type V3 = [number, number, number];
export type StationKey = "reception" | "founder" | "story" | "services" | "work" | "jbn" | "next";

export const stationForPath: Record<string, StationKey> = {
  "/tbc": "reception",
  "/tbc/founder": "founder",
  "/tbc/story": "story",
  "/tbc/services": "services",
  "/tbc/work": "work",
  "/tbc/jbn": "jbn",
  "/tbc/next": "next",
};

type Station = {
  pos: V3;
  look: V3;
  /** Waypoints from the lobby to this station, in walking order (lobby side first). */
  route: V3[];
};

/** Lobby crossroads — the walk passes through here going room to room. */
const HUB: V3 = [0, 1.6, 2.2];

export const stations: Record<StationKey, Station> = {
  reception: { pos: [0, 1.62, 6.6], look: [0, 2.3, -8], route: [] },
  founder: { pos: [4.7, 1.62, -9.7], look: [4.7, 1.45, -16], route: [[4.7, 1.6, -5.4], [4.7, 1.6, -8.9]] },
  story: { pos: [3.4, 1.6, -13.2], look: [7.4, 1.8, -15.4], route: [[4.7, 1.6, -5.4], [4.7, 1.6, -9.4]] },
  services: { pos: [-8.4, 1.62, -4.9], look: [-15, 1.75, -4.9], route: [[-4.4, 1.6, -5.4], [-7.8, 1.6, -5.2]] },
  jbn: { pos: [8.4, 1.62, -4.9], look: [15, 1.85, -4.9], route: [[4.4, 1.6, -5.4], [7.8, 1.6, -5.2]] },
  // back by the door and a little high, so the stage boards show under the curtain
  work: { pos: [-4.7, 1.9, -8.15], look: [-4.7, 1.5, -12.2], route: [[-4.7, 1.6, -5.4], [-4.7, 1.75, -7.7]] },
  next: { pos: [0, 1.62, 13.2], look: [0, 2.15, 20], route: [[0, 1.6, 9.6], [0, 1.6, 12.6]] },
};

/* ---- the Work room's layout, shared by the scene and the page that scrolls it ---- */
export const workHall = {
  x: -4.7, // the room's centre line
  halfWidth: 3,
  curtainZ: -12.2,
  start: -12.6, // the corridor begins just behind the curtain
};

/* ---- store -------------------------------------------------------------- */

export type Direction = "forward" | "back";
/** A walk (the first time you enter a room) or a cut (a quick dip to black, on revisits). */
export type Travel = {
  id: number;
  points: V3[];
  duration: number;
  start: number;
  to: StationKey;
  direction: Direction;
  mode: "walk" | "cut";
};

export const world = {
  route: null as StationKey | null,
  /** The first station this visit landed on (the walk-in only plays at reception). */
  first: null as StationKey | null,
  travel: null as Travel | null,
  hovered: null as DoorKey | null,
  /** Where the camera is right now — written by the canvas each frame. */
  camera: [...stations.reception.pos] as V3,
  /**
   * The Work room: the curtain (0 closed → 1 open), how far down the corridor you've walked (0–1),
   * and the screen being read (`focus`) or under the pointer (`hovered`) — indices into SCREENS
   * (~/lib/corridor), -1 for none. Changes are announced with a "tbc:work" event.
   */
  work: { curtain: 0, walk: 0, focus: -1, hovered: -1 },
  /** Page scroll, in viewport heights — rooms dolly forward a little as you read. */
  scroll: 0,
  /** A section asking for its own darkness over the 3D (see ScrimZone); null = the default. */
  scrimOverride: null as number | null,
  /** 0…1 black over the world during a cut. */
  fade: 0,
};

const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function plan(from: StationKey, to: StationKey, start: V3): V3[] {
  // two views in the same room (they share a doorway): just step across
  const sameRoom =
    from !== "reception" && to !== "reception" && dist(stations[from].route[0], stations[to].route[0]) < 0.5;
  if (sameRoom) return [start, stations[to].pos];
  const pts: V3[] = [start];
  if (from !== "reception") pts.push(...[...stations[from].route].reverse());
  if (from !== "reception" && to !== "reception") pts.push(HUB);
  if (to !== "reception") pts.push(...stations[to].route);
  pts.push(stations[to].pos);
  // drop points that are practically on top of the one before
  return pts.filter((p, i) => i === 0 || dist(p, pts[i - 1]) > 0.4);
}

function lengthOf(pts: V3[]) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += dist(pts[i], pts[i - 1]);
  return l;
}

/** A steady walking pace: a short beat to set off, then ~9 m/s, between 1.1s and 3.4s. */
const durationFor = (pts: V3[]) => Math.min(3.4, Math.max(1.1, 0.9 + lengthOf(pts) / 9));

let nextId = 1;
/** Rooms already walked into this visit — later trips there are cuts, not walks. */
const walked = new Set<StationKey>();
const CUT = 0.5; // s — 0.2s to black, 0.3s back

/** Move to a station: the first call places the camera; later calls start a walk (or a cut). */
/** Tell the page something changed in the Work room (focus, hover). */
export function workNotify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("tbc:work"));
}

export function goTo(to: StationKey, direction: Direction = "forward") {
  const from = world.route;
  world.route = to;
  if (!from) {
    world.first = to;
    world.camera = [...stations[to].pos];
    return;
  }
  if (from === to) return;
  const points = plan(from, to, [...world.camera]);
  const mode = walked.has(to) ? "cut" : "walk";
  walked.add(to);
  world.travel = {
    id: nextId++,
    points,
    duration: mode === "cut" ? CUT : durationFor(points),
    start: performance.now(),
    to,
    direction,
    mode,
  };
}
