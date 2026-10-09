# 011 — Calm the scene: one thing moving at a time

- **Status**: DONE (2026-10-09)
- **Commit**: b1e86b3 + uncommitted 3D-office working tree (2026-10-09)
- **Severity**: MEDIUM
- **Category**: Purpose & frequency (excessive motion)
- **Estimated scope**: 3 files, value swaps

## Problem

At rest in the lobby, five things move or shimmer at once, none of which tells the visitor anything:

| What | Where | Current |
|---|---|---|
| Camera follows the mouse | `app/components/three/OfficeCanvas.tsx:147–149` | `amt = key === "reception" ? 1 : 0.4`; drift `pointer.x * 0.35`, `pointer.y * 0.12` |
| Floating dust | `app/components/three/LobbyScene.tsx:323` | `<Sparkles count={70} … opacity={0.35} />` |
| Animated film grain over the whole page, on top of the 3D | `app/root.tsx:36` `<body className="grain">` + `app/app.css` `.grain::after { animation: grain 1.2s steps(6) infinite; }` |
| Glow bloom on every bright point | `OfficeCanvas.tsx:253` | `<Bloom … intensity={0.75} />` |
| Typing cursor + typewriter greeting | `app/components/office/Concierge.tsx:6` | `speed = 28` ms/char |

Guideline: animate 1–2 key elements per view. In the lobby the key motion is the doorway that
lights up for the option you're considering — everything else should hold still.

## Target

- Mouse drift: lobby `amt` 1 → **0.35**, rooms 0.4 → **0** (rooms are for reading).
- Dust: delete the `<Sparkles … />` line (and its import if unused).
- Grain: keep it on the classic site, drop it in the 3D office — in `app/routes/office.tsx`, when `three` is true add `document.body.classList.remove("grain")` in an effect and restore it on cleanup.
- Bloom: `intensity={0.75}` → **`0.45`**.
- Typewriter: `speed = 28` → **`16`** (the line finishes in ~0.7 s instead of ~1.3 s).

## Steps

1. `OfficeCanvas.tsx`: change `const amt = key === "reception" ? 1 : 0.4;` to `const amt = key === "reception" ? 0.35 : 0;` and the Bloom intensity to `0.45`.
2. `LobbyScene.tsx`: delete the `<Sparkles … />` element; remove `Sparkles` from the drei import if nothing else uses it.
3. `office.tsx`: add
   ```tsx
     useEffect(() => {
       if (!three) return;
       document.body.classList.remove("grain");
       return () => document.body.classList.add("grain");
     }, [three]);
   ```
4. `Concierge.tsx`: change the default `speed = 28` to `speed = 16`.

## Boundaries

- Do NOT remove the pendants' flicker-on (it's a one-time arrival moment), the doorway hover glow, or the curtain/corridor.

## Verification

- **Mechanical**: `npm run typecheck` passes.
- **Feel check**: sit in the lobby for 10 seconds without touching anything — nothing should draw your eye except the words. Move the mouse — the room shifts only slightly. Hover an option — its doorway is now clearly the brightest thing moving.
- **Done when**: at rest, the lobby is still.
