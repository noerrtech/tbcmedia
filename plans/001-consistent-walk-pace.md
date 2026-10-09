# 001 — One walking pace for every walk, and no detours between views of the same room

- **Status**: DONE (2026-10-09)
- **Commit**: b1e86b3 + uncommitted 3D-office working tree (2026-10-09)
- **Severity**: HIGH
- **Category**: Easing & duration
- **Estimated scope**: 1 file, ~6 lines

## Problem

**1. No consistent tempo.** The walk duration is path length ÷ 6.5, clamped 1.2–3.2s:

```ts
// app/components/three/world.ts:95 — current
const durationFor = (pts: V3[]) => Math.min(3.2, Math.max(1.2, lengthOf(pts) / 6.5));
```

Because of the clamps, speed swings from ~3 m/s on short walks (held up by the 1.2s floor) to
~17 m/s on long ones (squeezed by the 3.2s ceiling). This is the main reason some room changes feel
laggy and others snappy.

**2. A pointless detour.** "The Founder's Room" and "Why TBC Exists" are two views inside the same
cabin, but `plan()` always routes room → room via the lobby crossroads:

```ts
// app/components/three/world.ts:79–88 — current
function plan(from: StationKey, to: StationKey, start: V3): V3[] {
  const pts: V3[] = [start];
  if (from !== "reception") pts.push(...[...stations[from].route].reverse());
  if (from !== "reception" && to !== "reception") pts.push(HUB);
  if (to !== "reception") pts.push(...stations[to].route);
  pts.push(stations[to].pos);
  // drop points that are practically on top of the one before
  return pts.filter((p, i) => i === 0 || dist(p, pts[i - 1]) > 0.4);
}
```

So Founder → Story walks out of the cabin, ~8 m across the lobby, and back in (~30 m) to move
4 m inside the room. (Line numbers approximate — locate the function by name.)

## Target

```ts
// app/components/three/world.ts — target plan()
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
```

```ts
// app/components/three/world.ts:95 — target durationFor
/** A steady walking pace: a short beat to set off, then ~9 m/s, between 1.1s and 3.4s. */
const durationFor = (pts: V3[]) => Math.min(3.4, Math.max(1.1, 0.9 + lengthOf(pts) / 9));
```

Expected durations: Founder → Story (~3.7 m, now direct) ≈ 1.3s · Reception → Work (~16.5 m) ≈ 2.7s
· Reception → JBN (~16.9 m) ≈ 2.8s · anything over ~22 m caps at 3.4s.

Keep the existing `easeInOutCubic` walk curve in `OfficeCanvas.tsx` — correct for on-screen movement.

## Steps

1. In `app/components/three/world.ts`, add the `sameRoom` early return at the top of `plan()` exactly as in the target.
2. Replace the `durationFor` line (and add its one-line doc comment) exactly as in the target.

## Boundaries

- Do NOT change stations, waypoints, `HUB`, or anything in `OfficeCanvas.tsx`.
- Do NOT change `travelTime`/`goTo` — they both call `plan` and `durationFor`, so they stay in sync.

## Verification

- **Mechanical**: `npm run typecheck` passes.
- **Feel check** (desktop, `npm run dev`, `/tbc`): walk Reception → Founder, then via the floor plan Founder → Why TBC Exists → Strategy Library → The Work → JBN.
  - Founder → Story stays inside the cabin (the camera never re-enters the lobby).
  - Every walk feels like the same person walking: short hops brisk, long walks not a blur.
  - Console check: `const W = await import(performance.getEntriesByType('resource').map(e=>e.name).find(n=>n.includes('three/world.ts')))` then `W.travelTime('founder','story')` ≈ 1.3 and `W.travelTime('reception','work')` ≈ 2.7.
- **Done when**: both checks above pass.
