# 009 — Menu opens in half a second, items follow without waiting

- **Status**: DONE (2026-10-09)
- **Commit**: b1e86b3 + uncommitted 3D-office working tree (2026-10-09)
- **Severity**: LOW
- **Category**: Easing & duration
- **Estimated scope**: 1 file, ~6 lines
- **Depends on**: 003 (`app/lib/motion.ts`)

## Problem

The full-screen menu wipes down over 0.8 s, then its items only start at 0.3 s and 0.35 s, so the
first link is readable ~0.6 s after the click and the last ~0.9 s:

```tsx
// app/components/layout/Header.tsx — current
            transition={{ duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
…
                    <motion.li key={r.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
…
                    <motion.li key={l.href} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.05 }}>
```

## Target

```tsx
import { dur, ease } from "~/lib/motion";
…
            transition={{ duration: dur.menu, ease: ease.drawer }}            // 0.5s, cubic-bezier(0.32, 0.72, 0, 1)
…
  initial={{ opacity: 0, transform: "translateX(-12px)" }}
  animate={{ opacity: 1, transform: "translateX(0px)" }}
  transition={{ delay: 0.12 + i * 0.04, duration: 0.35, ease: ease.out }}     // rooms column
…
  initial={{ opacity: 0, transform: "translateX(-12px)" }}
  animate={{ opacity: 1, transform: "translateX(0px)" }}
  transition={{ delay: 0.16 + i * 0.04, duration: 0.35, ease: ease.out }}     // classic column
```

The exit keeps the same `clipPath` wipe but should be quicker than the entrance: add
`exit={{ clipPath: "inset(0 0 100% 0)", transition: { duration: 0.32, ease: ease.out } }}`
(replacing the current `exit` prop).

## Steps

1. Add the `~/lib/motion` import to `app/components/layout/Header.tsx`.
2. Replace the overlay's `transition` and `exit` as above.
3. Replace both `motion.li` `initial/animate/transition` sets as above.

## Boundaries

- Do NOT change the menu's content, layout or the clip-path shape.

## Verification

- **Mechanical**: `npm run typecheck` passes.
- **Feel check**: open the menu — the panel lands in half a second and the first link is readable as it lands; close it — it's gone in about a third of a second. Open/close rapidly: no stuck half-states (AnimatePresence retargets).
- **Done when**: the menu feels like a quick, deliberate sheet rather than a reveal.
