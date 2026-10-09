# Motion & clarity plans

Written by `improve-animations` (Emil Kowalski's animation bar) plus a UX review of the 3D office.
Each plan is self-contained; run one with any agent ("execute `plans/NNN-….md`") or by hand.
Stamp: `b1e86b3` + the uncommitted 3D-office working tree of 2026-10-09.

| # | Plan | Severity | Selected by owner | Status |
|---|---|---|---|---|
| 000 | [Remove sound](000-remove-sound.md) | — | ✅ | DONE |
| 001 | [One walking pace; no detour between views of one room](001-consistent-walk-pace.md) | HIGH | ✅ | DONE |
| 002 | [Start the walk on click; land the page with the camera](002-start-walk-on-click.md) | HIGH | ✅ | DONE |
| 003 | [Shared motion tokens; fast hovers everywhere](003-hover-timing-tokens.md) | HIGH | ✅ | DONE |
| 004 | [Forward and back](004-forward-and-back.md) | MEDIUM | ✅ | DONE |
| 005 | [Faster, shared reveals](005-reveal-tokens.md) | MEDIUM | ✅ | DONE |
| 006 | [Reduced motion keeps fades](006-reduced-motion-keep-fades.md) | MEDIUM | ✅ | DONE |
| 007 | [Scrim follows scroll](007-scrim-follows-scroll.md) | MEDIUM | ✅ | DONE |
| 008 | [Industries: colour-only transition](008-industries-transition-all.md) | LOW | ✅ | DONE |
| 009 | [Menu opens in half a second](009-menu-open-speed.md) | LOW | ✅ | DONE |
| 010 | [Say it plainly: one name per room, the promise in the lobby](010-say-it-plainly.md) | HIGH | ✅ | DONE |
| 011 | [Calm the scene](011-calm-the-lobby.md) | MEDIUM | ✅ | DONE |
| 012 | [Walk the first time; cut on revisits](012-cut-on-revisits.md) | MEDIUM | ✅ | DONE |
| 013 | [Shorter Work room scroll](013-shorter-work-scroll.md) | MEDIUM | ✅ | DONE |
| 014 | [Clickable sooner](014-faster-first-click.md) | MEDIUM | ✅ | DONE |
| 015 | [Client feedback, round 2 (13 points)](015-client-feedback-round-2.md) | — | ⏳ | PLAN |

## Notes from execution (2026-10-09)

- 012: the room you *start* in doesn't count as walked, so the first return to the lobby still walks (and shows 004's step-back); after that, revisits cut.
- 010: the action-room eyebrow on the shared `Action` section ("The action room") was left as is — it also appears on the classic home page.
- Frame-rate checks this session were unreliable (the machine's GPU was busy with another Chrome process); behaviour was verified instead — see each plan's feel check before launch.

## Recommended order

1. **000** — removes the `play` calls other plans would otherwise edit around.
2. **003** — creates `app/lib/motion.ts` + CSS tokens that 002, 004, 005, 009 use.
3. **001 → 002 → 004** — all touch the room-change timing (`world.ts`, `office.tsx`, `OfficeCanvas.tsx`); run in this order.
4. **005, 006, 007, 008, 009** — independent of each other (006 after 000, as both edit the reduced-motion CSS block).
5. Proposed clarity set, if approved: **010** first (biggest comprehension gain), then **011, 014, 013**, then **012** (depends on 001/002, and reads 004's `direction` if present).

## Dependencies

- 002 depends on 000, 001
- 004 depends on 002, 003
- 005, 009 depend on 003
- 006 after 000
- 012 depends on 001, 002 (and 004 if done)
