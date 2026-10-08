import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { brand, receptionOptions } from "~/content/site";
import { Monogram } from "~/components/ui/Logo";
import { SpeechBubble } from "~/components/office/Concierge";
import { Arrow } from "~/components/ui/Arrow";
import type { Route } from "./+types/office.reception";

export const meta: Route.MetaFunction = () => [{ title: "Reception — The Brand Cappuccino" }];

const ease = [0.22, 1, 0.36, 1] as const;

const replies: Record<string, string> = {
  "/tbc/founder": "Riya's cabin is just down the hall. Right this way.",
  "/tbc/work": "The screening corridor. Follow me.",
  "/tbc/services": "Let's start in the strategy library.",
  "/tbc/jbn": "Oh, you're here through JBN? Come with me.",
  "/tbc/next": "Of course. Straight to the action room.",
};

function Pendant({ x, delay }: { x: string; delay: number }) {
  return (
    <motion.div className="absolute top-0" style={{ left: x }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay, duration: 0.2 }}>
      <div className="mx-auto h-24 w-px bg-gradient-to-b from-transparent to-gold/50 md:h-36" />
      <motion.div
        className="h-3 w-3 -translate-x-1/2 rounded-full bg-champagne shadow-[0_0_30px_8px_rgba(234,214,173,0.45)]"
        animate={{ opacity: [0, 1, 0.6, 1] }}
        transition={{ delay, duration: 0.6, times: [0, 0.3, 0.5, 1] }}
      />
      <div className="absolute top-full left-0 h-72 w-72 -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(234_214_173/0.12),transparent)]" />
    </motion.div>
  );
}

export default function Reception() {
  const navigate = useNavigate();
  const [line, setLine] = useState("Hi. Welcome to TBC.");
  const [showOptions, setShowOptions] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const a = window.setTimeout(() => setLine("Hi. Welcome to TBC. What brings you in today?"), 1700);
    const b = window.setTimeout(() => setShowOptions(true), 2600);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  const choose = (to: string) => {
    if (leaving) return;
    setLeaving(true);
    setLine(replies[to]);
    window.setTimeout(() => navigate(to), 1300);
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* --- The lobby --- */}
      <div aria-hidden className="absolute inset-0">
        <div className="fluted absolute inset-y-0 left-0 w-[18%] opacity-80" />
        <div className="fluted absolute inset-y-0 right-0 w-[18%] opacity-80" />
        <div className="absolute inset-y-0 left-[18%] right-[18%] bg-[linear-gradient(180deg,#15110d,#0c0a08)]" />
        <motion.div
          className="absolute top-[8%] left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(201_164_106/0.22),transparent)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.4, delay: 0.4 }}
        />
        <Pendant x="28%" delay={0.2} />
        <Pendant x="50%" delay={0.45} />
        <Pendant x="72%" delay={0.7} />
        <div className="floor absolute inset-x-0 bottom-0 h-[30%]" />
      </div>

      {/* Back-wall signage */}
      <motion.div
        className="relative z-10 flex flex-col items-center pt-32 text-center md:pt-36"
        initial={{ opacity: 0, filter: "blur(12px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 2, delay: 0.6, ease }}
      >
        <Monogram className="gold-text animate-flicker text-7xl drop-shadow-[0_0_30px_rgba(234,214,173,0.35)] md:text-9xl" />
        <p className="mt-3 text-[0.6rem] tracking-[0.5em] text-mist uppercase md:text-xs">{brand.name}</p>
      </motion.div>

      {/* The desk & concierge */}
      <div className="relative z-10 mx-auto mt-12 max-w-5xl px-6 md:mt-16">
        <div className="flex min-h-[7.5rem] items-end justify-center md:justify-start md:pl-[12%]">
          <SpeechBubble text={line} />
        </div>
        <motion.div
          aria-hidden
          className="relative mt-5 h-16 rounded-t-sm border-t border-gold/50 bg-[linear-gradient(180deg,#2a2018,#120e0b)] shadow-[0_-20px_60px_-20px_rgba(234,214,173,0.25)] md:h-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.9, ease }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-champagne to-transparent" />
          <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[0.55rem] tracking-[0.5em] text-gold/80 uppercase">Concierge</p>
        </motion.div>
      </div>

      {/* Options */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-6 pb-24">
        <AnimatePresence>
          {showOptions && (
            <motion.ul
              className="grid gap-3 md:grid-cols-2"
              initial="hidden"
              animate={leaving ? "leave" : "show"}
              variants={{ show: { transition: { staggerChildren: 0.09 } }, leave: { transition: { staggerChildren: 0.03 } } }}
              aria-label="What are you looking for?"
            >
              {receptionOptions.map((o, i) => (
                <motion.li
                  key={o.to}
                  className={i === receptionOptions.length - 1 ? "md:col-span-2" : ""}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
                    leave: { opacity: 0, y: 12, transition: { duration: 0.4 } },
                  }}
                >
                  <button
                    type="button"
                    onClick={() => choose(o.to)}
                    className="panel group flex w-full items-center gap-5 px-5 py-4 text-left transition-colors duration-500 hover:border-gold/60 md:px-6 md:py-5"
                  >
                    <span className="font-display text-2xl text-gold">{o.no}</span>
                    <span className="flex-1">
                      <span className="block text-[0.7rem] font-semibold tracking-[0.24em] text-ivory uppercase">{o.title}</span>
                      <span className="mt-1 block text-sm text-mist">{o.body}</span>
                    </span>
                    <Arrow className="text-champagne transition-transform duration-500 group-hover:translate-x-1" />
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
        <motion.a
          href="/"
          className="mt-10 block text-center text-[0.65rem] tracking-[0.28em] text-mist uppercase link-underline"
          initial={{ opacity: 0 }}
          animate={{ opacity: showOptions ? 1 : 0 }}
          transition={{ delay: 0.8 }}
        >
          Prefer the traditional route? Take the classic site →
        </motion.a>
      </div>
    </section>
  );
}
