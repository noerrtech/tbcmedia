import { useRef, useState } from "react";
import { bookingLink, work } from "~/content/site";
import { ScrimZone } from "~/components/office/ScrimZone";
import { world } from "~/components/three/world";
import { ImpactWall } from "~/components/sections/Impact";
import { ActBar, CaseStudyPanel, WorkIntro } from "~/components/sections/CaseStudies";
import { Arrow } from "~/components/ui/Arrow";
import { FRAMES, HALL_UNITS, galleryAt, stopProgress } from "~/lib/gallery";
import { gsap, ScrollTrigger, useGSAP } from "~/lib/gsap";
import { useLenis } from "~/lib/smooth-scroll";

/**
 * The Work room in the 3D office. The page is a set of scroll tracks; the world behind it
 * (WorkHall) plays them: the curtain parts, then you walk the hall of work — at each piece on the
 * wall you stop and turn to it, and its story is laid out here beside it.
 */
export function WorkRoom3D() {
  const curtain = useRef<HTMLElement>(null);
  const hall = useRef<HTMLElement>(null);
  const curtainCopy = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement | null>(null);
  const [at, setAt] = useState(-1);
  const [near, setNear] = useState(0); // the piece you're at or walking toward, for the bar
  const lenis = useLenis();

  useGSAP(() => {
    world.work.curtain = 0;
    world.work.hall = 0;
    // only while this is the room — the exit transition scrolls the page back to the top
    const here = () => world.route === "work";
    const a = ScrollTrigger.create({
      trigger: curtain.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (!here()) return;
        world.work.curtain = self.progress;
        if (curtainCopy.current) curtainCopy.current.style.opacity = String(Math.max(0, 1 - self.progress * 5));
      },
    });
    // the walk follows the scroll a beat behind, so it glides however you scroll
    let lastAt = -2;
    let lastNear = -1;
    const proxy = { p: 0 };
    const t = gsap.to(proxy, {
      p: 1,
      ease: "none",
      scrollTrigger: { trigger: hall.current, start: "top top", end: "bottom bottom", scrub: 1 },
      onUpdate: () => {
        if (!here()) return;
        world.work.hall = proxy.p;
        if (fill.current) fill.current.style.transform = `scaleX(${proxy.p})`;
        const g = galleryAt(proxy.p);
        if (g.at !== lastAt) setAt((lastAt = g.at));
        let n = 0;
        for (let i = 0; i < FRAMES; i++) if (proxy.p >= stopProgress(i) - 0.04) n = i;
        if (n !== lastNear) setNear((lastNear = n));
      },
    });
    return () => {
      a.kill();
      t.scrollTrigger?.kill();
      t.kill();
    };
  });

  const scrollTo = (top: number, duration: number) =>
    lenis ? lenis.scrollTo(top, { duration }) : window.scrollTo({ top, behavior: "smooth" });

  const openCurtain = () => {
    const el = curtain.current;
    if (el) scrollTo(el.offsetTop + el.offsetHeight - window.innerHeight, 2.4);
  };
  // a click anywhere on the stage opens it too (the button stays, for keyboards)
  const onStageClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a, button") || world.work.curtain > 0.6) return;
    openCurtain();
  };
  const goTo = (i: number) => {
    const el = hall.current;
    if (el) scrollTo(el.offsetTop + stopProgress(i) * (el.offsetHeight - window.innerHeight), 2.2);
  };

  return (
    <>
      {/* the curtain: scroll, or click anywhere, to open it */}
      <ScrimZone value={0}>
        <section ref={curtain} onClick={onStageClick} className="relative h-[150vh] cursor-pointer" aria-label="The work — the curtain">
          <div className="sticky top-0 h-screen">
            <div ref={curtainCopy} className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-6 px-6 pb-16 text-center">
              <p className="eyebrow">Room 04 — The work</p>
              <h1 className="sr-only">The work: 419M+ views, without a rupee spent on ads</h1>
              <p className="font-sans text-2xl text-ivory/85 italic md:text-3xl">The work speaks louder than the pitch.</p>
              <button type="button" onClick={openCurtain} className="btn bg-ink/40 backdrop-blur-sm">
                Open the curtain ↓
              </button>
              <p className="text-[0.65rem] tracking-[0.28em] text-mist uppercase">or click anywhere on the stage</p>
            </div>
          </div>
        </section>
      </ScrimZone>

      {/* the numbers, then the line before the hall */}
      <ScrimZone value={0.86}>
        <section className="py-32">
          <ImpactWall />
        </section>
        <WorkIntro />
      </ScrimZone>

      {/* the hall: walk it; at each piece its story appears beside it */}
      <ScrimZone value={0.06}>
        <section ref={hall} className="relative" style={{ height: `${HALL_UNITS * 55}vh` }} aria-label="Case studies">
          <div className="sticky top-0 h-screen">
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-y-0 left-0 w-[58%] bg-[linear-gradient(90deg,rgb(21_13_9/0.94)_0%,rgb(21_13_9/0.8)_60%,transparent)] transition-opacity duration-700 ${at >= 0 && at < FRAMES ? "opacity-100" : "opacity-0"}`}
            />
            <div className="relative mx-auto flex h-full max-w-[1400px] items-center px-8 pt-24 pb-24 md:px-12">
              <div className="grid w-full max-w-[33rem]">
                {work.map((c, i) => <CaseStudyPanel key={c.id} c={c} i={i} active={i === at} />)}
              </div>
            </div>
            {/* the end of the hall */}
            <div className={`swap-panel absolute inset-x-0 bottom-28 text-center`} data-active={at === FRAMES} aria-hidden={at !== FRAMES}>
              <p className="eyebrow" style={{ "--i": 0 } as React.CSSProperties}>That's the work so far</p>
              <p className="display title-md mt-3" style={{ "--i": 1 } as React.CSSProperties}>Yours could hang here next.</p>
              <div style={{ "--i": 2 } as React.CSSProperties}>
                <a href={bookingLink()} target="_blank" rel="noreferrer" className="btn-cta mt-6 inline-flex">
                  Book a consultation <span className="chip"><Arrow /></span>
                </a>
              </div>
            </div>
            <ActBar active={near} onGo={goTo} fill={(el) => (fill.current = el)} />
          </div>
        </section>
      </ScrimZone>
    </>
  );
}
