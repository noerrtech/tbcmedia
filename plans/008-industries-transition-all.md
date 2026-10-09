# 008 — Industries tile: animate the colour only

- **Status**: DONE (2026-10-09)
- **Commit**: b1e86b3 + uncommitted 3D-office working tree (2026-10-09)
- **Severity**: LOW
- **Category**: Performance
- **Estimated scope**: 1 file, 1 line

## Problem

```tsx
// app/components/sections/Industries.tsx:51 — current
<span aria-hidden className="absolute right-4 bottom-3 font-display text-[7rem] leading-none text-ivory/[0.04] transition-all duration-700 group-hover:text-champagne/10 md:text-[10rem]">
```

`transition-all` on a 7–10rem glyph animates every property that changes (including font-size
across the `md:` breakpoint on resize) for 700 ms, off the GPU. Only the colour should animate.

## Target

```tsx
<span aria-hidden className="absolute right-4 bottom-3 font-display text-[7rem] leading-none text-ivory/[0.04] transition-colors duration-250 group-hover:text-champagne/10 md:text-[10rem]">
```

## Steps

1. Replace `transition-all duration-700` with `transition-colors duration-250` on that line. Nothing else.

## Verification

- **Mechanical**: `grep -rn "transition-all" app` returns nothing.
- **Feel check**: hover an industry tile on the home page — the big background numeral warms in ~¼s, matching the tile's other hover effects (plan 003 sets those to 250 ms).
- **Done when**: no `transition-all` remains in the app.
