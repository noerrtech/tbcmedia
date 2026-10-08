import { motion, useAnimate, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { brand } from "~/content/site";
import { Monogram } from "~/components/ui/Logo";
import { RevealLines } from "~/components/ui/Reveal";
import { Arrow } from "~/components/ui/Arrow";

const ease = [0.22, 1, 0.36, 1] as const;

/** Screen 01 — the TBC entrance. An arch of warm light; step through it to enter the office. */
export function Entrance() {
  const ref = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const [scope, animate] = useAnimate();
  const [entering, setEntering] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const archScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const enter = async () => {
    if (entering) return;
    setEntering(true);
    await Promise.all([
      animate("[data-copy]", { opacity: 0, y: -20 }, { duration: 0.5, ease }),
      animate("[data-arch]", { scale: 9 }, { duration: 1.4, ease: [0.7, 0, 0.3, 1], delay: 0.15 }),
      animate("[data-whiteout]", { opacity: [0, 0, 1] }, { duration: 1.4, times: [0, 0.6, 1], delay: 0.15 }),
    ]);
    navigate("/tbc");
  };

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[640px] overflow-hidden" aria-label="Entrance">
      <div ref={scope} className="absolute inset-0">
        {/* walls */}
        <div aria-hidden className="fluted absolute inset-0 opacity-70" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_45%,transparent_30%,rgb(10_8_7/0.95)_75%)]" />

        {/* the arch */}
        <motion.div style={{ scale: archScale }} className="absolute inset-0 flex items-end justify-center">
          <div
            data-arch
            className="relative h-[82%] w-[min(78vw,560px)] origin-[50%_45%] overflow-hidden rounded-t-[999px] border border-champagne/25 shadow-[0_0_120px_-10px_rgba(234,214,173,0.35)]"
            style={{
              background:
                "radial-gradient(70% 55% at 50% 30%, #6e5232 0%, #3a2a1b 40%, #17110c 75%), #0a0807",
            }}
          >
            {/* inner arch frames, receding */}
            <div aria-hidden className="absolute inset-x-[9%] top-[6%] bottom-0 rounded-t-[999px] border border-champagne/15" />
            <div aria-hidden className="absolute inset-x-[20%] top-[14%] bottom-0 rounded-t-[999px] border border-champagne/10" />
            <div aria-hidden className="animate-flicker absolute inset-x-[30%] top-[22%] bottom-0 rounded-t-[999px] bg-[radial-gradient(60%_60%_at_50%_30%,rgb(246_230_195/0.5),transparent_70%)]" />
            <div aria-hidden className="floor absolute inset-x-0 bottom-0 h-1/4 opacity-80" />
          </div>
        </motion.div>

        {/* copy */}
        <motion.div data-copy style={{ opacity: fade }} className="absolute inset-0 flex flex-col items-center justify-center px-6 pt-16 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ duration: 1.8, ease }}>
            <Monogram className="gold-text text-7xl drop-shadow-[0_0_30px_rgba(234,214,173,0.35)] md:text-8xl" />
            <p className="mt-3 text-[0.6rem] tracking-[0.5em] text-ivory/70 uppercase">{brand.name}</p>
          </motion.div>

          <RevealLines
            immediate
            as="h1"
            delay={0.6}
            lines={["We make", "brands grow."]}
            className="display mt-10 text-5xl text-ivory md:text-7xl"
          />
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 1 }} className="mt-6 text-[0.7rem] tracking-[0.34em] text-champagne uppercase">
            {brand.label}
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 1 }} className="mt-3 text-sm text-ivory/70">
            {brand.pillars.join("  •  ")}
          </motion.p>
          <motion.button
            type="button"
            onClick={enter}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.9, duration: 0.9, ease }}
            className="btn mt-10 bg-ink/40 backdrop-blur-sm"
          >
            Enter TBC <Arrow />
          </motion.button>
        </motion.div>

        <motion.a
          href="#why"
          style={{ opacity: fade }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4 }}
          className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 text-[0.65rem] tracking-[0.28em] text-mist uppercase hover:text-ivory"
        >
          Prefer the traditional route? Scroll down
          <motion.span animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2 }}>↓</motion.span>
        </motion.a>

        <div data-whiteout aria-hidden className="pointer-events-none absolute inset-0 bg-[#f6e6c3] opacity-0" />
      </div>
    </section>
  );
}
