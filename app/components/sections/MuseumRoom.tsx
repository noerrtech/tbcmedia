import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { bookingLink, work } from "~/content/site";
import { ScrimZone } from "~/components/office/ScrimZone";
import { CaseStudyPanel } from "~/components/sections/CaseStudies";
import { Arrow } from "~/components/ui/Arrow";
import { museumGo, world } from "~/components/three/world";
import { CZ, EXHIBITS, GW, HALL_START, MONUMENT_R, NODES, R, R0, R1, X0, dirOf } from "~/lib/museum";
import { gsap } from "~/lib/gsap";
import { ease } from "~/lib/motion";

/**
 * The Work room in the 3D office: the Museum of Impact. The building and the walking are in the
 * world behind the page (Museum, museumCamera); this is the visitor's side of it — the curtain,
 * where you are, the tour, the directory with its floor plan, and each exhibit's story.
 *
 * Everything here sits over the 3D, which takes the clicks wherever there's no UI: hover an exhibit
 * to light it, click it to walk there and read its story.
 */

const two = (n: number) => String(n).padStart(2, "0");
const tones = ["#7a5530", "#6b3438", "#3b4c5e", "#7c6232", "#465a3e"];

type View = { at: string | null; walking: boolean; free: boolean; panel: number; hovered: number; to: string | null };

function useMuseum(): View {
  const read = (): View => ({
    at: world.museum.at,
    walking: world.museum.walking,
    free: world.museum.free,
    panel: world.museum.panel,
    hovered: world.museum.hovered,
    to: world.museum.request?.to ?? null,
  });
  const [v, set] = useState<View>(read);
  useEffect(() => {
    const on = () => set(read());
    window.addEventListener("tbc:museum", on);
    return () => window.removeEventListener("tbc:museum", on);
  }, []);
  return v;
}

const placeName = (id: string | null) => {
  if (!id) return "The museum";
  const ex = EXHIBITS.find((e) => e.node === id);
  if (ex) return `Gallery ${two(ex.index + 1)} · ${work[ex.index].title}`;
  return NODES[id]?.label ?? "The museum";
};

/* ------------------------------------------------------------------------- */
/*  The floor plan                                                           */
/* ------------------------------------------------------------------------- */

/** The museum from above, for the directory: click a gallery to walk there; the dot is you. */
function FloorPlan({ onGo }: { onGo: (node: string) => void }) {
  const you = useRef<SVGGElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const [x, z, yaw] = world.museum.where;
      you.current?.setAttribute("transform", `translate(${x - X0} ${z - CZ}) rotate(${(-yaw * 180) / Math.PI})`);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
  const corner = (deg: number, r: number, s: number) => {
    const [dx, dz] = dirOf(deg);
    return `${dx * r + dz * s},${dz * r - dx * s}`;
  };
  return (
    <svg viewBox={`${-R1 - 1} ${-R1 - 1} ${2 * R1 + 2} ${HALL_START - CZ + R1 + 6}`} className="w-full" role="img" aria-label="Floor plan of the museum">
      <g fill="#221710" stroke="#3B2A1E" strokeWidth="0.15">
        {/* entrance hall */}
        <rect x={-3} y={R0 - 0.2} width={6} height={HALL_START - CZ - R0 + 4.6} />
        {/* galleries */}
        {EXHIBITS.map((e) => (
          <polygon key={e.id} points={[corner(e.deg, R0 - 0.3, -GW / 2), corner(e.deg, R1, -GW / 2), corner(e.deg, R1, GW / 2), corner(e.deg, R0 - 0.3, GW / 2)].join(" ")} />
        ))}
        <circle r={R} />
      </g>
      <circle r={MONUMENT_R} fill="#C99A45" opacity="0.5" />
      <text y="0.45" textAnchor="middle" fontSize="1.2" fill="#F3EAD8" fontWeight="700">419M+</text>
      {EXHIBITS.map((e) => {
        const [dx, dz] = dirOf(e.deg);
        return (
          <g key={e.id} className="cursor-pointer" onClick={() => onGo(e.node)}>
            <circle cx={dx * (R1 - 2.2)} cy={dz * (R1 - 2.2)} r="1.35" fill={tones[e.index]} stroke="#D9B98A" strokeWidth="0.12" />
            <text x={dx * (R1 - 2.2)} y={dz * (R1 - 2.2) + 0.45} textAnchor="middle" fontSize="1.2" fill="#F3EAD8" fontWeight="700">{two(e.index + 1)}</text>
          </g>
        );
      })}
      <g ref={you}>
        <circle r="0.55" fill="#F3EAD8" />
        <path d="M0 -1.4 L0.55 -0.3 L-0.55 -0.3 Z" fill="#F3EAD8" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------------- */
/*  The room                                                                 */
/* ------------------------------------------------------------------------- */

export function MuseumRoom() {
  const v = useMuseum();
  const [inside, setInside] = useState(false);
  const [directory, setDirectory] = useState(false);
  const [help, setHelp] = useState(false);
  const [hint, setHint] = useState(false);
  const chip = useRef<HTMLDivElement>(null);

  // a fresh visit: on the stage, curtain closed
  useEffect(() => {
    world.work.curtain = 0;
    Object.assign(world.museum, { request: null, at: "stage", walking: false, free: false, panel: -1, hovered: -1, dragged: false });
    world.museum.reset++;
    return () => {
      document.body.style.cursor = "";
      world.museum.keys.forward = world.museum.keys.right = 0;
      world.museum.free = false;
    };
  }, []);

  const go = useCallback((node: string, open = false) => {
    setDirectory(false);
    setHint(false);
    museumGo(node, open);
  }, []);

  const enter = useCallback(() => {
    if (inside) return;
    setInside(true);
    gsap.to(world.work, { curtain: 1, duration: 2.6, ease: "power2.inOut" });
    window.setTimeout(() => museumGo("entrance"), 1300);
    window.setTimeout(() => setHint(true), 6000);
    window.setTimeout(() => setHint(false), 14000);
  }, [inside]);

  // the tour: the galleries in order, at your own pace
  const current = EXHIBITS.findIndex((e) => e.node === v.at);
  const next = () => go(current < 0 ? EXHIBITS[0].node : current >= EXHIBITS.length - 1 ? "ring0" : EXHIBITS[current + 1].node);
  const prev = () => go(current <= 0 ? "ring0" : EXHIBITS[current - 1].node);
  const close = () => {
    world.museum.panel = -1;
    window.dispatchEvent(new Event("tbc:museum"));
  };
  const toggleFree = () => {
    world.museum.free = !world.museum.free;
    if (world.museum.free) world.museum.at = null;
    else museumGo(nearestNodeName());
    window.dispatchEvent(new Event("tbc:museum"));
  };

  // keys: arrows step through the tour; Escape closes; in free exploration WASD / arrows walk
  useEffect(() => {
    if (!inside) return;
    const held = new Set<string>();
    const sync = () => {
      const k = world.museum.keys;
      k.forward = (held.has("w") || held.has("arrowup") ? 1 : 0) - (held.has("s") || held.has("arrowdown") ? 1 : 0);
      k.right = (held.has("d") || held.has("arrowright") ? 1 : 0) - (held.has("a") || held.has("arrowleft") ? 1 : 0);
    };
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      const key = e.key.toLowerCase();
      if (key === "escape") {
        setDirectory(false);
        setHelp(false);
        if (world.museum.panel >= 0) close();
        return;
      }
      if (world.museum.free) {
        if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
          held.add(key);
          sync();
          e.preventDefault();
        }
      } else if (key === "arrowright") next();
      else if (key === "arrowleft") prev();
    };
    const up = (e: KeyboardEvent) => {
      held.delete(e.key.toLowerCase());
      sync();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  });

  // pointer: drag to look while exploring freely; the hover chip follows the pointer
  useEffect(() => {
    let start: [number, number] | null = null;
    let last: [number, number] = [0, 0];
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-ui]")) return;
      start = last = [e.clientX, e.clientY];
      world.museum.dragged = false;
    };
    const onMove = (e: PointerEvent) => {
      if (chip.current) chip.current.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 18}px)`;
      if (!start || !world.museum.free) return;
      world.museum.look.dx += e.clientX - last[0];
      world.museum.look.dy += e.clientY - last[1];
      last = [e.clientX, e.clientY];
      if (Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 6) world.museum.dragged = true;
    };
    const onUp = () => (start = null);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const where = v.walking ? `Walking to · ${placeName(v.to)}` : v.free ? "Exploring freely" : placeName(v.at);
  const story = v.panel >= 0 ? work[v.panel] : null;

  return (
    <ScrimZone value={0}>
      <section data-museum className="pointer-events-none relative h-screen" aria-label="The Museum of Impact">
        <h1 className="sr-only">The work: the Museum of Impact — 419M+ views, without a rupee spent on ads</h1>

        {/* before: the curtain */}
        {!inside && (
          <>
            <button type="button" aria-label="Open the curtain" onClick={enter} className="pointer-events-auto absolute inset-0 cursor-pointer" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-6 px-6 pb-16 text-center">
              <p className="eyebrow">Room 04 — The work</p>
              <p className="font-sans text-2xl text-ivory/85 italic md:text-3xl">The work speaks louder than the pitch.</p>
              <button type="button" onClick={enter} className="btn pointer-events-auto bg-ink/40 backdrop-blur-sm">
                Open the curtain <Arrow />
              </button>
              <p className="text-[0.65rem] tracking-[0.28em] text-mist uppercase">or click anywhere on the stage</p>
            </div>
          </>
        )}

        {inside && (
          <>
            {/* where you are */}
            <div data-ui className="pointer-events-auto absolute top-24 left-6 md:left-10">
              <p className="eyebrow">The Museum of Impact</p>
              <AnimatePresence mode="wait">
                <motion.p key={where} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: ease.out }} className="mt-2 text-sm text-ivory">
                  {where}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* the controls */}
            <div data-ui className="pointer-events-auto absolute inset-x-0 bottom-6 flex justify-center px-4">
              <div className="flex items-center gap-1 border border-line bg-ink/80 p-1.5 backdrop-blur-md">
                <button type="button" onClick={() => setDirectory(true)} className="px-4 py-2.5 text-sm text-ivory hover:text-champagne">Directory</button>
                <span className="h-5 w-px bg-line" />
                <button type="button" onClick={prev} aria-label="Previous exhibit" className="px-3 py-2.5 text-ivory hover:text-champagne">←</button>
                <button type="button" onClick={next} className="bg-gold px-4 py-2.5 text-sm font-semibold text-ink hover:bg-gold-hover">
                  {current < 0 ? "Start the tour" : current >= EXHIBITS.length - 1 ? "Back to the monument" : "Next exhibit"} →
                </button>
                <span className="h-5 w-px bg-line" />
                <button type="button" onClick={toggleFree} aria-pressed={v.free} className={`px-4 py-2.5 text-sm ${v.free ? "text-champagne" : "text-ivory hover:text-champagne"}`}>
                  {v.free ? "Guided" : "Explore freely"}
                </button>
                <button type="button" onClick={() => setHelp((h) => !h)} aria-label="How to move around" aria-expanded={help} className="px-3 py-2.5 text-sm text-mist hover:text-ivory">?</button>
              </div>
            </div>

            <AnimatePresence>
              {help && (
                <motion.div data-ui initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="pointer-events-auto absolute bottom-24 left-1/2 w-[min(26rem,calc(100%-2rem))] -translate-x-1/2 border border-line bg-ink/90 p-5 text-sm text-ivory/85 backdrop-blur-md">
                  <ul className="space-y-2">
                    <li><span className="text-champagne">Click an exhibit</span> to walk to it and read its story.</li>
                    <li><span className="text-champagne">Directory</span> shows every gallery on the floor plan — click to go.</li>
                    <li><span className="text-champagne">← →</span> step through the tour at your own pace.</li>
                    <li><span className="text-champagne">Explore freely</span>: W A S D or the arrow keys to walk, drag to look.</li>
                  </ul>
                </motion.div>
              )}
              {hint && !v.walking && v.panel < 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute bottom-24 left-1/2 -translate-x-1/2 border border-line bg-ink/80 px-4 py-2.5 text-sm text-ivory backdrop-blur-md">
                  Click any exhibit to walk to it — or open the directory.
                </motion.p>
              )}
            </AnimatePresence>

            {/* hovering an exhibit */}
            <div ref={chip} aria-hidden className={`pointer-events-none fixed top-0 left-0 z-20 border border-champagne/40 bg-ink/85 px-3 py-2 text-xs text-ivory backdrop-blur transition-opacity duration-200 ${v.hovered >= 0 && v.panel !== v.hovered ? "opacity-100" : "opacity-0"}`}>
              {v.hovered >= 0 && (
                <>
                  <span className="text-champagne">{work[v.hovered].title}</span> · {v.at === EXHIBITS[v.hovered].node ? "Read the story" : "Walk there"} →
                </>
              )}
            </div>

            {/* the story */}
            <AnimatePresence>
              {story && (
                <motion.aside
                  key={story.id}
                  data-ui
                  aria-label={`${story.title} — the story`}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.5, ease: ease.out }}
                  className="pointer-events-auto absolute top-20 right-0 bottom-24 w-[min(30rem,42vw)] overflow-y-auto border-l border-line bg-ink/92 px-8 py-8 backdrop-blur-md"
                >
                  <button type="button" onClick={close} className="absolute top-5 right-6 text-sm text-mist hover:text-ivory" aria-label="Close the story">
                    Close ✕
                  </button>
                  <div className="grid pt-6">
                    <CaseStudyPanel c={story} i={v.panel} active />
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <a href={bookingLink(`Hi — I saw “${story.title}” in your museum. I'd like to talk about my brand.`)} target="_blank" rel="noreferrer" className="btn-cta">
                      Talk to us about a story like this <span className="chip"><Arrow /></span>
                    </a>
                    {v.panel < EXHIBITS.length - 1 && (
                      <button type="button" onClick={() => go(EXHIBITS[v.panel + 1].node)} className="btn">
                        Next exhibit <Arrow />
                      </button>
                    )}
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* the directory */}
            <AnimatePresence>
              {directory && (
                <motion.div data-ui className="pointer-events-auto absolute inset-0 z-30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <button type="button" aria-label="Close the directory" onClick={() => setDirectory(false)} className="absolute inset-0 bg-ink/50" />
                  <motion.nav
                    aria-label="Museum directory"
                    initial={{ x: -40 }}
                    animate={{ x: 0 }}
                    exit={{ x: -40 }}
                    transition={{ duration: 0.45, ease: ease.out }}
                    className="absolute top-0 bottom-0 left-0 w-[min(28rem,100%)] overflow-y-auto border-r border-line bg-ink/95 px-7 pt-24 pb-10"
                  >
                    <div className="flex items-baseline justify-between">
                      <p className="eyebrow">Directory</p>
                      <button type="button" onClick={() => setDirectory(false)} className="text-sm text-mist hover:text-ivory">Close ✕</button>
                    </div>
                    <div className="mt-6 border border-line bg-umber p-3">
                      <FloorPlan onGo={(n) => go(n)} />
                    </div>
                    <ol className="mt-6 divide-y divide-line border-y border-line">
                      {EXHIBITS.map((e) => {
                        const c = work[e.index];
                        return (
                          <li key={e.id}>
                            <button type="button" onClick={() => go(e.node, true)} className="group flex w-full gap-4 py-4 text-left">
                              <span className="h-14 w-20 shrink-0 border border-line" style={{ background: `radial-gradient(90% 90% at 70% 20%, ${tones[e.index]}, #150D09)` }} />
                              <span>
                                <span className="block text-[0.6rem] tracking-[0.26em] text-champagne uppercase">Gallery {two(e.index + 1)}</span>
                                <span className="mt-1 block font-display text-lg font-semibold text-ivory group-hover:text-champagne">{c.title}</span>
                                <span className="mt-1 block text-sm leading-snug text-mist">{c.body}</span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button type="button" onClick={() => go("ring0")} className="btn">The 419M+ monument</button>
                      <button type="button" onClick={() => go("entrance")} className="btn">Back to the entrance</button>
                    </div>
                    <Link to="/tbc" className="mt-8 inline-block text-[0.65rem] tracking-[0.28em] text-mist uppercase hover:text-ivory">← Leave the museum</Link>
                  </motion.nav>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </section>
    </ScrimZone>
  );
}

/** Where to settle when you leave free exploration: the node nearest where you're standing. */
function nearestNodeName() {
  const [x, z] = world.museum.where;
  let best = "entrance";
  let d = Infinity;
  for (const [id, n] of Object.entries(NODES)) {
    if (id === "stage" || id === "door") continue;
    const dd = Math.hypot(n.at[0] - x, n.at[1] - z);
    if (dd < d) (d = dd), (best = id);
  }
  return best;
}
