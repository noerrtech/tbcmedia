import { motion } from "framer-motion";
import { beliefs, founder, principles } from "~/content/site";
import { Reveal, RevealLines } from "~/components/ui/Reveal";

/** Handwritten journey with hand-drawn connectors, as in the "Why TBC exists" mockup. */
function Journey() {
  return (
    <ol className="relative space-y-7 pl-10">
      <motion.svg
        aria-hidden
        viewBox="0 0 30 400"
        preserveAspectRatio="none"
        className="absolute top-2 left-0 h-[calc(100%-1rem)] w-7 text-gold"
      >
        <motion.path
          d="M22 4 C 2 40, 2 70, 22 90 S 2 150, 22 180 S 2 240, 22 270 S 2 330, 22 360 L 22 396"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2.4, ease: "easeInOut" }}
        />
      </motion.svg>
      {founder.journey.map((step, i) => (
        <motion.li
          key={step}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 + i * 0.35, duration: 0.8 }}
          className="font-script text-3xl text-champagne md:text-4xl"
        >
          {step}
        </motion.li>
      ))}
    </ol>
  );
}

export function WhyTBC() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 md:px-10">
      <div className="grid items-center gap-16 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <Reveal><p className="eyebrow">About</p></Reveal>
          <RevealLines lines={["Why", "TBC exists"]} className="display mt-6 text-5xl md:text-8xl" />
          <Reveal delay={0.2}>
            <p className="mt-10 max-w-xl font-display text-2xl leading-snug text-ivory/90 md:text-3xl">{beliefs.body}</p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-8 max-w-xl space-y-4 text-mist">
              {founder.philosophy.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>
        </div>
        <Journey />
      </div>

      <div className="mt-32">
        <div className="flex items-end justify-between gap-6 border-b border-line pb-6">
          <RevealLines lines={["The TBC way"]} className="display text-3xl md:text-5xl" />
          <Reveal><p className="eyebrow hidden md:block">Four principles</p></Reveal>
        </div>
        <ol className="grid md:grid-cols-2 lg:grid-cols-4">
          {principles.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 0.12} className="group relative border-b border-line py-10 lg:border-r lg:border-b-0 lg:px-8 lg:first:pl-0 lg:last:border-r-0">
              <span className="text-[0.65rem] tracking-[0.3em] text-gold">0{i + 1}</span>
              <p className="mt-6 font-display text-3xl leading-tight text-ivory">{p.title}</p>
              <p className="mt-4 text-sm leading-relaxed text-mist">{p.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </div>
  );
}
