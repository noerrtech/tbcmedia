# 002 — Start the walk on click, and land the page with the camera

- **Status**: DONE (2026-10-09)
- **Commit**: b1e86b3 + uncommitted 3D-office working tree (2026-10-09)
- **Severity**: HIGH
- **Category**: Purpose & frequency (feedback latency)
- **Estimated scope**: 2 files, ~25 lines
- **Depends on**: 000 (removes the `play` lines in `choose`), 001 (walk timing)

## Problem

Choosing an option at reception does nothing visible for 650 ms (1300 ms in the CSS office) —
the camera only starts walking when the route changes:

```tsx
// app/routes/office.reception.tsx:52–60 — current (after plan 000 the two `play` lines are gone)
  const choose = (to: string) => {
    if (leaving) return;
    setLeaving(to);
    setLine(replies[to]);
    play("footsteps", 0.45);
    window.setTimeout(() => play("door", 0.4), three ? 500 : 750);
    // in the 3D office the walk itself is the transition — set off once she's spoken
    window.setTimeout(() => navigate(to), three ? 650 : 1300);
  };
```

Then the next room's page is scheduled from the *route change* using a precomputed estimate, and
fades in slowly on top of its own (slow) reveals:

```tsx
// app/routes/office.tsx — current (in Office())
  const prev = useRef<StationKey | null>(null);
  const walk = useRef({ for: "", seconds: 0 });
  if (walk.current.for !== pathname) walk.current = { for: pathname, seconds: travelTime(prev.current, station) };
  …
  useEffect(() => {
    if (!three) return setArrived(pathname);
    const id = window.setTimeout(() => setArrived(pathname), Math.max(0, walk.current.seconds * 1000 - 250));
    return () => window.clearTimeout(id);
  }, [pathname, three]);
  …
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}>
```

Feedback within ~100 ms of a click is the bar; today it is 650 ms.

## Target

1. **Reception (3D):** the camera sets off immediately on click (`goTo` the destination station
   right away); the route changes 450 ms later, while the concierge's reply is on screen. The
   layout's own `goTo(station)` on the route change is then a no-op (same station), so the walk is
   not restarted.
2. **Reception (CSS office):** navigate after 700 ms instead of 1300 ms.
3. **Office layout:** schedule the page's arrival from the walk that is actually running —
   `world.travel.start + duration` — not from an estimate taken at route-change time.
4. **Page fade-in:** 0.45s with the strong ease-out `[0.23, 1, 0.32, 1]` (was 0.7s).

## Steps

1. `app/routes/office.reception.tsx`:
   - Change the world import to `import { goTo, stationForPath, world } from "~/components/three/world";`
   - Replace `choose` with:
     ```tsx
       const choose = (to: string) => {
         if (leaving) return;
         setLeaving(to);
         setLine(replies[to]);
         // 3D: the camera sets off on the click itself; the page follows while she's speaking
         if (three) goTo(stationForPath[to]);
         window.setTimeout(() => navigate(to), three ? 450 : 700);
       };
     ```
2. `app/routes/office.tsx`:
   - Delete the `walk` ref and the `if (walk.current.for !== pathname) …` line. Keep `prev` only if still used; if `prev` is now unused, delete it and its assignment in the `useLayoutEffect` too.
   - Remove `travelTime` from the `~/components/three/world` import.
   - Replace the arrival effect with:
     ```tsx
       useEffect(() => {
         if (!three) return setArrived(pathname);
         // land the page ~250ms before the camera stops, timed off the walk that's actually running
         const tr = world.travel;
         const remaining = tr ? tr.start + tr.duration * 1000 - performance.now() : 0;
         const id = window.setTimeout(() => setArrived(pathname), Math.max(0, remaining - 250));
         return () => window.clearTimeout(id);
       }, [pathname, three]);
     ```
     (`world` is already imported in this file.) This effect runs after the `useLayoutEffect` that calls `goTo(station)`, so `world.travel` is set by then.
   - Change the page wrapper's fade to `transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] }`. If plan 003 has landed and `app/lib/motion.ts` exists, use `ease.out` and `dur.page` from it instead of literals.
3. `app/components/three/world.ts`: if `travelTime` now has no importers (`grep -rn travelTime app`), delete it and its doc comment.

## Boundaries

- Do NOT change the camera curve, `plan()`, or `durationFor` (plan 001 owns those).
- Do NOT change the classic (CSS) Passage overlay.

## Verification

- **Mechanical**: `npm run typecheck`, `npm run build` pass.
- **Feel check** (desktop, `/tbc`):
  - Click "See the Work": the camera starts moving **on the click** (watch the doorways shift within a frame or two), the reply line shows, and the URL changes ~0.45s later without any restart or hitch in the walk.
  - The Work page text arrives just as the camera settles — not a beat after.
  - Use the floor plan to go room → room: the page still lands with the camera.
  - Mobile width (375px, CSS office): choosing an option starts the passage after ~0.7s.
- **Done when**: no visible dead time between click and motion, and pages arrive with the camera.
