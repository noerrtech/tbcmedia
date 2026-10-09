# 014 — Clickable sooner: shorter walk-in, options after one beat

- **Status**: DONE (2026-10-09)
- **Commit**: b1e86b3 + uncommitted 3D-office working tree (2026-10-09)
- **Severity**: MEDIUM
- **Category**: Purpose & frequency
- **Estimated scope**: 2 files, 3 values

## Problem

After the world loads, a first-time visitor waits ~3.4 s for the walk-in and 2.6 s for the
options, plus the typed greeting — about **4 seconds** of watching before they can do anything
(the doc's "CEO at 11:30 PM" wants the point in under a minute, and the first click in seconds).

```ts
// app/components/three/OfficeCanvas.tsx:18
const INTRO = 3.4; // s — the slow walk in from the street
```
```ts
// app/routes/office.reception.tsx:32–33
    const a = window.setTimeout(() => setLine("Hi. Welcome to TBC. What brings you in today?"), 1700);
    const b = window.setTimeout(() => setShowOptions(true), 2600);
```

## Target

- `INTRO = 3.4` → **`2.2`** (still an ease-out arrival, just decisive).
- Second greeting line at **900 ms**, options at **1400 ms**.
- (Plan 011 also speeds the typewriter to 16 ms/char; with both, the question is fully typed by ~1.6 s and the options are already there.)

## Steps

1. `OfficeCanvas.tsx:18`: `const INTRO = 2.2; // s — the walk in from the street`.
2. `office.reception.tsx:32–33`: change `1700` → `900` and `2600` → `1400`.

## Verification

- **Mechanical**: `npm run typecheck` passes.
- **Feel check**: reload `/tbc` — the camera arrives with purpose and the five options are on screen ~1.5 s after the lights come on; the options appear while the camera is still settling, not after a pause.
- **Done when**: first option clickable within ~1.5 s of the world appearing.
