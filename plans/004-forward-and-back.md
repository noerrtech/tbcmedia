# 004 — Forward and back: room changes that say which way you went

- **Status**: DONE (2026-10-09)
- **Commit**: b1e86b3 + uncommitted 3D-office working tree (2026-10-09)
- **Severity**: MEDIUM
- **Category**: Missed opportunity (spatial consistency) — owner request
- **Estimated scope**: 4 files, ~60 lines
- **Depends on**: 002 (arrival timing), 003 (`app/lib/motion.ts`)

> Keep this **quiet**. The owner's note: the office already risks feeling "too fancy". The direction
> cue must be felt, not noticed: 16 px of travel, no scale, no blur, no extra elements.

## Problem

Going deeper (Reception → Founder) and coming back (Founder → Reception, or the browser Back
button) look identical:

- **3D camera** — it always turns to face the way it's walking within the first 28% of the walk:
  ```ts
  // app/components/three/OfficeCanvas.tsx:106–107 — current
        const w1 = smooth(0, 0.28, u);
        const w2 = smooth(0.6, 1, u);
  ```
- **Page text** — the same plain fade in both directions (`app/routes/office.tsx`, the `motion.div` wrapping `{outlet}`).
- **CSS office (phones)** — `app/components/office/Passage.tsx` always rushes doorframes *toward* you (`scale: [0.15, 1, 5]`), and the old page exits with an ease-in curve:
  ```tsx
  // app/routes/office.tsx — current (classic branch of exit)
  { opacity: 0, scale: 1.08, transition: { duration: 0.4, ease: [0.7, 0, 0.84, 0] } }
  ```

## Target

**Direction rule** (one place, `app/routes/office.tsx`): walking order is `rooms` in
`app/content/site.ts` (Reception = 0 … Action room = 6).
- Browser Back/Forward (`useNavigationType() === "POP"`) → `"back"`.
- Otherwise → `"forward"` if the new room's index ≥ the old one's, else `"back"`.

**3D camera** — on `"back"`, back out of the room a step before turning around:
```ts
// OfficeCanvas.tsx — target
      const w1 = tr.direction === "back" ? smooth(0.15, 0.45, u) : smooth(0, 0.28, u);
      const w2 = smooth(0.6, 1, u);
```

**Page text** — 16 px of travel in the direction of the move, using the tokens from plan 003:
```tsx
// office.tsx — the wrapper around {outlet} (3D) and the motion.main (CSS office)
initial:  { opacity: 0, transform: `translateY(${direction === "back" ? -16 : 16}px)` }
animate:  { opacity: 1, transform: "translateY(0px)", transition: { duration: dur.page, ease: ease.out } }
exit:     { opacity: 0, transform: `translateY(${direction === "back" ? 8 : -8}px)`, transition: { duration: dur.exit, ease: ease.out } }
```
Forward: text rises from below (deeper) and the old page lifts away. Back: text settles from above.
Use the full `transform` string, not Framer's `y` shorthand (main-thread cost alongside WebGL).

**CSS office Passage** — on `"back"`, the doorframes recede instead of rushing at you:
`scale: [5, 1, 0.15]`, `opacity: [0, 1, 0]`, frame `delay: (5 - i) * 0.09`; streaks
`scaleX: [1, 0]`. Forward stays exactly as it is.

**Reduced motion** — drop the translate (opacity only); the camera already jumps without walking.

## Steps

1. `app/components/three/world.ts`:
   - Add `export type Direction = "forward" | "back";`
   - Add `direction: Direction;` to the `Travel` type.
   - Change `export function goTo(to: StationKey)` to `export function goTo(to: StationKey, direction: Direction = "forward")` and set `direction` in the `world.travel = { … }` object.
2. `app/components/three/OfficeCanvas.tsx`: replace the `w1` line with the target.
3. `app/routes/office.tsx`:
   - Import `useNavigationType` from `react-router`, `rooms` from `~/content/site`, `ease, dur` from `~/lib/motion`, and `useReducedMotion` from `framer-motion`.
   - Track the previous pathname in a ref; compute `direction` during render with the rule above (index via `rooms.findIndex((r) => r.path === path)`; treat unknown as 0). Store it in a ref keyed by pathname so it's stable across re-renders for that route.
   - Pass it to the walk: `goTo(station, direction)` in the existing `useLayoutEffect`. (Plan 002's click-time `goTo` from reception is always forward, which is correct.)
   - Apply the target `initial/animate/exit` to the 3D page wrapper and to the CSS-office `motion.main` (replace its `scale` values and the `[0.7, 0, 0.84, 0]` exit). Because the exiting page needs the *new* direction, pass `custom={direction}` to `AnimatePresence` and to `motion.main`, and write the variants as functions of `custom`.
   - If `useReducedMotion()` is true, use `"translateY(0px)"` everywhere (opacity only).
   - Pass `direction` to `<Passage direction={direction} />`.
4. `app/components/office/Passage.tsx`: accept `direction: "forward" | "back"`; when `"back"`, use the reversed frame/streak values from the target. Leave everything else as is.

## Boundaries

- Do NOT add arrows, labels, sounds or any new on-screen element.
- Do NOT change walk durations, routes, or stations.
- Do NOT use `y`/`scale` motion shorthands — transform strings only.

## Verification

- **Mechanical**: `npm run typecheck`, `npm run build` pass.
- **Feel check** (desktop `/tbc`):
  - Reception → Founder: camera faces forward and walks in; the Founder text rises ~16 px as it fades in.
  - Press the browser Back button: the camera steps backward out of the cabin (still facing the desk for a moment), then turns toward the lobby; the reception overlay settles from above.
  - Founder → Strategy Library via the floor plan (higher index): forward. Library → Founder: back.
  - At 10% playback (DevTools → Animations): the text travel is small enough that it reads as a settle, not a slide.
  - Phone width (375px, CSS office): forward rushes frames toward you; Back recedes them.
  - Rendering → `prefers-reduced-motion: reduce`: text fades only, no travel.
- **Done when**: every room change has a direction you can feel, and none you can point at.
