import { motion } from "framer-motion";
import { capabilities } from "~/content/site";

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
