# The Brand Cappuccino — website

**We make brands grow.** The marketing site for TBC (Brand Growth & Strategy).

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
- **Tailwind CSS v4** — design tokens live in `app/app.css` (`@theme`).

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run build && npm start   # production server on :3000
```

Node 20+. Deploys anywhere that runs a Node server (Render, Railway, Fly, a VPS) — or swap in the
Vercel/Netlify React Router adapter.

### Environment

| Var | Purpose |
|---|---|
| `JBN_CLAIMED` | How many JBN audits are claimed (drives the live counter). Default `17`. |

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
- No 3D library or WebGL — the corridor is CSS 3D driven by GSAP, so it is light on mobile
  (phones get a horizontal gallery instead).
