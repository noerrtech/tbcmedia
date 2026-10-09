import { useRef, useState } from "react";
import { work } from "~/content/site";
import { ScrimZone } from "~/components/office/ScrimZone";
import { world } from "~/components/three/world";
import { ImpactWall } from "~/components/sections/Impact";
import { ActBar, CaseStudyPanel, WorkIntro, scrollToAct } from "~/components/sections/CaseStudies";
import { ACTS, actAt } from "~/lib/acts";
import { gsap, ScrollTrigger, useGSAP } from "~/lib/gsap";
import { useLenis } from "~/lib/smooth-scroll";

/**
 * The Work room in the 3D office. The page is a set of scroll tracks; the stage behind it
 * (WorkHall) plays them: the curtain parts, then the case studies play as five acts — each act's
 * screen flown in on the stage, its story laid out here beside it.
 */
export function WorkRoom3D() {
  const curtain = useRef<HTMLElement>(null);
  const acts = useRef<HTMLElement>(null);
  const curtainCopy = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement | null>(null);
  const [active, setActive] = useState(0);
  const lenis = useLenis();

  useGSAP(() => {
    world.work.curtain = 0;
    world.work.acts = 0;
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
    // the acts follow the scroll a beat behind, so the scenery moves smoothly however you scroll
    let last = -1;
    const proxy = { p: 0 };
    const t = gsap.to(proxy, {
      p: 1,
      ease: "none",
      scrollTrigger: { trigger: acts.current, start: "top top", end: "bottom bottom", scrub: 0.9 },
      onUpdate: () => {
        if (!here()) return;
        world.work.acts = proxy.p;
        if (fill.current) fill.current.style.transform = `scaleX(${proxy.p})`;
        const i = actAt(proxy.p);
        if (i !== last) setActive((last = i));
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

      {/* the numbers, then the line before the acts */}
      <ScrimZone value={0.86}>
        <section className="py-32">
          <ImpactWall />
        </section>
        <WorkIntro />
      </ScrimZone>

      {/* the acts: the stage plays the screens, the story sits on the left */}
      <ScrimZone value={0.12}>
        <section ref={acts} className="relative" style={{ height: `${ACTS * 130}vh` }} aria-label="Case studies">
          <div className="sticky top-0 h-screen">
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[56%] bg-[linear-gradient(90deg,rgb(21_13_9/0.94)_0%,rgb(21_13_9/0.8)_60%,transparent)]" />
            <div className="relative mx-auto flex h-full max-w-[1400px] items-center px-8 pt-24 pb-24 md:px-12">
              <div className="grid w-full max-w-[34rem]">
                {work.map((c, i) => <CaseStudyPanel key={c.id} c={c} i={i} active={i === active} />)}
              </div>
            </div>
            <ActBar active={active} onGo={(i) => scrollToAct(acts.current, i, lenis)} fill={(el) => (fill.current = el)} />
          </div>
        </section>
      </ScrimZone>
    </>
  );
}
