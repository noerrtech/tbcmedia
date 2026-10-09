/**
 * The Work room plays its case studies as acts. Scroll progress p runs 0 … ACTS (act i owns
 * [i, i + 1)). Each act's screen hangs on its own batten: it flies in from above as its act
 * begins and flies out above as the next one comes in — the 3D stage and the flat page share this.
 */
import { work } from "~/content/site";

export const ACTS = work.length;

const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Which act's words show for page progress 0–1. */
export const actAt = (progress: number) => Math.min(ACTS - 1, Math.max(0, Math.floor(progress * ACTS)));

/** Page progress (0–1) that lands in the middle of act i. */
export const actProgress = (i: number) => (i + 0.5) / ACTS;

/**
 * Where act i's screen is at p (0 … ACTS): `up` 0 = hanging in place, 1 = flown out of sight.
 * At each change the old screen flies out (0.80 → 1.04) as the new one comes down (0.82 → 1.08):
 * they pass in the air, on different battens, and the stage is never bare.
 */
export function fly(i: number, p: number) {
  const local = p - i;
  const enter = i === 0 ? 1 : smoothstep(-0.18, 0.08, local);
  const exit = i === ACTS - 1 ? 0 : smoothstep(0.8, 1.04, local);
  const up = Math.min(1, 1 - enter + exit);
  return { up, visible: up < 0.999 };
}
