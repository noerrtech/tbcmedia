/**
 * The Work room's hall of achievements: the case studies hang on the right-hand wall; the visitor
 * walks down the hall, stops at each piece and turns to face it, reads, turns back and walks on,
 * and ends at the end wall. Page progress (0–1) → where you are (`walk`, metres from the door,
 * negative = deeper), how far you're turned toward the piece (`facing` 0–1) and which piece is
 * being read (`at`, -1 while walking). Shared by the 3D hall and the page that scrolls it.
 */
import { work } from "~/content/site";

export const FRAMES = work.length;
/** metres from the door to the first stop, and between stops (the last stop is the end wall) */
export const FIRST = 4.5;
export const GAP = 6.5;

const LEAD = 0.6; // the walk in from the door (scroll units)
const WALK = 1; // between stops
const DWELL = 1.3; // standing at a piece
const TURN = 0.4; // of each dwell spent turning toward it, and away again

const ease = (t: number) => 0.5 - Math.cos(Math.PI * Math.min(1, Math.max(0, t))) / 2;

type Seg = { kind: "walk"; from: number; to: number; start: number; len: number } | { kind: "dwell"; stop: number; start: number; len: number };
const segs: Seg[] = [];
let t = 0;
segs.push({ kind: "walk", from: 0, to: -FIRST, start: t, len: LEAD });
t += LEAD;
for (let i = 0; i <= FRAMES; i++) {
  segs.push({ kind: "dwell", stop: i, start: t, len: DWELL });
  t += DWELL;
  if (i < FRAMES) {
    segs.push({ kind: "walk", from: -(FIRST + i * GAP), to: -(FIRST + (i + 1) * GAP), start: t, len: WALK });
    t += WALK;
  }
}
const TOTAL = t;
/** length of the walk in scroll units — the page sizes its scroll track from it */
export const HALL_UNITS = TOTAL;

/** metres from the door (negative) at which you stand to see stop i */
export const stopWalk = (i: number) => -(FIRST + i * GAP);

export function galleryAt(progress: number) {
  const time = Math.min(1, Math.max(0, progress)) * TOTAL;
  const seg = segs.find((s) => time < s.start + s.len) ?? segs[segs.length - 1];
  const f = Math.min(1, (time - seg.start) / seg.len);
  if (seg.kind === "walk") return { walk: seg.from + (seg.to - seg.from) * ease(f), facing: 0, at: -1, stop: -1 };
  // turn in, hold, turn away — except at the end wall, which you keep facing
  const last = seg.stop === FRAMES;
  const facing = last ? ease(f / TURN) : ease(f / TURN) * (1 - ease((f - (1 - TURN)) / TURN));
  // the words show once you've mostly turned to the piece
  const at = facing > 0.6 ? seg.stop : -1;
  return { walk: stopWalk(seg.stop), facing, at, stop: seg.stop };
}

/** progress at which you're standing at stop i, turned to it */
export function stopProgress(i: number) {
  const seg = segs.find((s) => s.kind === "dwell" && s.stop === i)!;
  return (seg.start + seg.len * (i === FRAMES ? 0.9 : 0.5)) / TOTAL;
}
