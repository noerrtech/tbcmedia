import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { brand, work } from "~/content/site";
import { RoomFooter } from "~/components/office/RoomFooter";
import { ScrimZone } from "~/components/office/ScrimZone";
import { StoryPanel } from "~/components/sections/CaseStudies";
import { resetCorridor } from "~/components/three/corridorCamera";
import { world, workNotify } from "~/components/three/world";
import { Arrow } from "~/components/ui/Arrow";
import { SCREENS, caseAt, caseProgress } from "~/lib/corridor";
import { gsap, useGSAP } from "~/lib/gsap";
import { ease } from "~/lib/motion";
import { useLenis } from "~/lib/smooth-scroll";

/**
 * The Work room in the 3D office. A velvet curtain first — click anywhere and it parts — then the
 * corridor in the world behind the page: scroll to walk straight down it past the case studies on
 * both walls; click any screen to go over to it and read the full story here.
 */

const two = (n: number) => String(n).padStart(2, "0");

/** The curtain: 419M+ on velvet. Any click, scroll or key parts it down the middle. */
function CurtainOverlay({ onStart, onOpen }: { onStart: () => void; onOpen: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const opened = useRef(false);
  const open = useCallback(() => {
    if (opened.current) return;
    opened.current = true;
    onStart();
    const q = gsap.utils.selector(root);
    const tl = gsap.timeline({ onComplete: onOpen });
    tl.to(q("[data-copy]"), { opacity: 0, y: -16, filter: "blur(6px)", duration: 0.5, ease: "power2.out" }, 0)
      .to(q("[data-left]"), { xPercent: -100, scaleX: 0.65, duration: 1.5, ease: "power3.inOut" }, 0.15)
      .to(q("[data-right]"), { xPercent: 100, scaleX: 0.65, duration: 1.5, ease: "power3.inOut" }, 0.15)
      .to(root.current, { opacity: 0, duration: 0.4 }, 1.4);
  }, [onStart, onOpen]);
  useEffect(() => {
    const onWheel = () => open();
    const onKey = (e: KeyboardEvent) => ["Enter", " ", "ArrowDown", "PageDown"].includes(e.key) && open();
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={root} onClick={open} className="pointer-events-auto fixed inset-0 z-30 cursor-pointer overflow-hidden" role="button" tabIndex={0} aria-label="Open the curtain">
      <div data-left className="velvet absolute inset-y-0 left-0 w-1/2 origin-left shadow-[20px_0_60px_rgba(0,0,0,0.7)]" />
      <div data-right className="velvet absolute inset-y-0 right-0 w-1/2 origin-right shadow-[-20px_0_60px_rgba(0,0,0,0.7)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(21_13_9/0.85)_0%,transparent_22%,transparent_70%,rgb(21_13_9/0.9)_100%)]" />
      <div data-copy className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <p className="eyebrow">Room 04 — The work</p>
        <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: ease.out, delay: 0.2 }} className="stat-num stat-hero mt-6">
          419M+
        </motion.p>
        <p className="stat-label mt-4">Views. <span className="soft">{brand.proof}</span></p>
        <p className="mt-6 font-sans text-xl text-ivory/70 italic">The work speaks louder than the pitch.</p>
        <span className="btn mt-12">Open the curtain ↓</span>
        <p className="mt-4 text-[0.65rem] tracking-[0.28em] text-mist uppercase">or click anywhere</p>
      </div>
    </div>
  );
}

export function CorridorRoom() {
  const [open, setOpen] = useState(false);
  const [near, setNear] = useState(0);
  const [focus, setFocus] = useState(-1);
  const [hovered, setHovered] = useState(-1);
  const track = useRef<HTMLElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const chip = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  // a fresh visit: on the stage, curtain closed, the page held until it opens
  useEffect(() => {
    Object.assign(world.work, { curtain: 0, walk: 0, focus: -1, hovered: -1 });
    resetCorridor();
    window.scrollTo(0, 0);
    return () => {
      document.body.style.cursor = "";
      Object.assign(world.work, { focus: -1, hovered: -1 });
    };
  }, []);
  useEffect(() => {
    if (open) lenis?.start();
    else lenis?.stop();
    return () => lenis?.start();
  }, [open, lenis]);

  const onOpen = useCallback(() => setOpen(true), []);
  // the 3D curtain behind parts with the velvet in front
  const parting = useCallback(() => void gsap.to(world.work, { curtain: 1, duration: 1.8, ease: "power2.inOut" }), []);

  // the screens tell the page what's hovered and what's being read
  useEffect(() => {
    const on = () => {
      setFocus(world.work.focus);
      setHovered(world.work.hovered);
    };
    window.addEventListener("tbc:work", on);
    const move = (e: PointerEvent) => chip.current && (chip.current.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 18}px)`);
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("tbc:work", on);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  // scroll walks you down the corridor; scrolling while reading puts the story away
  useGSAP(() => {
    const proxy = { p: 0 };
    let last = -1;
    let focusAt = 0;
    const t = gsap.to(proxy, {
      p: 1,
      ease: "none",
      scrollTrigger: { trigger: track.current, start: "top top", end: "bottom bottom", scrub: 0.6 },
      onUpdate: () => {
        if (world.route !== "work") return;
        world.work.walk = proxy.p;
        if (fill.current) fill.current.style.transform = `scaleX(${proxy.p})`;
        const n = caseAt(proxy.p);
        if (n !== last) setNear((last = n));
        if (world.work.focus >= 0 && Math.abs(proxy.p - focusAt) > 0.02) close();
      },
    });
    const onFocus = () => (focusAt = proxy.p);
    window.addEventListener("tbc:work", onFocus);
    return () => {
      window.removeEventListener("tbc:work", onFocus);
      t.scrollTrigger?.kill();
      t.kill();
    };
  });

  const close = () => {
    world.work.focus = -1;
    workNotify();
  };
  const read = (i: number, side: "left" | "right" = "left") => {
    world.work.focus = SCREENS.findIndex((s) => s.index === i && s.side === side);
    workNotify();
  };
  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    close();
    const top = el.offsetTop + caseProgress(i) * (el.offsetHeight - window.innerHeight);
    if (lenis) lenis.scrollTo(top, { duration: 1.8 });
    else window.scrollTo({ top, behavior: "smooth" });
  };

  const c = work[near];
  const hover = hovered >= 0 ? SCREENS[hovered] : null;
  const story = focus >= 0 ? SCREENS[focus].index : -1;

  return (
    <div data-passthrough>
      {!open && (
        <CurtainOverlay onStart={parting} onOpen={onOpen} />
      )}

      <ScrimZone value={0}>
        <section ref={track} className="pointer-events-none relative" style={{ height: `${work.length * 110 + 80}vh` }} aria-label="The work, organised by business problem">
          <h1 className="sr-only">The work: 419M+ views, without a rupee spent on ads</h1>
          <div className="sticky top-0 h-screen">
            {/* what you're passing */}
            <div className={`absolute inset-x-0 top-24 flex justify-center px-6 transition-opacity duration-500 ${open && story < 0 ? "opacity-100" : "opacity-0"}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
                  transition={{ duration: 0.5, ease: ease.out }}
                  className="max-w-xl text-center [text-shadow:0_2px_24px_rgb(0_0_0/0.8)]"
                >
                  <p className="eyebrow">{two(near + 1)} / {two(work.length)}</p>
                  <p className="display title-lg mt-3">{c.title}</p>
                  <p className="mt-3 text-sm text-ivory/80">{c.body}</p>
                  <button type="button" onClick={() => read(near)} className="pointer-events-auto mt-4 text-[0.65rem] tracking-[0.26em] text-champagne uppercase link-underline">
                    Click a screen — or read this story →
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* jump to a case study */}
            <nav className={`pointer-events-auto absolute inset-x-0 bottom-0 border-t border-line bg-ink/70 backdrop-blur-md transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} aria-label="Case studies">
              <span ref={fill} aria-hidden className="absolute top-0 left-0 h-px w-full origin-left scale-x-0 bg-champagne" />
              <ul className="mx-auto flex max-w-6xl overflow-x-auto">
                {work.map((w, i) => (
                  <li key={w.id} className="flex-1">
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-current={i === near ? "true" : undefined}
                      className={`w-full min-w-32 px-3 py-5 text-[0.6rem] tracking-[0.24em] uppercase transition-colors duration-200 ${i === near ? "text-champagne" : "text-mist hover:text-ivory"}`}
                    >
                      {w.title}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </section>
      </ScrimZone>

      {/* hovering a screen */}
      <div ref={chip} aria-hidden className={`pointer-events-none fixed top-0 left-0 z-20 border border-champagne/40 bg-ink/85 px-3 py-2 text-xs text-ivory backdrop-blur transition-opacity duration-200 ${hover && focus !== hovered ? "opacity-100" : "opacity-0"}`}>
        {hover && (
          <>
            <span className="text-champagne">{work[hover.index].title}</span> · Read the story <Arrow />
          </>
        )}
      </div>

      <StoryPanel index={story} onClose={close} onNext={(i) => read(i)} />

      <ScrimZone value={0.9}>
        <div className="pointer-events-auto">
          <RoomFooter />
        </div>
      </ScrimZone>
    </div>
  );
}
