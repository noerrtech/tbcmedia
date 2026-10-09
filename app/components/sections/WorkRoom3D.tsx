import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { work } from "~/content/site";
import { ScrimZone } from "~/components/office/ScrimZone";
import { workHall, world } from "~/components/three/world";
import { ImpactWall } from "~/components/sections/Impact";
import { CorridorIntro } from "~/components/sections/Work";
import { ScrollTrigger, useGSAP } from "~/lib/gsap";
import { useLenis } from "~/lib/smooth-scroll";

/**
 * The Work room in the 3D office. The page is a set of scroll tracks; the curtain and the
 * corridor themselves are in the world behind it (WorkHall), driven by these tracks.
 */
export function WorkRoom3D() {
  const curtain = useRef<HTMLElement>(null);
  const corridor = useRef<HTMLElement>(null);
  const curtainCopy = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const lenis = useLenis();

  // The camera's z along the corridor for a scroll progress — and back.
  const endZ = workHall.start - workHall.length(work.length) + 6.5;
  const zAt = (k: number) => workHall.camStart + (endZ - workHall.camStart) * k;
  const kFor = (i: number) => (workHall.screenZ(i) + 2.6 - workHall.camStart) / (endZ - workHall.camStart);

  useGSAP(() => {
    world.work.curtain = 0;
    world.work.corridor = 0;
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
    const b = ScrollTrigger.create({
      trigger: corridor.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (!here()) return;
        world.work.corridor = self.progress;
        const z = zAt(self.progress);
        let best = 0;
        for (let i = 1; i < work.length; i++) {
          if (Math.abs(workHall.screenZ(i) + 1 - z) < Math.abs(workHall.screenZ(best) + 1 - z)) best = i;
        }
        setActive((prev) => (prev === best ? prev : best));
      },
    });
    return () => {
      a.kill();
      b.kill();
    };
  });

  const scrollTo = (top: number, duration: number) =>
    lenis ? lenis.scrollTo(top, { duration }) : window.scrollTo({ top, behavior: "smooth" });

  const openCurtain = () => {
    const el = curtain.current;
    if (el) scrollTo(el.offsetTop + el.offsetHeight - window.innerHeight, 2.4);
  };

  const goTo = (i: number) => {
    const el = corridor.current;
    if (!el) return;
    const k = Math.min(1, Math.max(0, kFor(i)));
    scrollTo(el.offsetTop + k * (el.offsetHeight - window.innerHeight), 1.8);
  };

  const c = work[active];

  return (
    <>
      {/* the curtain: scroll to open it */}
      <ScrimZone value={0}>
        <section ref={curtain} className="relative h-[150vh]" aria-label="The work — the curtain">
          <div className="sticky top-0 h-screen">
            <div ref={curtainCopy} className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-6 px-6 pb-16 text-center">
              <p className="eyebrow">Room 04 — The work</p>
              <h1 className="sr-only">The work: 419M+ organic views</h1>
              <p className="font-display text-2xl text-ivory/85 italic md:text-3xl">The work speaks louder than the pitch.</p>
              <button type="button" onClick={openCurtain} className="btn bg-ink/40 backdrop-blur-sm">
                Open the curtain ↓
              </button>
            </div>
          </div>
        </section>
      </ScrimZone>

      {/* the numbers, before the corridor */}
      <ScrimZone value={0.86}>
        <section className="py-32">
          <ImpactWall />
        </section>
        <CorridorIntro />
      </ScrimZone>

      {/* the corridor: scroll to walk it */}
      <ScrimZone value={0.08}>
        <section ref={corridor} className="relative" style={{ height: `${work.length * 70 + 60}vh` }} aria-label="The work, organised by business problem">
          <div className="sticky top-0 h-screen">
            <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center px-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="max-w-xl text-center [text-shadow:0_2px_24px_rgb(0_0_0/0.8)]"
                >
                  <p className="eyebrow">
                    0{active + 1} / 0{work.length}
                  </p>
                  <p className="display mt-3 text-4xl md:text-6xl">{c.title}</p>
                  <p className="mt-3 text-sm text-ivory/80">{c.body}</p>
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
                      aria-current={i === active ? "true" : undefined}
                      className={`relative w-full min-w-32 px-3 py-5 text-[0.6rem] tracking-[0.24em] uppercase transition-colors duration-200 ${i === active ? "text-champagne" : "text-mist hover:text-ivory"}`}
                    >
                      {w.title}
                      {i === active && <motion.span layoutId="corridor3d-active" className="absolute inset-x-6 top-0 h-px bg-champagne" />}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </section>
      </ScrimZone>
    </>
  );
}
