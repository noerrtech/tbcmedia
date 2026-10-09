import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { capabilities, serviceLine, services, type Service } from "~/content/site";
import { Reveal, RevealLines } from "~/components/ui/Reveal";
import { Arrow } from "~/components/ui/Arrow";

import { dur, ease as easing, stagger as STAGGER } from "~/lib/motion";

const ease = easing.out;

function Panel({ s, i, onOpen }: { s: Service; i: number; onOpen: () => void }) {
  const offset = i - (services.length - 1) / 2;
  return (
    <motion.li
      className="relative shrink-0 snap-center [perspective:1400px]"
      initial={{ opacity: 0, transform: "translateY(32px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, margin: "-5% 0px" }}
      transition={{ duration: dur.headline, ease, delay: Math.abs(offset) * STAGGER }}
    >
      {/* light cone from the ceiling */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-60 w-56 -translate-x-1/2 opacity-60 [mask-image:linear-gradient(180deg,transparent,#000_45%)]"
        style={{ background: "radial-gradient(50% 100% at 50% 0%, rgb(217 185 138 / 0.35), transparent 70%)" }}
      />
      <div className="animate-drift" style={{ animationDelay: `${i * -0.8}s` }}>
      <motion.button
        type="button"
        layoutId={`service-${s.no}`}
        onClick={onOpen}
        whileHover={{ y: -14, rotateY: 0, scale: 1.03 }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
        style={{ rotateY: offset * -5 }}
        className="group relative flex h-[26rem] w-60 flex-col overflow-hidden rounded-[2px] text-left text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] md:h-[24rem] md:w-[min(14.5rem,calc((100vw-14rem)/6))] xl:h-[26rem]"
      >
        <span
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 60% at 50% 0%, #fbf4e6, #e9dcc2 55%, #cdb994 100%)",
          }}
        />
        <span className="absolute inset-0 opacity-0 transition-opacity duration-250 group-hover:opacity-100" style={{ background: "radial-gradient(80% 50% at 50% 30%, rgb(255 255 255 / 0.55), transparent)" }} />
        <span className="relative flex h-full flex-col p-6 md:p-5 xl:p-6">
          <span className="font-display text-4xl font-bold text-bronze">{s.no}</span>
          <span className="mt-6 font-display text-2xl leading-tight font-semibold tracking-wide uppercase md:text-lg xl:text-xl 2xl:text-2xl">{s.title}</span>
          <span className="mt-3 text-sm leading-relaxed text-ink/70">{s.question}</span>
          <span className="mt-auto flex items-center gap-3 border-t border-ink/15 pt-4 text-[0.6rem] font-semibold tracking-[0.26em] uppercase">
            Explore <Arrow className="transition-transform duration-200 motion-safe:group-hover:translate-x-1" />
          </span>
        </span>
      </motion.button>
      </div>
      {/* floor reflection */}
      <div aria-hidden className="mx-auto mt-4 h-10 w-4/5 rounded-[50%] bg-champagne/10 blur-xl" />
    </motion.li>
  );
}

function Detail({ s, onClose }: { s: Service; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={s.title}
    >
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/80 backdrop-blur-md" />
      <motion.div
        layoutId={`service-${s.no}`}
        className="relative grid w-full max-w-5xl overflow-hidden text-ink md:grid-cols-[1fr_1.2fr]"
        style={{ background: "radial-gradient(120% 80% at 0% 0%, #fbf4e6, #e6d7ba 60%, #cdb994)" }}
      >
        <div className="border-b border-ink/10 p-8 md:border-r md:border-b-0 md:p-12">
          <p className="font-display text-5xl font-bold text-bronze">{s.no}</p>
          <h3 className="display title-lg mt-6">{s.title}</h3>
          <p className="mt-5 font-sans text-2xl italic text-ink/70">{s.question}</p>
        </div>
        <motion.div className="p-8 md:p-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }}>
          <p className="text-lg leading-relaxed text-ink/80">{s.detail}</p>
          <p className="mt-10 text-[0.65rem] font-semibold tracking-[0.3em] text-bronze uppercase">What you get</p>
          <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
            {s.outcomes.map((o) => (
              <li key={o} className="flex items-center justify-between py-3 text-sm">
                {o} <span className="text-bronze">—</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={onClose} className="mt-10 text-[0.65rem] font-semibold tracking-[0.3em] uppercase underline-offset-8 hover:underline">
            Close ✕
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function ServicesShowroom({ heading = true, quote = true }: { heading?: boolean; quote?: boolean }) {
  const [active, setActive] = useState<Service | null>(null);
  return (
    <div className="relative">
      {heading && (
        <div className="mx-auto mb-24 max-w-3xl px-6 text-center">
          <Reveal><p className="eyebrow">What we do</p></Reveal>
          <RevealLines lines={["What we do"]} className="display title-lg mt-6" />
          <Reveal delay={0.2}>
            <p className="mt-6 text-mist">Strategy, creativity and growth systems for ambitious brands.</p>
          </Reveal>
        </div>
      )}

      <ul className="no-scrollbar mx-auto flex max-w-[1600px] snap-x snap-mandatory items-end gap-6 overflow-x-auto px-6 pt-24 pb-6 md:pt-40 md:justify-center md:gap-4 md:overflow-visible xl:gap-7">
        {services.map((s, i) => (
          <Panel key={s.no} s={s} i={i} onOpen={() => setActive(s)} />
        ))}
      </ul>

      {quote && (
        <div className="mx-auto mt-24 max-w-4xl px-6 text-center">
          <RevealLines
            as="p"
            lines={[<>“{serviceLine.lead}</>, <span className="text-champagne">{serviceLine.follow}”</span>]}
            className="display title-lg"
          />
        </div>
      )}

      <AnimatePresence>{active && <Detail s={active} onClose={() => setActive(null)} />}</AnimatePresence>
    </div>
  );
}

/** Slow marquee of execution capabilities from the TBC profile. */
export function Capabilities() {
  const row = [...capabilities, ...capabilities];
  return (
    <div className="relative overflow-hidden border-y border-line py-8">
      <p className="sr-only">Execution capabilities: {capabilities.join(", ")}</p>
      <motion.div
        aria-hidden
        className="flex w-max gap-12 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 60, ease: "linear", repeat: Infinity }}
      >
        {row.map((c, i) => (
          <span key={i} className="flex items-center gap-12 font-display text-2xl font-semibold text-ivory/60 md:text-3xl">
            {c} <span className="text-gold not-italic">✦</span>
          </span>
        ))}
      </motion.div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}
