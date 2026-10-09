/**
 * The TBC Growth Line: "What we do" as a train ride. A departure stop, then one station per service.
 *
 * Distances are in window-widths (one unit = the width of the carriage window), so the scenery can be
 * laid out and moved in percentages. Scroll progress (0–1) maps to a timeline of dwells at each stop and
 * eased travel between them: the train slows into every station, waits, then pulls away.
 */
import { services } from "~/content/site";

export type Stop = { no: string; name: string };

/** Gaps between neighbouring stops. They lengthen down the line, so the ride gathers speed. */
const GAPS = [1.4, 1.5, 1.6, 2.4, 2.4, 2.4];
/** The tunnel runs between these two stops (Go-to-Market → Growth Strategy). */
export const TUNNEL_AFTER = 3;

const DWELL = 0.6; // scroll units spent standing at a station
const END_DWELL = 0.5; // at the first and last stops
const TRAVEL = 1; // scroll units between two stops

const stops: Stop[] = [{ no: "00", name: "TBC Central" }, ...services.map((s) => ({ no: s.no, name: s.title }))];
const positions = stops.map((_, i) => GAPS.slice(0, i).reduce((a, b) => a + b, 0));

type Segment = { kind: "dwell"; stop: number; start: number; len: number } | { kind: "travel"; from: number; start: number; len: number };
const segments: Segment[] = [];
let t = 0;
stops.forEach((_, i) => {
  const len = i === 0 || i === stops.length - 1 ? END_DWELL : DWELL;
  segments.push({ kind: "dwell", stop: i, start: t, len });
  t += len;
  if (i < stops.length - 1) {
    segments.push({ kind: "travel", from: i, start: t, len: TRAVEL });
    t += TRAVEL;
  }
});
const total = t;

export const line = {
  stops,
  positions,
  /** world length in window-widths */
  length: positions[positions.length - 1],
  /** scroll units; the pinned scroll is this many × a fraction of the viewport */
  units: total,
};

const easeInOut = (f: number) => 0.5 - Math.cos(Math.PI * f) / 2;

export type Ride = {
  /** train position along the line, in window-widths */
  x: number;
  /** fractional stop index, for the route map */
  d: number;
  /** the stop whose content shows: the nearer one */
  at: number;
  /** the stop the train is heading for (null at the end of the line) */
  next: number | null;
  stopped: boolean;
};

export function rideAt(progress: number): Ride {
  const time = Math.min(1, Math.max(0, progress)) * total;
  const seg = segments.find((s) => time < s.start + s.len) ?? segments[segments.length - 1];
  if (seg.kind === "dwell") {
    const last = seg.stop === stops.length - 1;
    return { x: positions[seg.stop], d: seg.stop, at: seg.stop, next: last ? null : seg.stop + 1, stopped: true };
  }
  const f = easeInOut((time - seg.start) / seg.len);
  const i = seg.from;
  return {
    x: positions[i] + (positions[i + 1] - positions[i]) * f,
    d: i + f,
    at: f < 0.5 ? i : i + 1,
    next: i + 1,
    stopped: false,
  };
}

/** Scroll progress at which the train stands at stop `i` (the start and end of the ride for the ends). */
export function stopProgress(i: number) {
  if (i <= 0) return 0;
  if (i >= stops.length - 1) return 1;
  const seg = segments.find((s) => s.kind === "dwell" && s.stop === i)!;
  return (seg.start + seg.len / 2) / total;
}
