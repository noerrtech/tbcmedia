/**
 * The Work room's corridor: a straight walk behind the curtain with the case studies on both walls —
 * each one's title card on the left, its story in brief on the right — and 419M+ on the end wall.
 * Scrolling walks you straight down it; clicking a screen takes you over to face it and opens the
 * full story. Pure layout maths (no three.js), shared by the scene, the camera and the page.
 */
import { work } from "~/content/site";

export type P3 = [number, number, number];

export const X0 = -4.7; // the corridor's centre line
export const HW = 3; // half its width
export const H = 4.6; // its height
export const START = -12.6; // it begins just behind the curtain
export const STAGE: P3 = [X0, 1.9, -8.15]; // where you stand before the curtain
export const EYE = 1.65;
export const FIRST = 6; // metres in to the first case study
export const GAP = 7; // between case studies
/** Portrait displays, angled a little toward you as you come; a spot in the ceiling above each. */
export const SCREEN = { w: 1.7, h: 2.8, y: 2.2, angle: 0.2 };

export type Side = "left" | "right";
export type Screen = { key: string; index: number; side: Side; at: P3; rotY: number };

const leftZ = (i: number) => START - FIRST - i * GAP;
/** How far a screen's centre stands off its wall: angled, its back edge must still clear the wall. */
const OFF = 0.1 + (SCREEN.w / 2) * Math.sin(SCREEN.angle);

/** Every screen: the case study's title card on the left wall, its story on the right, half a step on. */
export const SCREENS: Screen[] = work.flatMap((c, i) => [
  { key: `${c.id}-left`, index: i, side: "left" as Side, at: [X0 - HW + OFF, SCREEN.y, leftZ(i)] as P3, rotY: Math.PI / 2 - SCREEN.angle },
  { key: `${c.id}-right`, index: i, side: "right" as Side, at: [X0 + HW - OFF, SCREEN.y, leftZ(i) - GAP / 2] as P3, rotY: -Math.PI / 2 + SCREEN.angle },
]);

export const END_WALL = leftZ(work.length - 1) - GAP / 2 - 6.5;
const WALK_END = END_WALL + 7;

/** Where you are for a walk progress 0–1: from the stage, through the curtain, to the end wall. */
export function walkAt(p: number): { pos: P3; look: P3 } {
  const t = Math.min(1, Math.max(0, p));
  const z = STAGE[2] + (WALK_END - STAGE[2]) * t;
  const y = EYE + (STAGE[1] - EYE) * Math.max(0, 1 - t / 0.08);
  return { pos: [X0, y, z], look: [X0, y + 0.1, z - 8] };
}

/** Walk progress at which you're passing case study i (between its two screens). */
export function caseProgress(i: number) {
  const z = leftZ(i) - GAP / 4;
  return (z - STAGE[2]) / (WALK_END - STAGE[2]);
}

/** The case study you're passing at walk progress p. */
export function caseAt(p: number) {
  let best = 0;
  for (let i = 1; i < work.length; i++) if (Math.abs(caseProgress(i) - p) < Math.abs(caseProgress(best) - p)) best = i;
  return best;
}

/**
 * Where to stand to read a screen: across the corridor from it, facing it, and aimed a little past
 * it so it sits left of centre — the story panel opens on the right.
 */
export function focusPose(s: Screen): { pos: P3; look: P3 } {
  const across = s.side === "left" ? 1 : -1; // stand on the opposite side
  const pos: P3 = [X0 + across * (HW - 0.85), EYE, s.at[2] + 0.7];
  // facing the left wall (-x) your right is -z; facing the right wall (+x) it's +z
  const look: P3 = [s.at[0], s.at[1] - 0.1, s.at[2] + (s.side === "left" ? -1.1 : 1.1)];
  return { pos, look };
}
