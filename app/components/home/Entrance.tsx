import { motion, useAnimate } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router";
import { brand, founderStats } from "~/content/site";
import { CountUp } from "~/components/ui/CountUp";
import { Reveal, RevealLines } from "~/components/ui/Reveal";
import { dur, ease as easing } from "~/lib/motion";

const ease = easing.out;

/**
 * Screen 01 — the classic home's opening, as in the Mughal Noir mockup: a centred promise,
 * one gold button into the office, a quiet link to keep scrolling, then the numbers panel.
 */
export function Entrance() {
  const navigate = useNavigate();
  const [scope, animate] = useAnimate();
  const [entering, setEntering] = useState(false);

  const enter = async () => {
    if (entering) return;
    setEntering(true);
    await Promise.all([
      animate("[data-copy]", { opacity: 0, y: -16 }, { duration: dur.exit, ease }),
      animate("[data-fade]", { opacity: [0, 1] }, { duration: 0.6, delay: 0.15, ease }),
    ]);
    navigate("/tbc");
  };

  return (
    <section ref={scope} className="relative" aria-label="Entrance">
      <div data-copy className="mx-auto flex max-w-[1100px] flex-col items-center px-6 pt-40 pb-20 text-center md:pt-48 md:pb-28">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: dur.page, ease }}
          className="font-display text-base font-semibold text-champagne"
        >
          {brand.label}
        </motion.p>
        <RevealLines
          immediate
          as="h1"
          delay={0.15}
          lines={["We make brands", "that people remember."]}
          className="display title-xl mt-6 text-ivory"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: dur.page, ease }}
          className="mt-6 text-mist"
        >
          {brand.subline}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: dur.page, ease }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4"
        >
          <button type="button" onClick={enter} className="btn btn-solid">
            Enter TBC
          </button>
          <a href="#growth" className="text-sm font-medium text-ivory underline decoration-champagne underline-offset-[6px] hover:text-champagne">
            Take the traditional route
          </a>
        </motion.div>
      </div>

      {/* the numbers panel */}
      <div className="mx-auto max-w-[1100px] px-6">
        <Reveal className="grid gap-x-12 gap-y-10 border border-line bg-umber px-6 py-10 sm:grid-cols-2 md:px-12 md:py-14">
          {founderStats.map((s) => (
            <div key={s.label}>
              <CountUp value={s.value} suffix={s.suffix} className="stat-num block" />
              <p className="stat-label mt-3">
                {s.label}
                {s.note && <span className="soft"> {s.note}</span>}
              </p>
            </div>
          ))}
        </Reveal>
      </div>

      <div data-fade aria-hidden className="pointer-events-none fixed inset-0 z-[70] bg-ink opacity-0" />
    </section>
  );
}
