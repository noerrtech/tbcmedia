# 010 — Say it plainly: one name per room, and what TBC does, in the lobby

- **Status**: DONE (2026-10-09)
- **Commit**: b1e86b3 + uncommitted 3D-office working tree (2026-10-09)
- **Severity**: HIGH (comprehension)
- **Category**: Navigation clarity / content hierarchy
- **Estimated scope**: 4 files, small

## Problem

A visitor arriving at `/tbc` has to decode three different naming systems at once, and is never
told what TBC does:

1. **Numbers disagree.** The concierge options are numbered 01–05 in their own order, the doorway
   plaques use the room-map numbers:
   - Option `02 · See the Work` → doorway `04 — The Work`
   - Option `03 · Explore What We Do` → doorway `03 — The Strategy Library`
   - Option `04 · TBC / JBN Offers` → doorway `05 — The JBN Room`
   (`app/content/site.ts:322–328` `receptionOptions`; `app/components/three/doors.ts:19–22` labels.)
2. **Names disagree.** "Explore What We Do" vs "The Strategy Library"; "TBC / JBN Offers" vs "The JBN Room".
   The header and floor plan use a third set (`rooms` in `site.ts:312–320`).
3. **No positioning.** The 3D lobby shows "TBC / The Brand Cappuccino" and the concierge's greeting —
   "We make brands grow." and "Brand strategy · Positioning · Growth" never appear in the office,
   so someone landing here directly (shared link, "Enter TBC" from the home page) sees a beautiful
   room but not the point.

## Target

- **Doorway plaques say exactly what the matching option says, with no numbers:**
  ```ts
  // app/components/three/doors.ts — target labels
  { key: "founder",  label: "Meet the Founder", … },
  { key: "work",     label: "See the Work", … },
  { key: "services", label: "What We Do", … },
  { key: "jbn",      label: "JBN Offer", … },
  ```
  and the front doorway in `app/components/three/LobbyScene.tsx` (`label="06 — The Action Room"`) → `label="Start a project"`.
- **Option cards drop their numbers** in the 3D bar layout (`app/routes/office.reception.tsx`, the `bar` branch of `Options`: remove the `{o.no}` span; keep the arrow). Option titles change to match the plaques: in `site.ts` `receptionOptions`, `"Explore What We Do"` → `"What We Do"`, `"TBC / JBN Offers"` → `"JBN Offer"`, `"I Know What I Need"` → `"Start a project"`. Bodies stay.
- **Room names in `rooms`** (header + floor plan) align: `"The Strategy Library"` → `"What We Do"`, `"The JBN Room"` → `"JBN Offer"`, `"The Action Room"` → `"Start a project"`. Keep `"The Founder's Room"`, `"Why TBC Exists"`, `"The Work"`, `"Reception"`.
- **Positioning line on arrival** — in the 3D reception overlay, above the speech bubble, a two-line
  title that fades out when the options appear:
  ```tsx
  // office.reception.tsx — inside the 3D branch, before the speech bubble
  <AnimatePresence>
    {!showOptions && (
      <motion.div
        className="absolute inset-x-0 top-[24%] text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] } }}
        exit={{ opacity: 0, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } }}
      >
        <p className="display text-4xl md:text-6xl">We make brands grow.</p>
        <p className="mt-3 text-[0.7rem] tracking-[0.34em] text-champagne uppercase">{brand.label}</p>
      </motion.div>
    )}
  </AnimatePresence>
  ```
  and keep the `<h1 className="sr-only">` but change it to `We make brands grow — The Brand Cappuccino reception`.

## Steps

1. Update the four labels in `doors.ts` and the front doorway label in `LobbyScene.tsx`.
2. Update `receptionOptions` titles and the three `rooms` names in `site.ts` as listed.
3. In `office.reception.tsx`: remove the number span in the bar layout; add the positioning block; update the sr-only h1.
4. `grep -rn "Strategy Library\|JBN Room\|Action Room" app` — update any remaining *visible* copy that names these rooms (page eyebrows such as `"Room 03 — The strategy library"` in `office.services.tsx` → `"What we do"`), but do NOT rename component names or routes.

## Boundaries

- Do NOT change routes/paths, component names, or the classic home page's section copy.
- Do NOT add new screens.

## Verification

- **Mechanical**: `npm run typecheck` passes.
- **Feel check** (desktop `/tbc`): within the first seconds you read "We make brands grow."; then the options appear and every option's title is literally written over a doorway. Hovering "See the Work" lights the doorway that says "See the Work". The header label on arrival in each room matches the option you picked.
- **Done when**: one name per room everywhere, no conflicting numbers, and the promise is on screen before the options.
