import * as THREE from "three";
import { EXHIBITS, EYE, NODES, catmullRom, lengths, nearestReachable, pointAt, routePoints, walkable, type P2 } from "~/lib/museum";
import { museumNotify, world } from "./world";

/**
 * The camera in the Museum of Impact. One controller owns it: standing at a node, walking a
 * journey, or exploring freely — never two at once. Journeys follow the museum's path network
 * (~/lib/museum), smoothed into curves: a visitor turns to face the way first, then walks at an
 * even pace with a gentle start and stop, looking where they're going and settling on the view.
 */

type Journey = {
  path: P2[];
  acc: number[];
  total: number;
  start: number;
  turn: number; // seconds turning on the spot before setting off
  walk: number; // seconds walking
  fromYaw: number;
  toYaw: number;
  y0: number;
  y1: number;
  to: string;
  open: boolean;
};

const WALK_SPEED = 1.5; // m/s — an unhurried visitor
const TURN_SPEED = 1.6; // rad/s
const FREE_SPEED = 2.2;

const s = {
  journey: null as Journey | null,
  lastRequest: 0,
  lastReset: -1,
  pos: new THREE.Vector3(NODES.stage.at[0], NODES.stage.y, NODES.stage.at[1]),
  look: new THREE.Vector3(...NODES.stage.look),
  yaw: Math.PI,
  pitch: 0,
  target: new THREE.Vector3(),
  tmp: new THREE.Vector3(),
};

const smoother = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const yawOf = (dx: number, dz: number) => Math.atan2(-dx, -dz); // camera yaw: 0 looks down -z
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Exhibit index whose viewing spot is this node, or -1. */
const exhibitAt = (node: string | null) => EXHIBITS.findIndex((e) => e.node === node);

function plan(to: string, open: boolean, now: number) {
  const m = world.museum;
  const here: P2 = [s.pos.x, s.pos.z];
  let pts: P2[];
  if (m.at && !s.journey && !m.free) pts = routePoints(m.at, to);
  else {
    const start = nearestReachable(here) ?? "entrance";
    pts = [here, ...routePoints(start, to)];
  }
  // drop a first point we're already standing on
  if (pts.length > 1 && Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) < 0.05) pts.shift();
  const path = catmullRom(pts, 10);
  const acc = lengths(path);
  const total = acc[acc.length - 1];
  const ahead = pointAt(path, acc, Math.min(total, 1.2));
  const toYaw = total > 0.2 ? yawOf(ahead[0] - here[0], ahead[1] - here[1]) : s.yaw;
  const fromYaw = yawOf(s.look.x - s.pos.x, s.look.z - s.pos.z);
  const angle = Math.abs(wrap(toYaw - fromYaw));
  s.journey = {
    path,
    acc,
    total,
    start: now,
    turn: total > 0.2 && angle > 0.5 ? angle / TURN_SPEED : 0,
    walk: total > 0.2 ? Math.min(11, Math.max(1.4, total / WALK_SPEED + 0.8)) : 0.6,
    fromYaw,
    toYaw: fromYaw + wrap(toYaw - fromYaw),
    y0: s.pos.y,
    y1: NODES[to].y,
    to,
    open,
  };
  m.at = null;
  m.walking = true;
  m.free = false;
  m.panel = -1;
  museumNotify();
}

function arrive(j: Journey) {
  const m = world.museum;
  s.journey = null;
  m.at = j.to;
  m.walking = false;
  const ex = exhibitAt(j.to);
  if (j.open && ex >= 0) m.panel = ex;
  museumNotify();
}

/** Where the camera is in the museum this frame. */
export function museumPose(pos: THREE.Vector3, look: THREE.Vector3, dt: number, now: number, still: boolean) {
  const m = world.museum;

  // a fresh visit: back on the stage, curtain closed
  if (m.reset !== s.lastReset) {
    s.lastReset = m.reset;
    s.journey = null;
    s.pos.set(NODES.stage.at[0], NODES.stage.y, NODES.stage.at[1]);
    s.look.set(...NODES.stage.look);
  }

  // a new request from the page (it replaces any walk in progress)
  if (m.request && m.request.id !== s.lastRequest) {
    s.lastRequest = m.request.id;
    const { to, open } = m.request;
    if (NODES[to]) {
      if (m.at === to && !s.journey && !m.free) {
        const ex = exhibitAt(to);
        if (open && ex >= 0) m.panel = ex;
        museumNotify();
      } else if (still) {
        // reduced motion: no walking, the view just changes
        const n = NODES[to];
        s.pos.set(n.at[0], n.y, n.at[1]);
        s.look.set(...n.look);
        arrive({ to, open } as Journey);
      } else plan(to, open, now);
    }
  }

  const j = s.journey;
  if (j) {
    const t = (now - j.start) / 1000;
    if (t < j.turn) {
      // turn to face the way, on the spot
      const yaw = j.fromYaw + (j.toYaw - j.fromYaw) * smoother(t / j.turn);
      s.look.set(s.pos.x - Math.sin(yaw) * 4, s.look.y + (EYE + 0.1 - s.look.y) * Math.min(1, dt * 3), s.pos.z - Math.cos(yaw) * 4);
    } else {
      const u = smoother((t - j.turn) / j.walk);
      const d = u * j.total;
      const p = pointAt(j.path, j.acc, d);
      s.pos.set(p[0], j.y0 + (j.y1 - j.y0) * u, p[1]);
      // look where you're going; settle on the view as you arrive
      const a = pointAt(j.path, j.acc, Math.min(j.total, d + 2.6));
      const ahead = s.tmp.set(a[0], EYE + 0.1, a[1]);
      if (Math.hypot(a[0] - p[0], a[1] - p[1]) < 0.4) ahead.set(...NODES[j.to].look);
      const end = s.target.set(...NODES[j.to].look);
      const w = THREE.MathUtils.smoothstep(u, 0.55, 1);
      const want = ahead.lerp(end, w);
      s.look.lerp(want, 1 - Math.exp(-dt * 6));
      if (t >= j.turn + j.walk) arrive(j);
    }
  } else if (m.free) {
    // explore freely: keys walk, drag looks; the walls hold you in
    s.yaw -= m.look.dx * 0.0042;
    s.pitch = THREE.MathUtils.clamp(s.pitch - m.look.dy * 0.003, -0.5, 0.45);
    m.look.dx = m.look.dy = 0;
    const f = m.keys.forward, r = m.keys.right;
    if (f || r) {
      const step = FREE_SPEED * Math.min(dt, 0.05);
      const fx = -Math.sin(s.yaw), fz = -Math.cos(s.yaw);
      const dx = (fx * f + -fz * r) * step, dz = (fz * f + fx * r) * step;
      // slide along walls: try each axis on its own
      if (walkable(s.pos.x + dx, s.pos.z)) s.pos.x += dx;
      if (walkable(s.pos.x, s.pos.z + dz)) s.pos.z += dz;
    }
    s.pos.y += (EYE - s.pos.y) * Math.min(1, dt * 4);
    s.look.set(s.pos.x - Math.sin(s.yaw) * Math.cos(s.pitch) * 4, s.pos.y + Math.sin(s.pitch) * 4, s.pos.z - Math.cos(s.yaw) * Math.cos(s.pitch) * 4);
  } else {
    // standing at a node: hold its view; with a story open, make room for it on the right
    const node = NODES[m.at ?? "stage"];
    s.pos.set(node.at[0], node.y, node.at[1]);
    const want = s.target.set(...node.look);
    if (m.panel >= 0 && exhibitAt(m.at) === m.panel) {
      const fwd = s.tmp.subVectors(want, s.pos).setY(0).normalize();
      // right of the view is fwd × up; aim right of the exhibit, so it sits left of the panel
      want.addScaledVector(new THREE.Vector3(-fwd.z, 0, fwd.x), 1.75);
    }
    s.look.lerp(want, 1 - Math.exp(-dt * 4));
  }

  // keep the free-look angles in step, so switching modes never jumps
  if (!m.free) {
    s.yaw = yawOf(s.look.x - s.pos.x, s.look.z - s.pos.z);
    s.pitch = Math.atan2(s.look.y - s.pos.y, Math.hypot(s.look.x - s.pos.x, s.look.z - s.pos.z));
  }
  m.where = [s.pos.x, s.pos.z, s.yaw];
  pos.copy(s.pos);
  look.copy(s.look);
}
