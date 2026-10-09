# 012 — Walk the first time; cut on revisits

- **Status**: DONE (2026-10-09)
- **Commit**: b1e86b3 + uncommitted 3D-office working tree (2026-10-09)
- **Severity**: MEDIUM
- **Category**: Purpose & frequency
- **Estimated scope**: 2 files, ~35 lines
- **Depends on**: 001, 002 (and 004 if done — keep its `direction` field)

## Problem

Every room change — including the fifth time you go back to the lobby, or a jump from the floor
plan — plays the full 1–3 s camera walk. The walk is a great *first* impression; repeated, it
becomes a toll between the visitor and the content (frequency rule: delight is for rare moments).

## Target

- The **first** time a visit enters a given station: the full walk (as today).
- Any later visit to a station already seen this session: a **cut** — fade to black over 0.2 s,
  move the camera to the destination, fade back in over 0.3 s (strong ease-out).
- Reduced motion: unchanged (already jumps).

Implementation sketch:

```ts
// app/components/three/world.ts
const visited = new Set<StationKey>();
export type Travel = { …; mode: "walk" | "cut" };
// in goTo(), before building the travel:
  const mode = visited.has(to) ? "cut" : "walk";
  visited.add(to);
  world.travel = { …, duration: mode === "cut" ? 0.5 : durationFor(points), mode };
// in goTo()'s first-call branch (no `from`): visited.add(to);
```

```ts
// app/components/three/OfficeCanvas.tsx — in Director, inside `else if (tr)`, before the curve logic:
      if (tr.mode === "cut") {
        const t = THREE.MathUtils.clamp((now - tr.start) / 1000 / tr.duration, 0, 1);
        world.fade = t < 0.4 ? t / 0.4 : 1 - (t - 0.4) / 0.6;   // 0→1 over 0.2s, 1→0 over 0.3s
        if (t >= 0.4) { /* jump once */ v3(stations[tr.to].pos, camera.position); camera.lookAt(...stations[tr.to].look); }
        world.camera = [camera.position.x, camera.position.y, camera.position.z];
        if (t >= 1) { world.travel = null; world.fade = 0; }
        return;
      }
```

and a black overlay driven by `world.fade`: add `fade: 0` to the `world` store, and in
`app/routes/office.tsx`'s `Scrim` component combine it — `el.style.opacity = String(Math.max(level, world.fade))` —
updated every frame while a cut is running (add a small rAF loop that runs while `world.travel?.mode === "cut"`).
Note the 0.2 s / 0.3 s split: the fade-out of the old view is shorter than the fade-in of the new one.

## Steps

1. `world.ts`: add `visited`, the `mode` field, `fade: 0` in `world`, and the logic above.
2. `OfficeCanvas.tsx`: add the `cut` branch above at the top of the travelling branch.
3. `office.tsx`: make the scrim also honour `world.fade` (rAF loop only while a cut runs; no transition on those frames).
4. The page-arrival timing from plan 002 already reads `world.travel.duration`, so pages land correctly after a cut — verify.

## Boundaries

- Do NOT change walk paths or durations for first visits.
- Do NOT persist `visited` across page reloads (a fresh visit gets the walks again).

## Verification

- **Mechanical**: `npm run typecheck` passes.
- **Feel check**: Reception → Founder walks. Back to Reception → walks (first time back). Founder again → **cut**: a quick dip to black and you're there, text arriving with the fade-in. Floor-plan hops between rooms you've seen are all cuts.
- **Done when**: only first visits walk.
