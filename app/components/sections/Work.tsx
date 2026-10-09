import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { work, type WorkCategory } from "~/content/site";
import { gsap, ScrollTrigger, useGSAP } from "~/lib/gsap";
import { useLenis } from "~/lib/smooth-scroll";
import { Reveal, RevealLines } from "~/components/ui/Reveal";

/** Cinematic palettes for the "screens" until real case-study footage is dropped in. */
const palettes = [
  "radial-gradient(90% 80% at 30% 20%, #6b4a2b, #23170f 55%, #0b0806)",
  "radial-gradient(90% 80% at 70% 30%, #4b2a2f, #1c1012 55%, #090606)",
  "radial-gradient(90% 80% at 40% 70%, #34404a, #151a1f 55%, #070809)",
  "radial-gradient(90% 80% at 60% 20%, #6a5532, #241c10 55%, #0a0805)",
  "radial-gradient(90% 80% at 50% 50%, #3d4a37, #161b14 55%, #070806)",
];

export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatch(mq.matches);
    const on = (e: MediaQueryListEvent) => setMatch(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

/** One lit screen — a case-study image if provided, otherwise a cinematic title card. */
export function WorkScreen({ c, i, variant = "title" }: { c: WorkCategory; i: number; variant?: "title" | "detail" }) {
  const image = c.items.find((it) => it.image)?.image;
  return (
    <div className="relative h-full w-full overflow-hidden border border-champagne/25 shadow-[0_0_60px_rgba(234,214,173,0.18)]" style={{ background: palettes[i % palettes.length] }}>
      {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgb(0_0_0/0.7))]" />
      <div className="absolute inset-0 opacity-30 [background:repeating-linear-gradient(0deg,transparent_0_3px,rgb(0_0_0/0.25)_3px_4px)]" />
      {variant === "title" ? (
        <div className="absolute inset-0 flex flex-col justify-end p-[6%]">
          <p className="text-[0.7em] tracking-[0.3em] text-gold uppercase">No. 0{i + 1}</p>
          <p className="display mt-[0.3em] text-[2.6em] text-ivory">{c.title}</p>
          <p className="mt-[0.4em] text-[0.8em] tracking-[0.18em] text-ivory/70 uppercase">{c.subtitle}</p>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col justify-end p-[6%]">
          <p className="font-display text-[1.6em] leading-snug text-ivory/90 italic">“{c.body}”</p>
          <p className="mt-[0.6em] text-[0.7em] tracking-[0.28em] text-gold uppercase">{c.items[0]?.client}</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/*  CURTAIN — 419M+ on velvet, parts as you scroll                           */
/* ------------------------------------------------------------------------- */

export function Curtain() {
  const wrap = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: wrap.current, start: "top top", end: "bottom bottom", scrub: 1 },
      });
      tl.to("[data-curtain-text]", { opacity: 0, scale: 1.1, filter: "blur(6px)", duration: 0.35 }, 0)
        .to("[data-curtain-left]", { xPercent: -100, scaleX: 0.6, duration: 1, ease: "power2.inOut" }, 0.1)
        .to("[data-curtain-right]", { xPercent: 100, scaleX: 0.6, duration: 1, ease: "power2.inOut" }, 0.1)
        .fromTo("[data-stage]", { scale: 0.92, opacity: 0.2 }, { scale: 1, opacity: 1, duration: 0.9 }, 0.2);
    },
    { scope: wrap },
  );

  const open = () => {
    const el = wrap.current;
    if (!el) return;
    const target = el.offsetTop + el.offsetHeight - window.innerHeight;
    lenis ? lenis.scrollTo(target, { duration: 2.4 }) : window.scrollTo({ top: target, behavior: "smooth" });
  };

  return (
    <section ref={wrap} className="relative h-[220vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Behind the curtain: the stage */}
        <div data-stage className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div aria-hidden className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(40%_70%_at_50%_0%,rgb(234_214_173/0.22),transparent_70%)]" />
          <p className="eyebrow relative">The work</p>
          <h2 className="display relative mt-6 text-5xl md:text-8xl">
            The work speaks
            <br />
            <span className="gold-text">louder than the pitch.</span>
          </h2>
          <p className="relative mt-8 max-w-md text-mist">But first — the numbers. Then the corridor.</p>
          <div aria-hidden className="floor absolute inset-x-0 bottom-0 h-1/4" />
        </div>

        {/* The curtain halves */}
        <div data-curtain-left className="velvet absolute inset-y-0 left-0 w-1/2 origin-left shadow-[20px_0_60px_rgba(0,0,0,0.7)]" />
        <div data-curtain-right className="velvet absolute inset-y-0 right-0 w-1/2 origin-right shadow-[-20px_0_60px_rgba(0,0,0,0.7)]" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-ink to-transparent" />

        <div data-curtain-text className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="eyebrow">Room 04 — The work</p>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="gold-text mt-6 font-display text-[22vw] leading-none font-light md:text-[14rem]"
          >
            419M+
          </motion.p>
          <p className="display text-2xl tracking-[0.2em] md:text-4xl">Organic views</p>
          <p className="mt-6 font-display text-xl text-ivory/70 italic">The work speaks louder than the pitch.</p>
          <button type="button" onClick={open} className="btn pointer-events-auto mt-12">
            Open the curtain ↓
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------- */
/*  CORRIDOR — a walk past lit screens, organised by business problem        */
/* ------------------------------------------------------------------------- */

const D = 1300; // distance between categories (px)
const WALL_X = 640; // half corridor width
const H = 640; // corridor height
const START = 900; // first screen distance
const L = START + work.length * D + 800; // corridor length

export function Corridor() {
  const wrap = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const lenis = useLenis();

  useGSAP(
    () => {
      const el = world.current!;
      let scale = 1;
      let camZ = 0;
      let mx = 0;
      let my = 0;
      const render = () => {
        el.style.transform = `scale3d(${scale},${scale},${scale}) rotateY(${mx * 2.5}deg) rotateX(${my * -1.5}deg) translate3d(0,0,${camZ}px)`;
      };
      const resize = () => {
        scale = Math.min(1, Math.max(0.55, window.innerWidth / 1500));
        render();
      };
      resize();
      window.addEventListener("resize", resize);

      const onMove = (e: PointerEvent) => {
        mx = e.clientX / window.innerWidth - 0.5;
        my = e.clientY / window.innerHeight - 0.5;
        render();
      };
      window.addEventListener("pointermove", onMove);

      const st = ScrollTrigger.create({
        trigger: wrap.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          camZ = self.progress * (L - 700);
          render();
          // which category are we passing?
          const idx = Math.round((camZ - START + 500) / D);
          setActive(Math.max(0, Math.min(work.length - 1, idx)));
        },
      });

      return () => {
        st.kill();
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onMove);
      };
    },
    { scope: wrap },
  );

  const goTo = (i: number) => {
    const el = wrap.current;
    if (!el) return;
    const progress = (START + i * D - 500) / (L - 700);
    const top = el.offsetTop + progress * (el.offsetHeight - window.innerHeight);
    lenis ? lenis.scrollTo(top, { duration: 1.8 }) : window.scrollTo({ top, behavior: "smooth" });
  };

  const c = work[active];

  return (
    <section ref={wrap} className="relative" style={{ height: `${(work.length + 1) * 110}vh` }} aria-label="The work, organised by business problem">
      <div className="sticky top-0 h-screen overflow-hidden bg-ink [perspective:900px]">
        {/* the world */}
        <div ref={world} className="absolute top-1/2 left-1/2 h-0 w-0 [transform-style:preserve-3d]">
          {/* floor */}
          <div className="corridor-floor absolute" style={{ width: WALL_X * 2, height: L, transform: `translate3d(${-WALL_X}px, ${H / 2}px, 0) rotateX(-90deg)`, transformOrigin: "0 0" }} />
          {/* ceiling with light strip */}
          <div
            className="absolute"
            style={{
              width: WALL_X * 2,
              height: L,
              transform: `translate3d(${-WALL_X}px, ${-H / 2}px, 0) rotateX(-90deg)`,
              transformOrigin: "0 0",
              background: "linear-gradient(90deg,#070605,#120e0b 40%,rgb(234 214 173 / 0.5) 49.6%,rgb(234 214 173 / 0.5) 50.4%,#120e0b 60%,#070605)",
            }}
          />
          {/* left wall */}
          <div className="fluted absolute [transform-style:preserve-3d]" style={{ width: L, height: H, transform: `translate3d(${-WALL_X}px, ${-H / 2}px, 0) rotateY(90deg)`, transformOrigin: "0 0" }}>
            {work.map((w, i) => (
              <div key={w.id} className="absolute text-[15px]" style={{ left: START + i * D - 260, top: 110, width: 520, height: 330, transform: "translateZ(4px)" }}>
                <WorkScreen c={w} i={i} />
              </div>
            ))}
          </div>
          {/* right wall */}
          <div className="fluted absolute [transform-style:preserve-3d]" style={{ width: L, height: H, transform: `translate3d(${WALL_X}px, ${-H / 2}px, ${-L}px) rotateY(-90deg)`, transformOrigin: "0 0" }}>
            {work.map((w, i) => (
              <div key={w.id} className="absolute text-[15px]" style={{ left: L - (START + i * D + 420) - 260, top: 110, width: 520, height: 330, transform: "translateZ(4px)" }}>
                <WorkScreen c={w} i={i} variant="detail" />
              </div>
            ))}
          </div>
          {/* end wall */}
          <div
            className="absolute flex flex-col items-center justify-center text-center"
            style={{ width: WALL_X * 2, height: H, transform: `translate3d(${-WALL_X}px, ${-H / 2}px, ${-L}px)`, background: "radial-gradient(50% 60% at 50% 45%, rgb(234 214 173 / 0.28), #0a0807 75%)" }}
          >
            <p className="eyebrow">And counting</p>
            <p className="gold-text mt-4 font-display text-[9rem] leading-none font-light">419M+</p>
            <p className="display mt-4 text-3xl">Organic views</p>
          </div>
        </div>

        {/* vignette + fog */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_50%,transparent_40%,rgb(0_0_0/0.85))]" />

        {/* HUD: what you're looking at */}
        <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
              transition={{ duration: 0.6 }}
              className="max-w-xl text-center"
            >
              <p className="eyebrow">0{active + 1} / 0{work.length}</p>
              <p className="display mt-3 text-4xl md:text-6xl">{c.title}</p>
              <p className="mt-3 text-sm text-ivory/70">{c.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <nav className="absolute inset-x-0 bottom-0 border-t border-line bg-ink/60 backdrop-blur-md" aria-label="Work categories">
          <ul className="mx-auto flex max-w-6xl overflow-x-auto">
            {work.map((w, i) => (
              <li key={w.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  className={`relative w-full min-w-32 px-3 py-5 text-[0.6rem] tracking-[0.24em] uppercase transition-colors ${i === active ? "text-champagne" : "text-mist hover:text-ivory"}`}
                >
                  {w.title}
                  {i === active && <motion.span layoutId="corridor-active" className="absolute inset-x-6 top-0 h-px bg-champagne" />}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------- */
/*  GALLERY — the classic-site version: a pinned horizontal track            */
/* ------------------------------------------------------------------------- */

export function WorkGallery() {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const distance = () => track.current!.scrollWidth - window.innerWidth;
        gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: wrap.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: wrap },
  );

  return (
    <div ref={wrap} className="relative overflow-hidden md:h-screen">
      <div className="flex h-full flex-col justify-center py-24 md:py-0">
        <div ref={track} className="flex w-max flex-col gap-8 px-6 md:flex-row md:items-center md:gap-10 md:px-10">
          <div className="w-[calc(100vw-3rem)] shrink-0 md:w-[34vw]">
            <p className="eyebrow">Our work</p>
            <h2 className="display mt-6 text-5xl md:text-7xl">
              The work speaks <span className="gold-text">louder than the pitch.</span>
            </h2>
            <p className="mt-6 max-w-sm text-mist">Organised by the business problem we solved — not by the posts we made.</p>
          </div>
          {work.map((w, i) => (
            <article key={w.id} className="group w-[calc(100vw-3rem)] shrink-0 md:w-[46vw] lg:w-[38vw]">
              <div className="aspect-[16/10] text-[11px] transition-transform duration-250 motion-safe:group-hover:scale-[1.015] md:text-[14px]">
                <WorkScreen c={w} i={i} />
              </div>
              <p className="mt-5 text-sm leading-relaxed text-mist">{w.body}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Small heading used above the corridor in the work room. */
export function CorridorIntro() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-32 text-center">
      <Reveal><p className="eyebrow">Walk the corridor</p></Reveal>
      <RevealLines lines={["Five problems.", "Five kinds of growth."]} className="display mt-6 text-4xl md:text-6xl" />
      <Reveal delay={0.2}>
        <p className="mt-6 text-mist">We organise our work by the business problem it solved. Scroll to walk.</p>
      </Reveal>
    </div>
  );
}
