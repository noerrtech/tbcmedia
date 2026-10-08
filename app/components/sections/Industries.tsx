import { motion } from "framer-motion";
import { useRef } from "react";
import { industries } from "~/content/site";
import { Reveal, RevealLines } from "~/components/ui/Reveal";

export function Industries() {
  const ref = useRef<HTMLUListElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 md:px-10">
      <div className="mb-16 text-center">
        <Reveal><p className="eyebrow">Industries we've worked with</p></Reveal>
        <RevealLines
          lines={["Different industries.", "The same growth mindset."]}
          className="display mt-6 text-4xl md:text-6xl"
        />
        <Reveal delay={0.2}>
          <p className="mx-auto mt-6 max-w-xl text-mist">
            We don't specialise in one industry. <span className="text-ivory">We specialise in growth problems.</span>
          </p>
        </Reveal>
      </div>

      <ul
        ref={ref}
        onPointerMove={onMove}
        className="group/grid relative grid grid-cols-2 gap-px overflow-hidden border border-line bg-line md:grid-cols-4"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500 group-hover/grid:opacity-100"
          style={{ background: "radial-gradient(260px circle at var(--mx) var(--my), rgb(234 214 173 / 0.12), transparent 70%)" }}
        />
        {industries.map((ind, i) => (
          <motion.li
            key={ind.name}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: i * 0.07 }}
            className={`group relative flex aspect-[4/3] flex-col justify-between overflow-hidden bg-gradient-to-br ${ind.tone} to-coal p-5 md:aspect-[5/4] md:p-7`}
          >
            <span className="text-[0.6rem] tracking-[0.3em] text-gold">{String(i + 1).padStart(2, "0")}</span>
            <span aria-hidden className="absolute right-4 bottom-3 font-display text-[7rem] leading-none text-ivory/[0.04] transition-all duration-700 group-hover:text-champagne/10 md:text-[10rem]">
              {ind.name[0]}
            </span>
            <span className="relative font-display text-xl leading-tight text-ivory md:text-3xl">{ind.name}</span>
            <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gold transition-transform duration-700 group-hover:scale-x-100" />
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
