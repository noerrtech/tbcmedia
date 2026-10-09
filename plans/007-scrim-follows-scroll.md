# 007 — The darkening layer follows scroll instantly; it fades only between sections

- **Status**: DONE (2026-10-09)
- **Commit**: b1e86b3 + uncommitted 3D-office working tree (2026-10-09)
- **Severity**: MEDIUM
- **Category**: Performance / feel
- **Estimated scope**: 1 file, ~12 lines

## Problem

The scrim over the 3D world is updated every scroll frame, but it also carries a 700 ms CSS
transition, so it is always chasing a target that moved 16 ms ago — the darkening lags your
scroll, and the 3D behind the words looks like it's catching up:

```tsx
// app/routes/office.tsx:77–84, 97 — current
    const update = () => {
      raf = 0;
      const vh = window.innerHeight || 1;
      world.scroll = window.scrollY / vh;
      const base = station === "reception" ? 0 : 0.5 + 0.36 * Math.min(1, world.scroll);
      const level = world.scrimOverride ?? base;
      if (ref.current) ref.current.style.opacity = String(level);
    };
  …
  return <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[1] bg-ink transition-opacity duration-700 ease-out" />;
```

## Target

- Scroll-driven changes: **no transition** (the scroll itself is the animation; Lenis already smooths it).
- Discrete changes (a `ScrimZone` takes over or releases, or the room changes): a short fade,
  **300 ms** on the strong ease-out.

```tsx
// target
    const update = (fade: boolean) => {
      raf = 0;
      const vh = window.innerHeight || 1;
      world.scroll = window.scrollY / vh;
      const base = station === "reception" ? 0 : 0.5 + 0.36 * Math.min(1, world.scroll);
      const level = world.scrimOverride ?? base;
      const el = ref.current;
      if (!el) return;
      el.style.transition = fade ? "opacity 300ms cubic-bezier(0.23, 1, 0.32, 1)" : "none";
      el.style.opacity = String(level);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => update(false));
    };
    const onZone = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => update(true));
    };
    update(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("tbc:scrim", onZone);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("tbc:scrim", onZone);
    };
  …
  return <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[1] bg-ink" />;
```

## Steps

1. In `app/routes/office.tsx`, inside `Scrim`'s `useEffect`, replace `update`/`queue` and the listener wiring with the target.
2. Remove `transition-opacity duration-700 ease-out` from the scrim `div`'s className.

## Boundaries

- Do NOT change the scrim levels (0, 0.5→0.86, zone values) or `ScrimZone`.

## Verification

- **Mechanical**: `npm run typecheck` passes.
- **Feel check** (desktop): in the Founder's room scroll slowly — the room behind darkens in lock-step with the page, no trailing. In the Work room, cross from the curtain into the numbers section: the darkening fades over ~0.3 s; into the corridor it lightens over ~0.3 s.
- **Done when**: scrolling never shows the scrim lagging.
