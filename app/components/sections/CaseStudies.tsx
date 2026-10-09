import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { work, type WorkCategory } from "~/content/site";
import { gsap, useGSAP } from "~/lib/gsap";
import { ACTS, actAt, actProgress, fly } from "~/lib/acts";
import { useLenis } from "~/lib/smooth-scroll";
import { Reveal, RevealLines } from "~/components/ui/Reveal";
import { WorkScreen } from "~/components/sections/Work";

/**
 * THE WORK, IN FIVE ACTS — each case study told as a story: the problem, what we did, what changed.
 * The 3D office plays the acts on its stage (WorkRoom3D + WorkHall); this file holds the words, the
 * act bar, and the flat version for the classic site.
 */

const two = (n: number) => String(n).padStart(2, "0");

function Beat({ i, children, className = "" }: { i: number; children: ReactNode; className?: string }) {
  return <div className={className} style={{ "--i": i } as CSSProperties}>{children}</div>;
}

/** One case study, laid out as a story. Stacked in a grid with the others; the active one shows. */
export function CaseStudyPanel({ c, i, active }: { c: WorkCategory; i: number; active: boolean }) {
  const client = c.items[0]?.client;
  return (
    <article className="swap-panel [grid-area:1/1]" data-active={active} aria-hidden={!active}>
      <Beat i={0}>
        <p className="eyebrow">
          Act {two(i + 1)} <span className="text-mist">· {c.subtitle}</span>
        </p>
      </Beat>
      <Beat i={1}><h3 className="display title-md mt-3 text-ivory">{c.title}</h3></Beat>
      <Beat i={2}><p className="mt-3 text-base leading-snug text-ivory/85">{c.body}</p></Beat>
      <Beat i={3}>
        <dl className="mt-5 border-t border-line">
          {[
            ["The problem", c.problem],
            ["What we did", c.approach],
            ["What changed", c.change],
          ].map(([k, v]) => (
            <div key={k} className="grid gap-1 border-b border-line py-3 md:grid-cols-[7.5rem_1fr] md:gap-4">
              <dt className="pt-0.5 text-[0.65rem] font-semibold tracking-[0.26em] text-champagne uppercase">{k}</dt>
              <dd className="text-[0.9rem] leading-relaxed text-ivory/85">{v}</dd>
            </div>
          ))}
        </dl>
      </Beat>
      {c.metrics && (
        <Beat i={4} className="mt-5 flex flex-wrap gap-x-10 gap-y-3">
          {c.metrics.map((m) => (
            <p key={m.label} className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-extrabold text-champagne">{m.value}</span>
              <span className="max-w-[12rem] text-sm leading-snug text-ivory/80">{m.label}</span>
            </p>
          ))}
        </Beat>
      )}
      <Beat i={5} className="mt-5 flex flex-wrap items-center gap-2">
        {client && client !== "Case study" && <span className="mr-2 text-sm font-semibold text-ivory">{client}</span>}
        {c.services.map((s) => (
          <span key={s} className="border border-line px-2.5 py-1 text-[0.7rem] tracking-[0.06em] text-mist">{s}</span>
        ))}
      </Beat>
    </article>
  );
}

/** The bar of acts along the bottom: where you are, and a way to jump. */
export function ActBar({ active, onGo, fill }: { active: number; onGo: (i: number) => void; fill?: (el: HTMLSpanElement | null) => void }) {
  return (
    <nav className="absolute inset-x-0 bottom-0 border-t border-line bg-ink/80 backdrop-blur-md" aria-label="Case studies">
      <span ref={fill} aria-hidden className="absolute top-0 left-0 h-px w-full origin-left scale-x-0 bg-champagne" />
      <ol className="mx-auto flex max-w-6xl overflow-x-auto">
        {work.map((w, i) => (
          <li key={w.id} className="flex-1">
            <button
              type="button"
              onClick={() => onGo(i)}
              aria-current={i === active ? "step" : undefined}
              className={`w-full min-w-36 px-3 py-4 text-left transition-colors duration-300 md:py-5 ${i === active ? "text-ivory" : "text-mist hover:text-ivory"}`}
            >
              <span className={`block text-[0.6rem] tracking-[0.26em] uppercase ${i === active ? "text-champagne" : ""}`}>Act {two(i + 1)}</span>
              <span className="mt-1 block text-sm whitespace-nowrap">{w.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** The line before the acts. */
export function WorkIntro() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-32 text-center">
      <Reveal><p className="eyebrow">The work, in five acts</p></Reveal>
      <RevealLines lines={["Five problems.", "Five kinds of growth."]} className="display title-lg mt-6" />
      <Reveal delay={0.2}>
        <p className="mt-6 text-mist">Every act is a growth problem we were brought in to solve — what it was, what we did, what changed.</p>
      </Reveal>
    </div>
  );
}

/** Scroll position for act i inside a pinned section. */
function scrollToAct(el: HTMLElement | null, i: number, lenis: ReturnType<typeof useLenis>) {
  if (!el) return;
  const top = el.offsetTop + actProgress(i) * (el.offsetHeight - window.innerHeight);
  if (lenis) lenis.scrollTo(top, { duration: 1.6 });
  else window.scrollTo({ top, behavior: "smooth" });
}

/**
 * The classic site's acts. Wide screens: a pinned stage — the case study on the left, its screen on
 * the right, flown in and out like scenery as you scroll. Narrow screens: one case study after another.
 */
export function CaseStudiesFlat() {
  const wrap = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const lenis = useLenis();
  const fill = useRef<HTMLSpanElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const screens = gsap.utils.toArray<HTMLElement>("[data-act-screen]", wrap.current);
        const proxy = { p: 0 };
        let last = -1;
        const render = () => {
          const p = proxy.p * ACTS;
          screens.forEach((el, i) => {
            const f = fly(i, p);
            gsap.set(el, { yPercent: -125 * f.up, rotate: f.up * (i % 2 ? 1.5 : -1.5), autoAlpha: f.visible ? 1 : 0 });
          });
          if (fill.current) gsap.set(fill.current, { scaleX: proxy.p });
          const a = actAt(proxy.p);
          if (a !== last) setActive((last = a));
        };
        gsap.to(proxy, {
          p: 1,
          ease: "none",
          onUpdate: render,
          scrollTrigger: { trigger: wrap.current, start: "top top", end: "bottom bottom", scrub: 0.8 },
        });
        render();
      });
      return () => mm.revert();
    },
    { scope: wrap },
  );

  return (
    <>
      {/* wide: the pinned stage */}
      <section ref={wrap} className="relative hidden lg:block motion-reduce:lg:hidden" style={{ height: `${ACTS * 120}vh` }} aria-label="Case studies">
        <div className="sticky top-0 h-screen overflow-hidden">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(45%_55%_at_68%_40%,rgb(217_185_138/0.12),transparent_70%)]" />
          <div className="mx-auto grid h-full max-w-[1400px] grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-center gap-14 px-10 pt-20 pb-24">
            <div className="grid">
              {work.map((c, i) => <CaseStudyPanel key={c.id} c={c} i={i} active={i === active} />)}
            </div>
            <div className="relative aspect-[16/10] [perspective:1600px]">
              {/* the battens the screens hang from */}
              <span aria-hidden className="absolute -top-[40vh] left-[18%] h-[40vh] w-px bg-champagne/25" />
              <span aria-hidden className="absolute -top-[40vh] right-[18%] h-[40vh] w-px bg-champagne/25" />
              {work.map((c, i) => (
                <div key={c.id} data-act-screen className="absolute inset-0 text-[16px] xl:text-[18px]" style={{ zIndex: i % 2 ? 2 : 1, visibility: i === 0 ? "visible" : "hidden" }}>
                  <WorkScreen c={c} i={i} />
                </div>
              ))}
              <div aria-hidden className="absolute -inset-x-6 -bottom-10 h-10 rounded-[50%] bg-champagne/10 blur-xl" />
            </div>
          </div>
          <ActBar active={active} onGo={(i) => scrollToAct(wrap.current, i, lenis)} fill={(el) => (fill.current = el)} />
        </div>
      </section>

      {/* narrow, or reduced motion: one after another */}
      <section className="space-y-24 px-6 py-24 lg:hidden motion-reduce:lg:block lg:mx-auto lg:max-w-5xl" aria-label="Case studies">
        {work.map((c, i) => (
          <Reveal key={c.id} className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="aspect-[16/10] text-[12px] md:text-[15px]">
              <WorkScreen c={c} i={i} />
            </div>
            <div className="grid">
              <CaseStudyPanel c={c} i={i} active />
            </div>
          </Reveal>
        ))}
      </section>
    </>
  );
}

export { scrollToAct };
