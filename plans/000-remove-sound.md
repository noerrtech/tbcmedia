# 000 — Remove sound from the office

- **Status**: DONE (2026-10-09)
- **Commit**: b1e86b3 + uncommitted 3D-office working tree (2026-10-09). Line numbers below are from that working tree.
- **Severity**: — (owner request, not a motion finding)
- **Category**: Scope
- **Estimated scope**: 1 file deleted, 5 files edited, 1 folder deleted, ~60 lines removed

## Problem

The owner wants no sound on the site. Today there is a room-tone loop, three one-shot cues and
a header toggle, and the tone is **on by default**:

```ts
// app/lib/sound.ts:16 — current
let enabled = true; // the default; restoreSound() applies the remembered choice
```

Sound is wired in from four places:

```tsx
// app/components/layout/Header.tsx:6
import { restoreSound, setSound, useSoundOn } from "~/lib/sound";
// app/components/layout/Header.tsx:8–29 — the whole SoundToggle() component
// app/components/layout/Header.tsx:90–95 — current
              <>
                <SoundToggle />
                <Link to="/" className="hidden text-[0.65rem] tracking-[0.28em] text-champagne uppercase sm:block link-underline">
                  Classic site
                </Link>
              </>
```

```tsx
// app/routes/office.reception.tsx:11
import { play } from "~/lib/sound";
// app/routes/office.reception.tsx:56–57
    play("footsteps", 0.45);
    window.setTimeout(() => play("door", 0.4), three ? 500 : 750);
```

```tsx
// app/components/three/Rooms.tsx:6
import { play } from "~/lib/sound";
// app/components/three/Rooms.tsx:335 (inside JbnScreen's useFrame)
      play("crt", 0.35);
```

```css
/* app/app.css:246–256 — the sound-bar block */
/* Sound toggle bars */
.sound-bar { … }
.sound-bar.is-on { animation: sound-bar 1.05s ease-in-out infinite alternate; }
@keyframes sound-bar { … }
/* app/app.css:268–269 — inside @media (prefers-reduced-motion: reduce) */
  .grain::after, .animate-flicker, .animate-drift, .sound-bar.is-on { animation: none; }
  .sound-bar.is-on { transform: scaleY(0.7); }
```

## Target

No audio code, no audio files shipped, no toggle in the header. The JBN screen still powers on
visually (its CRT animation stays — only the `play` call goes).

## Steps

1. Delete `app/lib/sound.ts`.
2. `app/components/layout/Header.tsx`:
   - Delete line 6 (the `~/lib/sound` import).
   - Delete the `SoundToggle` function and its doc comment (lines 8–29).
   - Replace the fragment at lines 90–95 with just the link:
     ```tsx
                 <Link to="/" className="hidden text-[0.65rem] tracking-[0.28em] text-champagne uppercase sm:block link-underline">
                   Classic site
                 </Link>
     ```
   - Keep the `useEffect` import — `Header` itself still uses it.
3. `app/routes/office.reception.tsx`: delete line 11 (import) and lines 56–57 (the two `play` lines). Leave the rest of `choose` as is.
4. `app/components/three/Rooms.tsx`: delete line 6 (import) and line 335 (`play("crt", 0.35);`). Keep `s.on = true; s.t0 = performance.now();` around it.
5. `app/app.css`: delete the whole "Sound toggle bars" block (comment, `.sound-bar`, `.sound-bar.is-on`, `@keyframes sound-bar`). In the reduced-motion block change line 268 to
   ```css
     .grain::after, .animate-flicker, .animate-drift { animation: none; }
   ```
   and delete line 269.
6. Delete the folder `public/assets/audio/`.
7. `scripts/prepare-assets.sh`: delete the block that starts `# --- sound (Freesound, CC0)` through the last `ffmpeg … footsteps-marble.m4a` line, and remove `AUDIO="$OUT/audio"`, `"$AUDIO"` from the `mkdir -p` line, and `"$AUDIO"` from the final `du -sh` line.
8. `README.md`: delete the table row starting `| Lobby tone, CRT, door, footsteps |` and the sentence beginning `Room sound is **on by default**`.

## Boundaries

- Do NOT touch the JBN screen's power-on animation, the concierge, or any other motion.
- Do NOT delete the source `.wav` files in `~/Downloads`.
- If a quoted line isn't where this plan says, STOP and report.

## Verification

- **Mechanical**: `npm run typecheck` passes; `grep -rn "sound" app` returns nothing about audio; `npm run build` succeeds.
- **Feel check**: open `/tbc` on desktop — the header shows only "Classic site" and the menu; choose "TBC / JBN Offers" — the screen still flickers on, silently.
- **Done when**: no `Audio(` and no `~/lib/sound` imports remain, and `public/assets/audio` is gone.
