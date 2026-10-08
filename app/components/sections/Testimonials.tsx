import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { testimonials } from "~/content/site";
import { Reveal, RevealLines } from "~/components/ui/Reveal";

export function Testimonials() {
  const [[i, dir], set] = useState<[number, number]>([0, 1]);
  const go = (d: number) => set(([n]) => [(n + d + testimonials.length) % testimonials.length, d]);
  const t = testimonials[i];

  return (
    <div className="mx-auto max-w-5xl px-6 text-center">
      <Reveal><p className="eyebrow">Testimonials</p></Reveal>
      <RevealLines lines={["What our clients say"]} className="display mt-6 text-4xl md:text-6xl" />

      <div className="relative mt-16 flex items-center gap-4 md:gap-10">
        <button type="button" onClick={() => go(-1)} aria-label="Previous testimonial" className="flex h-12 w-12 shrink-0 items-center justify-center border border-line text-champagne transition-colors hover:bg-champagne hover:text-ink">
          ←
        </button>
        <div className="panel relative min-h-[18rem] flex-1 overflow-hidden px-6 py-12 md:px-16">
          <span aria-hidden className="absolute top-4 left-6 font-display text-8xl leading-none text-gold/30">“</span>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.figure
              key={i}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <blockquote className="font-display text-2xl leading-snug text-ivory md:text-3xl">{t.quote}</blockquote>
              <figcaption className="mt-8 text-[0.65rem] tracking-[0.28em] text-mist uppercase">
                — {t.name}, {t.company}
                {t.placeholder && <span className="ml-3 border border-gold/40 px-2 py-0.5 text-gold">Placeholder</span>}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        <button type="button" onClick={() => go(1)} aria-label="Next testimonial" className="flex h-12 w-12 shrink-0 items-center justify-center border border-line text-champagne transition-colors hover:bg-champagne hover:text-ink">
          →
        </button>
      </div>
      <p className="mt-6 text-xs tracking-[0.3em] text-mist" aria-live="polite">
        {String(i + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
      </p>
    </div>
  );
}
