# 003 — Shared motion tokens, and fast hovers everywhere

- **Status**: DONE (2026-10-09)
- **Commit**: b1e86b3 + uncommitted 3D-office working tree (2026-10-09)
- **Severity**: HIGH
- **Category**: Easing & duration · Cohesion & tokens
- **Estimated scope**: 1 new file, 9 files edited, mostly class/duration swaps
- **Blocks**: 004, 005, 009 (they import the tokens created here)

## Problem

Hover feedback — hit tens of times per visit — runs 500–700 ms in most places but 200 ms on the
reception options, so the site feels sluggish in some spots and snappy in others. There are also
no shared motion tokens: `[0.22, 1, 0.36, 1]` is hand-typed in ~10 files.

```css
/* app/app.css — current */
:104  .btn { … transition: color 0.5s var(--ease-soft), border-color 0.5s var(--ease-soft); }
:114  .btn::before { … transition: transform 0.6s var(--ease-cinema); }
:107  .btn:hover { color: var(--color-ink); border-color: var(--color-champagne); }
:111  .btn:hover::before { transform: scaleX(1); transform-origin: left; }
:133  .btn .arrow { transition: transform 0.5s var(--ease-soft); }
:136  .btn:hover .arrow { transform: translateX(4px); }
:144  .link-underline { … transition: background-size 0.5s var(--ease-soft); }
:146  .link-underline:hover { background-size: 100% 1px; }
```

Slow Tailwind hover durations (verbatim class fragments):

| File:line | Current | Target |
|---|---|---|
| `app/components/office/RoomFooter.tsx:15` | `transition-opacity duration-700` | `transition-opacity duration-250` |
| `app/components/office/RoomFooter.tsx:17` | `transition-colors duration-500` | `transition-colors duration-200` |
| `app/components/office/RoomFooter.tsx:19` | `transition-transform duration-500` | `transition-transform duration-200` |
| `app/components/sections/Services.tsx:42` | `transition-opacity duration-700` | `transition-opacity duration-250` |
| `app/components/sections/Services.tsx:48` | `transition-transform duration-500` | `transition-transform duration-200` |
| `app/components/sections/Action.tsx:38` | `transition-opacity duration-700` | `transition-opacity duration-250` |
| `app/components/sections/Action.tsx:39` | `transition-colors duration-700` | `transition-colors duration-250` |
| `app/components/sections/Industries.tsx:36` | `transition-opacity duration-500` | `transition-opacity duration-250` |
| `app/components/sections/Industries.tsx:56` | `transition-transform duration-700` | `transition-transform duration-250` |
| `app/components/sections/Work.tsx:327` | `transition-transform duration-700` | `transition-transform duration-250` |
| `app/components/sections/FounderNote.tsx:51` | `transition-transform duration-500` | `transition-transform duration-200` |
| `app/components/layout/Header.tsx:104` and `:105` | `transition-transform duration-500` | `transition-transform duration-200` |

(`Industries.tsx:51` is handled by plan 008 — leave it.)

## Target

**CSS tokens** — add inside the existing `@theme { … }` block in `app/app.css` (after `--ease-soft`):

```css
  /* Motion tokens (Emil Kowalski's values) */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);       /* strong ease-out for UI */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* on-screen movement */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);    /* menus, sheets */
  --default-transition-timing-function: var(--ease-out);  /* every Tailwind transition-* class */
  --dur-hover: 200ms;   /* colour / arrow nudges */
  --dur-fill: 250ms;    /* button fills, underline draws, glows */
```

(In Tailwind v4, `--ease-out` replaces the built-in `ease-out` utility with this stronger curve,
and `--default-transition-timing-function` sets the curve for every `transition-*` class. Tailwind
v4's `hover:` variant is already gated to `@media (hover: hover)`, so the Tailwind classes need no
extra gating.)

**Custom CSS** — replace the `.btn` / `.link-underline` motion rules:

```css
  .btn { … transition: color var(--dur-fill) var(--ease-out), border-color var(--dur-fill) var(--ease-out), transform 160ms var(--ease-out); }
  .btn::before { … transition: transform var(--dur-fill) var(--ease-out); }
  .btn .arrow { transition: transform var(--dur-hover) var(--ease-out); }
  .link-underline { … transition: background-size var(--dur-fill) var(--ease-out); }

  @media (hover: hover) and (pointer: fine) {
    .btn:hover { color: var(--color-ink); border-color: var(--color-champagne); }
    .btn:hover::before { transform: scaleX(1); transform-origin: left; }
    .btn:hover .arrow { transform: translateX(4px); }
    .link-underline:hover { background-size: 100% 1px; }
  }
  /* keyboard users get the same state */
  .btn:focus-visible { color: var(--color-ink); border-color: var(--color-champagne); }
  .btn:focus-visible::before { transform: scaleX(1); transform-origin: left; }
  .link-underline:focus-visible { background-size: 100% 1px; }
  /* press feedback (its transition is in the .btn list above, so colour transitions keep working) */
  .btn:active { transform: scale(0.97); }
```

Keep every non-motion declaration of these rules exactly as it is.

**TS tokens** — new file `app/lib/motion.ts` (used by plans 002, 004, 005, 009):

```ts
/** Shared motion values — the JS twin of the tokens in app.css. */
export const ease = {
  out: [0.23, 1, 0.32, 1],
  inOut: [0.77, 0, 0.175, 1],
  drawer: [0.32, 0.72, 0, 1],
} as const;

/** Durations in seconds. */
export const dur = {
  hover: 0.2,
  press: 0.16,
  exit: 0.25,
  page: 0.45,
  reveal: 0.7,
  headline: 0.9,
  menu: 0.5,
} as const;

/** Gap between items in a staggered entrance, seconds. */
export const stagger = 0.06;
```

## Steps

1. Add the CSS tokens to `@theme` in `app/app.css`.
2. Rewrite the `.btn`, `.btn::before`, `.btn .arrow`, `.link-underline` transition declarations and move the four `:hover` rules into the `@media (hover: hover) and (pointer: fine)` block shown above; add the `:focus-visible` and `:active` rules. Do not change colours, padding, or any other property.
3. Apply every class swap in the table above, exactly.
4. Create `app/lib/motion.ts` with the content above.

## Boundaries

- Do NOT change `--ease-cinema` or `--ease-soft` (other code still uses them; plan 005 migrates JS easings).
- Do NOT touch the `Services.tsx:30` `whileHover` spring or any `motion.*` props.
- Do NOT touch `Industries.tsx:51` (plan 008).

## Verification

- **Mechanical**: `npm run typecheck`, `npm run build` pass. `grep -rn "duration-500\|duration-700" app` lists no hover classes from the table.
- **Feel check**:
  - Hover "Book a consultation" on the home page: the fill wipes across in ~¼s, not ½s; the arrow nudges in ~⅕s.
  - Hover the "Next room" footer link in any room and an Industries tile: glows and underlines respond immediately and match the reception option cards.
  - Press and hold a `.btn`: it dips to 97%; release returns it.
  - Tab to a `.btn` with the keyboard: it shows the filled state.
  - DevTools → Rendering → emulate a touch device: tapping a button doesn't leave it stuck "hovered".
- **Done when**: every hover in the site lands within 250 ms on the same strong ease-out.
