# The Brand Cappuccino — website

**We make brands that people remember.** The marketing site for TBC (Brand Growth & Strategy).

The site has two ways in, as in the brief:

| Experience | Route | What it is |
|---|---|---|
| **A — Interactive office** | `/tbc` → rooms | Walk into the TBC lobby, the concierge asks *"What brings you in today?"*, and each answer takes you through a passage transition into a room. |
| **B — Traditional site** | `/` | The entrance screen, then one considered scroll: Why TBC → What we do → Industries → Results → Work → About → Founder → JBN → Testimonials → CTA. |

### The rooms

| Room | Route | Highlights |
|---|---|---|
| 00 Reception | `/tbc` | Pendant lights come on, concierge speech bubble types out, five options. |
| 01 The Founder's Room | `/tbc/founder` | Riya's portrait, journey, proof numbers, credibility, philosophy, consultation CTA. |
| 02 Why TBC Exists | `/tbc/story` | Handwritten journey, the TBC Way, founder's note (video-ready), testimonials. |
| 03 The Strategy Library | `/tbc/services` | Six floating backlit panels that open into detail; capabilities; industries. |
| 04 The Work | `/tbc/work` | Velvet curtain with 419M+ parts on scroll → impact wall → **3D corridor** of screens organised by business problem. |
| 05 The JBN Room | `/tbc/jbn` | "Oh, you're here through JBN?", big screen, live claimed counter, claim form. |
| 06 The Action Room | `/tbc/next` | Three lit doorways: building / growing / strategic reset. |

## Stack

- **React Router v7 (framework mode)** — the successor to Remix; SSR, loaders, nested routes.
- **Framer Motion** — room transitions, reveals, shared-element service panels, concierge.
- **GSAP + ScrollTrigger** — scroll-scrubbed curtain, 3D corridor camera, pinned work gallery, word highlight.
- **Lenis** — smooth scrolling, driven by the GSAP ticker.
- **three.js + React Three Fiber + drei + postprocessing** — the real-time 3D office (desktop only, lazy-loaded).

### The 3D office: one world

On desktop, `/tbc` and every room are **one persistent 3D building** (`app/components/three/`). The
canvas lives in the office layout (`app/routes/office.tsx`) and never unloads; each route is a
camera *station* (`world.ts`). Changing room walks the camera from wherever it is, out through the
doorway, across the lobby and into the next room — the page's words fade out as it sets off and
in as it arrives. Doorways are real openings cut through the walls (`cutMaterial`).

| Room | Where it is | 3D |
|---|---|---|
| Reception | the lobby | fluted walnut, brass sign, concierge desk, pendants, lounges |
| Founder / Why TBC Exists | behind the back-right door | the cabin: desk, lamp, chairs, dusk window |
| Strategy library | through the left wall | shelves of ~3,000 books, six floating panels |
| The Work | behind the back-left door | velvet curtain (cloth shader) that parts on scroll, 419M+ in brass rising into the loft, then a corridor of screens you walk down on scroll |
| JBN | through the right wall | a screening room whose screen powers on as you arrive |
| Action room | behind you, through the entrance | three lit doorways |

Phones, no-WebGL2, data-saver, a failed load, or 15s of visible waiting get the CSS rooms instead.
- **Tailwind CSS v4** — design tokens live in `app/app.css` (`@theme`).

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run build && npm start   # production server on :3000
```

Node 20+. `react-router.config.ts` is set to `ssr: false, prerender: true`, so `npm run build`
produces a static site in `build/client` — host it on any static host. (`npm start` expects a
server build, so it only applies if SSR is turned back on.)

### Environment

| Var | Purpose |
|---|---|
| `JBN_CLAIMED` | How many JBN audits are claimed (drives the counter). Default `17`. With prerendering it's read **at build time** — rebuild to update it. |

## Tests

```bash
npm test                      # gradient design rules + the Growth Line station maths
npm run build && npx serve build/client -l 4173 &   # any static server
E2E_URL=http://localhost:4173 npm run test:e2e      # rendered check: every text over a gradient reads at 4.5 : 1
```

`test:e2e` uses Playwright's Chromium (`npx playwright install chromium` once, or set `CHROMIUM_PATH`).

## Editing content

**Every word, number and link is in [`app/content/site.ts`](app/content/site.ts).** Nothing needs
to be changed in components to update copy.

Items marked `TODO(confirm)` there must be checked before launch:

- [ ] Consultation price (`founder.consultationRate`) — the price line is hidden while it's empty.
- [ ] "35+ industries" stat and the list of industries.
- [ ] Real case studies for the five work categories (`work[].items`, add `image` to show footage on the screens).
- [ ] Real client testimonials — the current three are marked **Placeholder** on the page.

Settled: founder name is **Riya Nanavati**; the JBN offer is for the **first 30**; booking buttons
open a pre-filled **WhatsApp** chat (set `contact.bookingUrl` to switch to Calendly); all media
features in `featuredIn` are **confirmed**.

### Media

Drop files in `public/media/`:

| File | Used for |
|---|---|
| `founder.webp` | Riya's cut-out portrait (extracted from the TBC profile). |
| `team.webp` | Team photo (from the TBC profile). |
| `founder-note.mp4` | *(optional)* Founder's message film — then set `founder.note.video`. |
| case-study images | Referenced from `work[].items[].image`. |

## Accessibility & performance

- `prefers-reduced-motion` turns off smooth scroll, passage transitions, grain and drift.
- Every interactive room has a plain route, real links and keyboard-reachable controls.
- The 3D lobby loads only on desktop with WebGL2 (and not on data-saver). Phones, older machines,
  a failed load, or 15s of visible waiting all fall back to the CSS lobby. The 3D bundle is a
  separate chunk the classic site never downloads.
- Reduced motion: the 3D lobby renders still — no walk-in, no drift, no walk to the door.

## 3D office assets

Source files live outside the repo (in `~/Downloads`); `scripts/prepare-assets.sh` builds web
working copies into `public/assets/` and `public/fonts/`. Re-run it after swapping a source file:

```bash
SRC=~/Downloads bash scripts/prepare-assets.sh
```

These are **2K working copies** for building the look — the final compression pass (KTX2
textures, smaller HDRIs, Meshopt) comes later. The 3D lettering font is generated with
`node scripts/make-typeface.mjs <font.ttf> <out.json>`.

| Asset | Source | License |
|---|---|---|
| Walnut veneers, marble, HDRIs | Poly Haven | CC0 |
| Armchairs, ceiling lamp, brass vase | Poly Haven (`.blend` → `.glb` via `scripts/blend-to-glb.py`) | CC0 |
| Stage curtain (Work room) | "Curtain Cortina 3.0 NEW" by [RomanSn](https://sketchfab.com/romansn) on [Sketchfab](https://sketchfab.com/3d-models/curtain-cortina-30-new-23a77fa61ca0499cbf940aa0f33b06b4), rebuilt by `scripts/make-curtain.mjs` (closed + gathered shapes, recoloured) | **CC BY 4.0 — credit required** |
| Worn brass (roughness/normal only) | TextureCan — Metal 0065 | verify before launch |
| Manrope, DM Sans | Google Fonts / Fontsource | OFL (licences in `public/fonts`) |

The curtain is rebuilt from the Sketchfab download with `node scripts/make-curtain.mjs <curtain.glb>`.

The `.blend` models are exported with Blender (`BLENDER=/path/to/Blender` to override the default
`/Applications/Blender.app`).
