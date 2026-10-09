import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { brand, work, type WorkCategory } from "~/content/site";
import { gsap, useGSAP } from "~/lib/gsap";
import { useLenis } from "~/lib/smooth-scroll";

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
          <p className="font-sans text-[1.6em] leading-snug text-ivory/90 italic">“{c.body}”</p>
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
  // a click anywhere on the curtain opens it (the button stays, for keyboards)
  const onStageClick = (e: React.MouseEvent) => {
    const el = wrap.current;
    if (!el || (e.target as HTMLElement).closest("a, button") || window.scrollY > el.offsetTop + el.offsetHeight * 0.3) return;
    open();
  };

  return (
    <section ref={wrap} onClick={onStageClick} className="relative h-[220vh] cursor-pointer">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Behind the curtain: the stage */}
        <div data-stage className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div aria-hidden className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(40%_70%_at_50%_0%,rgb(234_214_173/0.22),transparent_70%)]" />
          <p className="eyebrow relative">The work</p>
          <h2 className="display title-xl relative mt-6">
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
            className="stat-num stat-hero mt-6"
          >
            419M+
          </motion.p>
          <p className="stat-label mt-4">Views. <span className="soft">{brand.proof}</span></p>
          <p className="mt-6 font-sans text-xl text-ivory/70 italic">The work speaks louder than the pitch.</p>
          <button type="button" onClick={open} className="btn pointer-events-auto mt-12">
            Open the curtain ↓
          </button>
          <p className="mt-4 text-[0.65rem] tracking-[0.28em] text-mist uppercase">or click anywhere</p>
        </div>
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
            <h2 className="display title-xl mt-6">
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
