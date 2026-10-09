# 015 — Client feedback, round 2 (review call, 2026-10-09)

- **Status**: PLAN — waiting on owner decisions (marked **DECIDE**)
- **Stamp**: `f31bc5a`
- **Source**: 12 points from the review of `tbc-preview.web.app/tbc/`, plus a 13th added afterwards (the headline)

Each point below says what the site does today, what we'd change and which files that touches. The
last two (fonts, story flow) are recommendations rather than fixes.

---

## Suggested order

| Phase | Points | Why this order | Size |
|---|---|---|---|
| 1 — Quick wins | 13 new headline, 7 audio, 8 "419M+" line, 10 rename, 5 smaller titles | Copy and CSS only. No decisions needed except the room name | S |
| 2 — Brand | 1 + 2 logo, 11 fonts | One decision: the logo's colours change the palette, so do fonts and logo together | M |
| 3 — Interaction | 3 clickable doors, 9 click-to-open curtain | Self-contained 3D work | M |
| 4 — Conversion | 4 booking with chapter + phone | Needs the backend decision | M |
| 5 — Narrative | 12 story flow, 6 the lady at reception | The biggest change. It re-orders rooms and sections, so do it once 1–4 are settled | L |

---

## 1. The exact logo where "TBC" is written in the lobby

**Today**: the sign behind the concierge desk is the word "TBC" in brass Cormorant, made of extruded 3D type
(`app/components/three/LobbyScene.tsx:127` `SignLetters`, plus the "THE BRAND CAPPUCCINO" line at `:155`).
That isn't the logo.

**Change**: replace it with the real speech-bubble logo as a lit sign on the walnut wall.
- Best build: logo **SVG** → three.js `SVGLoader` → one extruded layer per colour (yellow bubble, orange
  bubble, red-orange letter shadow, white letters). It stays sharp at any distance and has real depth, and
  it can be slightly emissive so it reads as a backlit acrylic sign.
- Fallback if there's no SVG: a high-res transparent PNG on a plane with a soft backlight.
- The same mark also replaces the line-drawn `BubbleMark` next to the concierge's speech bubble
  (`app/components/ui/Logo.tsx:28`).

**Need from you**: the master logo as **SVG / AI / PDF**, or failing that a PNG ≥ 2000 px with a transparent
background. Ideally also a **version for dark backgrounds** (white wordmark). The file in the repo
(`public/media/tbc-logo-color.png`) is only 512 px and has no wordmark.

**DECIDE: colour treatment.** The logo is bright yellow / orange. The site is dark walnut and champagne
gold. Options:
- **A (recommended)**: full-colour logo, and bring its yellow (#FBBC19) and orange (#F37C22) into the
  site as accent colours (buttons, door glow, highlights), so the logo looks like it belongs rather than
  pasted on.
- B: full-colour logo only; the rest of the palette stays as is. Quickest, but it will clash.
- C: exact logo *shape*, but in brass / single colour on the wall; full colour only in the header.

## 2. The logo in the header

**Today**: the header shows a typed "TBC" monogram plus "THE BRAND CAPPUCCINO" in small caps
(`Logo.tsx:17`). The same `Monogram` is also used on the home entrance (`Entrance.tsx:60`), the footer
(`Footer.tsx:10`) and the phone/CSS lobby (`office.reception.tsx:229`).

**Change**: one `<Logo>` component that renders the real mark (an inline SVG, ~36–40 px tall in the header)
plus the wordmark in ivory. Swap it in all four places, and regenerate `favicon.png` from the same file.

## 3. The doors should be clickable

**Today**: the four 3D arches have no pointer events (`app/components/three/Doorway.tsx`). Only the option
cards at the bottom are clickable; hovering a card lights its door (`office.reception.tsx:99` sets
`world.hovered`).

**Change**:
- Add `onPointerOver` / `onPointerOut` / `onClick` to each arch's opening and its label. Hovering lights
  the door and its matching card (the reverse of today's link) and sets `cursor: pointer`.
- A click calls the same `choose(to)` the cards use, so the walk, transition and back button behave exactly as
  they do now.
- Make the concierge desk clickable too, as "Start a project".
- The cards stay as the keyboard and screen-reader path. Phones get the CSS lobby, whose arches become real
  links.

## 4. Booking: chapter + phone, book an appointment, wait for confirmation on WhatsApp

**Today**: the JBN form asks for name, brand and Instagram, then opens a pre-filled WhatsApp chat that the
visitor has to send themselves (`app/components/sections/Jbn.tsx:55`). Every other "Book a consultation"
button just opens WhatsApp (`bookingLink` in `app/content/site.ts:39`). The site is static (Firebase
Hosting, prerendered) and has no backend.

**Change**: one **Book an appointment** form, used in the JBN room and behind every booking button:
- Fields: Name · **JBN chapter** · **Phone (WhatsApp)** with a +91 default and validation · Brand / business ·
  preferred day and time (optional).
- After submitting, a confirmation state: *"Request received. We'll confirm your slot on WhatsApp
  shortly."*

**DECIDE: where the request goes**
- **A (recommended)**: save to **Firestore** (the Firebase project `tbc-preview` already exists), with
  create-only security rules. TBC sees requests in the Firebase console or on a tiny admin page and confirms on
  WhatsApp. Bonus: the JBN "17 / 30 claimed" counter can count real claims instead of a number fixed at
  build time. An instant alert to TBC's phone or email needs a Cloud Function (Blaze plan).
- B: keep the pre-filled WhatsApp approach with the new fields. No backend, but the request only arrives if
  the visitor actually presses send in WhatsApp.
- C: Cal.com or Calendly with a phone field, for real calendar slots. Their confirmations are email or SMS;
  WhatsApp confirmations are a paid add-on.

**Need from you**: the list of **JBN chapters** (for a dropdown), and whether the chapter field shows only
for JBN visitors or for everyone.

## 5. Smaller titles everywhere

**Today**: headings go up to `text-8xl` (6 rem), `text-9xl` and fixed `14rem` / `10rem` / `9rem`. There are
about 40 call sites, each with its own size. `.display` is also all-caps (`app/app.css:57`), which makes
headings feel bigger still.

**Change**: a small type scale in `app/app.css`, used everywhere instead of one-off sizes:

| Token | Use | Max (desktop) | Was |
|---|---|---|---|
| `title-xl` | page / room h1 | ~4.5 rem | 6–8 rem |
| `title-lg` | section h2 | ~3.25 rem | 4.5–6 rem |
| `title-md` | card / sub-heads | ~2 rem | 2.25–3 rem |
| `stat` | the one big number (419M+) | ~9 rem | 14 rem |

The sizes scale with `clamp()`, so phones shrink in proportion. Recommended alongside this: **sentence-case
headings** instead of all-caps, which is warmer and closer to the concierge's conversational voice.

## 6. One lady on the home page

**DECIDE: what this means.** Our reading is that **the concierge desk on `/tbc` needs a person**. Today the
speech bubble *"Hi. Welcome to TBC. What brings you in today?"* floats over an empty desk. The other
reading is a single photo of a woman (e.g. Riya) on the classic home page `/`.

If it's the receptionist:
- **A (recommended)**: a real person (Riya or a team member) filmed or photographed against a plain
  background, cut out and placed behind the desk in the 3D scene. A 3–5 s idle loop (a nod and a smile) as a
  transparent WebM gives it life. It's the most believable option, and the bubble then visibly comes from her.
- B: a rigged 3D character. Heavier (5–15 MB) and at risk of looking uncanny next to the photoreal room.
- C: an illustrated or silhouette figure. Light, but it breaks the realism of the room.

## 7. Remove the audio completely

**Today**: the code has no sound. Plan 000 removed it (`app/lib/sound.ts` is gone, there are no `play()`
calls and there are no audio files in `public/`). If you heard sound on `tbc-preview.web.app`, that deploy is
older than the removal; **a redeploy fixes it**.

**Also**: the optional founder film (`FounderNote.tsx:38`) is set to `autoPlay` with sound. Change it to
start muted and only play on click, so nothing on the site ever makes a sound unasked. After building we'll
grep `build/` to confirm there are no audio files and no `Audio(` calls.

## 8. "419M+ views without a rupee spent on ads"

**Change**: add one content field `brand.proof = "419M+ views. Without a rupee spent on ads."` and use it:
- the Work room curtain (`Work.tsx:110` / `:236`, and the 3D brass text in `WorkHall.tsx:110`, which gets a
  second line)
- the stats in `site.ts:98, :106, :230` ("Organic views" → "Organic views · ₹0 on ads")
- as the **hook in the lobby** (see 12).

## 9. Click anywhere and the curtain opens

**Today**: the Work room curtain parts as you **scroll** (scrubbed to the scroll position:
`WorkRoom3D.tsx:32–40`, and the classic site's `Work.tsx:62`). There's also an "Open the curtain ↓" button.

**Change**:
- The curtain stays closed on arrival, with a quiet *"Click anywhere to open"* hint.
- A click or tap **anywhere**, Enter / Space, or a first scroll (so scroll users aren't stuck) plays a
  one-shot ~1.8 s opening: both halves gather to the sides and the 419M+ line rises.
- The corridor then scrolls as it does now. The 150 vh scroll track for the curtain goes away, which also
  shortens the page.
- With reduced motion, it's a fade.
- Same change in the 3D room and the classic site.

## 10. Rename "Why TBC exists"

**Change**: the room becomes **"Our Story"** (the route is already `/tbc/story`) and the section heading
becomes **"About TBC"**. Places to change: `site.ts:315`, `WhyTBC.tsx:51`, `office.story.tsx:7` (page
title), `home.tsx:37` ("Why TBC" eyebrow → "About us").

**DECIDE**: "Our Story" (recommended, because it's a story-led room), "About Us", or "The TBC Story".

## 11. Fonts: recommendation

**Today**: Cormorant Garamond (headlines, mostly Light and all-caps) + Manrope (body) + Pinyon Script
(the handwritten journey).

**The problem**:
- Cormorant is very thin and only works at huge sizes. Once titles shrink (point 5) it gets spindly and hard
  to read on screens.
- Pinyon is wedding-invitation calligraphy.
- Neither matches the logo, which is a round, friendly geometric sans (the wordmark looks like Poppins) with
  speech bubbles. The current type says "private bank", while the logo says "friendly conversation over
  coffee".

**Options** (all free, Google Fonts / Fontshare, self-hostable like today):

| | Headlines | Body / UI | Feel | Fit with the logo |
|---|---|---|---|---|
| **A (recommended)** | **Fraunces**, variable, *Soft* axis ~50 | **Manrope** (keep) | Warm, editorial, a little playful. Its soft round terminals echo the bubble logo | ★★★ |
| B | Fraunces | **Poppins** | Closest tie to the wordmark, more casual | ★★★ (Poppins is overused for long text) |
| C | **Instrument Serif** | **Inter Tight** | Modern, minimal, quieter luxury | ★★ |

- For the handwritten journey, replace Pinyon with **Caveat** (real handwriting, not calligraphy), or just use
  Fraunces italic.
- The 3D sign letters are generated from the headline font (`scripts/make-typeface.mjs`), so they follow
  whichever option you pick.

## 12. Story flow: recommendation

**What's wrong today**
- The lobby asks *"What brings you in today?"* straight away, with five equal choices. A first-time visitor
  hasn't been given a reason to care yet, or told what TBC is.
- The rooms are numbered 00–06, but walking them in order isn't a story:
  Founder → Why TBC → Services → Work → **JBN** → Start a project. The JBN offer, which is for a niche
  audience, interrupts the run-up to the main call to action.
- On the classic home page, the strongest assets come late: the founder and "About" come after Work, the
  numbers come after Industries, and testimonials come after JBN. The "Step inside the office" invite sits
  in the middle.

**Proposed spine**: the client is the hero, and TBC and Riya are the guide.

| # | Beat | What the visitor learns | Content we already have |
|---|---|---|---|
| 1 | **Hook** | "Why should I listen?" | 419M+ views, ₹0 on ads (point 8) |
| 2 | **Problem** | "That's me." | *Great businesses don't always become great brands.* |
| 3 | **Guide** | "Who's behind it, and can I trust them?" | Our Story + Riya: banker → founder, a 51k community, UC Berkeley, media |
| 4 | **Plan** | "What would working with you look like?" | **New**: 3 steps, Clarity → Positioning → Growth; the six services sit under them |
| 5 | **Proof** | "Has it worked for people like me?" | The Work corridor (by business problem) + testimonials, *together* |
| 6 | **Invitation** | "What do I do now?" | Book an appointment (point 4) → confirmed on WhatsApp |

**In the office (`/tbc`)**
- The concierge leads with the hook: *"Hi, welcome to TBC. We've driven 419M+ views without spending a
  rupee on ads. First time here?"*
- Two paths:
  - **"Show me around"** (the primary choice) walks the rooms in story order with a "Next room" at the end
    of each: Our Story → Founder → What We Do → The Work → Book a call.
  - **"I know where I'm going"** shows the doors and option cards as today.
- New room order: 00 Reception · 01 Our Story · 02 The Founder · 03 What We Do · 04 The Work · 05 Book a
  call. **JBN** keeps its door but drops out of the tour. JBN visitors arrive by a link (`/tbc?ref=jbn`) and
  the concierge greets them with *"Oh, you're here through JBN?"*
- Each room ends with a one-line bridge to the next, e.g. *"Now you know who's behind it — here's how we
  work →"*.

**On the classic home page (`/`)**: Hero with the hook → Problem → About / Our Story → Founder → How we work
(3 steps + services) → Work + numbers → Testimonials → Book an appointment → JBN band → Footer.
Industries folds into the Work section as a filter (or goes, until there's evidence for each one).

## 13. New headline: "We make brands that people remember."

**Today**: the headline is *"We make brands grow."* It appears in six places:
- `site.ts:12` (`brand.headline`)
- the home entrance, `Entrance.tsx:68`, set as two lines: "We make" / "brands grow."
- the lobby promise and its screen-reader h1, `office.reception.tsx:67` and `:81`
- the page title and the social share title, `root.tsx:15` and `:22`
- `README.md:3`

**Change**: replace it everywhere with *"We make brands that people remember."*
- Every place reads `brand.headline`, so it lives in one spot from now on.
- On the entrance it breaks as "We make brands" / "that people remember."
- It fits the story spine. "Remember" is the promise, and the 419M+ hook is the proof of it, so the lobby
  reads: headline → *"419M+ views. Without a rupee spent on ads."* → *"What brings you in?"*

**Worth checking**: the line under it, *"Brand Growth & Strategy"* (`brand.label`), is still about growth.
That's fine as a descriptor, but if you want it to echo the new headline, *"Brand Strategy · Positioning ·
Recall"* is one option.

---

## What we need from you to start

1. **Logo files**: SVG / AI / PDF, plus a dark-background version (points 1, 2)
2. **Logo colours**: A / B / C (point 1)
3. **Booking backend**: Firestore / WhatsApp pre-fill / Cal.com (point 4), and the **list of JBN chapters**
4. **"One lady"**: a receptionist at the desk, or a photo on the home page? If the receptionist, can we
   shoot Riya or a team member? (point 6)
5. **Room name**: Our Story / About Us / The TBC Story (point 10)
6. **Fonts**: A / B / C (point 11)
7. **Story flow**: approve the spine and the room re-order (point 12)

Phase 1 (the new headline, audio check, the 419M+ line, smaller titles, the rename) can start as soon as the room name is
picked.
