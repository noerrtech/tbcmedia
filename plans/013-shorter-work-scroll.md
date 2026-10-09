# 013 — Shorter Work room: less scrolling before the work

- **Status**: DONE (2026-10-09)
- **Commit**: b1e86b3 + uncommitted 3D-office working tree (2026-10-09)
- **Severity**: MEDIUM
- **Category**: Purpose & frequency (scroll-jacking)
- **Estimated scope**: 1 file, 3 values

## Problem

The Work room asks for **8.3 screen-heights** of scrolling for five title cards:

```tsx
// app/components/sections/WorkRoom3D.tsx:84 — the curtain track
        <section ref={curtain} className="relative h-[230vh]" aria-label="The work — the curtain">
// app/components/sections/WorkRoom3D.tsx:108 — the corridor track
        <section ref={corridor} className="relative" style={{ height: `${(work.length + 1) * 100}vh` }} …>
```

Long scroll-driven sequences are where audiences lose the thread: they scroll, the camera moves,
but the screens go by faster than they can be read in one direction and slower in the other.

## Target

- Curtain track: `h-[230vh]` → **`h-[150vh]`** (the curtain opens over ~½ screen of scroll).
- Corridor track: `${(work.length + 1) * 100}vh` → **`${work.length * 70 + 60}vh`** (410vh for five categories).
- Leave `openCurtain`/`goTo` math alone — it derives from the elements' real heights.

## Steps

1. Change the two values in `WorkRoom3D.tsx` exactly as above.

## Verification

- **Mechanical**: `npm run typecheck` passes.
- **Feel check**: from arrival, one confident scroll flick opens the curtain; each further flick brings the next screen to you; the category bar still highlights the screen you're facing; the five clicks on the category bar still land in front of each screen.
- **Done when**: the whole room scrolls through in about 5–6 screen-heights.
