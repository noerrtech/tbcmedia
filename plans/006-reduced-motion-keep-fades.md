# 006 — Reduced motion: drop movement, keep fades and colour

- **Status**: DONE (2026-10-09)
- **Commit**: b1e86b3 + uncommitted 3D-office working tree (2026-10-09)
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file, ~10 lines
- **Ordering**: after 000 (which also edits this media block)

## Problem

```css
/* app/app.css — inside @media (prefers-reduced-motion: reduce), current */
  *, *::before, *::after { transition-duration: 0.01ms !important; }
```

This turns **every** CSS transition into an instant snap — hover colour changes, the scrim fade,
focus feedback, the button fill — for people who asked for *less movement*, not *no feedback*.
Reduced motion means fewer and gentler animations, not zero.

## Target

Replace that one rule with targeted removals of movement only:

```css
@media (prefers-reduced-motion: reduce) {
  .grain::after, .animate-flicker, .animate-drift { animation: none; }
  /* movement off; colour, opacity and the fill wipe stay */
  .btn::before { transition: opacity var(--dur-fill) var(--ease-out); transform: scaleX(1); opacity: 0; }
  @media (hover: hover) and (pointer: fine) { .btn:hover::before { opacity: 1; } }
  .btn:focus-visible::before { opacity: 1; }
  .btn:active, .btn:hover .arrow { transform: none; }
}
```

(`--dur-fill` and `--ease-out` come from plan 003. If 003 hasn't landed, use `250ms` and
`cubic-bezier(0.23, 1, 0.32, 1)`.)

Framer Motion already handles JS animations via `<MotionConfig reducedMotion="user">` in
`app/root.tsx` (it removes transforms and keeps opacity) — leave it.

Tailwind `translate-*`/`scale-*` hover classes: wrap them with Tailwind's `motion-safe:` variant
where they move things — `RoomFooter.tsx:19` (`group-hover:translate-x-2` → `motion-safe:group-hover:translate-x-2`),
`Services.tsx:48` (`group-hover:translate-x-1` → `motion-safe:group-hover:translate-x-1`),
`Work.tsx:327` (`group-hover:scale-[1.015]` → `motion-safe:group-hover:scale-[1.015]`),
`FounderNote.tsx:51` (`hover:scale-110` → `motion-safe:hover:scale-110`),
`office.reception.tsx` option arrows (`group-hover:translate-x-1` → `motion-safe:group-hover:translate-x-1`, two places).

## Steps

1. In `app/app.css`, replace the reduced-motion block with the target.
2. Apply the `motion-safe:` prefixes listed above.

## Boundaries

- Do NOT change any non-reduced-motion styles.
- Do NOT touch `MotionConfig` or the 3D `still` handling.

## Verification

- **Mechanical**: `npm run build` passes.
- **Feel check**: DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, then:
  - Hover a `.btn`: it fades to filled (no wipe, no arrow nudge).
  - Hover a footer "Next room" link: colour still changes over ~¼s; the arrow doesn't move.
  - The scrim over the 3D still fades between levels.
  - Turn the emulation off: the wipe and nudges return.
- **Done when**: reduced motion removes movement only.
