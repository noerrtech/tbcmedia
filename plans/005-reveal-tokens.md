# 005 — Faster, shared reveals so room content lands with the camera

- **Status**: DONE (2026-10-09)
- **Commit**: b1e86b3 + uncommitted 3D-office working tree (2026-10-09)
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens · Easing & duration · Performance
- **Estimated scope**: 8 files, value swaps
- **Depends on**: 003 (`app/lib/motion.ts`)

## Problem

Content reveals run 1.0–2.4 s with stacked delays, so a room's words finish appearing ~2 s after
the camera stops — the "laggy" half of laggy-vs-snappy. Each file also re-types its own easing.

| File:line | Current | Target |
|---|---|---|
| `app/components/ui/Reveal.tsx:4` | `const ease = [0.22, 1, 0.36, 1] as const;` | `import { dur, ease as easing, stagger as STAGGER } from "~/lib/motion";` and `const ease = easing.out;` |
| `app/components/ui/Reveal.tsx:9` | `y = 28,` | `y = 16,` |
| `app/components/ui/Reveal.tsx:23–26` | `initial={{ opacity: 0, y }}` / `whileInView={{ opacity: 1, y: 0 }}` / `transition={{ duration: 1.1, ease, delay }}` | `initial={{ opacity: 0, transform: \`translateY(${y}px)\` }}` / `whileInView={{ opacity: 1, transform: "translateY(0px)" }}` / `transition={{ duration: dur.reveal, ease, delay }}` |
| `app/components/ui/Reveal.tsx:37–39` (`lineChild`) | `hidden: { y: "110%", rotate: 2 }` · `show: { y: "0%", rotate: 0, transition: { duration: 1.2, ease } }` | `hidden: { transform: "translateY(110%) rotate(2deg)" }` · `show: { transform: "translateY(0%) rotate(0deg)", transition: { duration: dur.headline, ease } }` |
| `app/components/ui/Reveal.tsx:50` | `stagger = 0.12,` | `stagger = 0.08,` |
| `app/components/sections/Founder.tsx:27` (portrait) | `transition={{ duration: 1.6, ease }}` | `transition={{ duration: dur.headline, ease }}` |
| `app/components/sections/Founder.tsx:70` (journey steps) | `transition={{ delay: 0.6 + i * 0.18 }}` | `transition={{ delay: 0.3 + i * STAGGER, duration: dur.reveal, ease }}` |
| `app/components/sections/Action.tsx:26–29` | `initial={{ opacity: 0, y: 60 }}` · `whileInView={{ opacity: 1, y: 0 }}` · `transition={{ duration: 1.2, ease, delay: i * 0.15 }}` | `initial={{ opacity: 0, transform: "translateY(24px)" }}` · `whileInView={{ opacity: 1, transform: "translateY(0px)" }}` · `transition={{ duration: dur.reveal, ease, delay: i * 0.08 }}` |
| `app/components/sections/Services.tsx:14–17` | `initial={{ opacity: 0, y: 80 }}` · `whileInView={{ opacity: 1, y: 0 }}` · `transition={{ duration: 1.3, ease, delay: 0.1 + Math.abs(offset) * 0.12 }}` | `initial={{ opacity: 0, transform: "translateY(32px)" }}` · `whileInView={{ opacity: 1, transform: "translateY(0px)" }}` · `transition={{ duration: dur.headline, ease, delay: Math.abs(offset) * STAGGER }}` |
| `app/components/sections/Industries.tsx:47` | `transition={{ duration: 1, delay: i * 0.07 }}` | `transition={{ duration: dur.reveal, ease, delay: i * 0.04 }}` |
| `app/components/sections/WhyTBC.tsx:23` (line drawing) | `transition={{ duration: 2.4, ease: "easeInOut" }}` | `transition={{ duration: 1.4, ease: easing.inOut }}` |
| `app/components/sections/WhyTBC.tsx:32` (journey words) | `transition={{ delay: 0.4 + i * 0.35, duration: 0.8 }}` | `transition={{ delay: 0.2 + i * 0.12, duration: dur.reveal, ease }}` |
| `app/components/sections/Jbn.tsx:28` (progress ring) | `transition={{ duration: 2, ease, delay: 0.3 }}` | `transition={{ duration: 1.2, ease, delay: 0.2 }}` |
| `app/components/sections/Jbn.tsx:75–79` (h2) | animates `letterSpacing` `"0.3em"` → `"0.02em"` over 1.6 s | `initial={{ opacity: 0, transform: "translateY(16px)" }}` · `whileInView={{ opacity: 1, transform: "translateY(0px)" }}` · `transition={{ duration: dur.headline, ease }}` — letter-spacing is a layout property and re-lays the heading out every frame |

Notes:
- In each section file, import what you need from `~/lib/motion` (`dur`, `ease as easing`, `stagger as STAGGER`) and set the file's local `const ease` to `easing.out`, replacing its hand-typed `[0.22, 1, 0.36, 1]`. Where a file has no local `ease`, add `const ease = easing.out;`.
- `Founder.tsx:22` keeps `style={{ y }}` — that's a scroll-linked parallax motion value, not a tween; out of scope.

## Boundaries

- Do NOT change what animates (which elements, which order), only durations, delays, distances and easings listed.
- Do NOT touch the home `Entrance.tsx` hero (first-impression marketing moment — long is fine there).
- Do NOT touch `app/components/three/*`.

## Verification

- **Mechanical**: `npm run typecheck`, `npm run build` pass. `grep -rn "duration: 1\.[0-9]\|duration: 2" app/components/sections app/components/ui` shows only the WhyTBC line drawing (1.4) and the Jbn ring (1.2).
- **Feel check**:
  - Walk to the Founder's room: the name, roles and stats are fully in within ~1 s of the camera stopping.
  - Scroll the classic home page: sections arrive briskly, headlines still unmask line-by-line, nothing pops.
  - JBN heading: no letter-spacing "breathing"; it settles in like the others.
  - Rendering → reduced motion: everything visible immediately (MotionConfig `reducedMotion="user"` already drops the transforms).
- **Done when**: no content reveal in the office runs longer than 0.9 s (except the 1.4 s line drawing and 1.2 s ring).
