import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { brand, receptionOptions } from "~/content/site";
import { LogoMark } from "~/components/ui/Logo";
import { SpeechBubble } from "~/components/office/Concierge";
import { Arrow } from "~/components/ui/Arrow";
import { useOffice } from "~/components/office/OfficeContext";
import { doorForPath } from "~/components/three/doors";
import { goTo, stationForPath, world } from "~/components/three/world";
import { dur, ease as easing } from "~/lib/motion";
import type { Route } from "./+types/office.reception";

export const meta: Route.MetaFunction = () => [{ title: "Reception — The Brand Cappuccino" }];

const ease = [0.22, 1, 0.36, 1] as const;

const replies: Record<string, string> = {
  "/tbc/founder": "Riya's cabin is just down the hall. Right this way.",
  "/tbc/work": "The screening corridor. Follow me.",
  "/tbc/services": "Let's start with what we do. This way.",
  "/tbc/jbn": "Oh, you're here through JBN? Come with me.",
  "/tbc/next": "Of course. Let's get you started.",
};

/** The concierge's script: greet, ask, then offer the options. */
function useConcierge(started: boolean) {
  const [line, setLine] = useState("Hi. Welcome to TBC.");
  const [showOptions, setShowOptions] = useState(false);
  useEffect(() => {
    if (!started) return;
    const a = window.setTimeout(() => setLine("Hi. Welcome to TBC. What brings you in today?"), 900);
    const b = window.setTimeout(() => setShowOptions(true), 1400);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [started]);
  return { line, setLine, showOptions };
}

export default function Reception() {
  const navigate = useNavigate();
  const { mode, ready } = useOffice();
  const three = mode === "3d";
  const [leaving, setLeaving] = useState<string | null>(null);
  const { line, setLine, showOptions } = useConcierge(ready);

  // leaving the lobby: nothing is being considered any more
  useEffect(() => () => void (world.hovered = null), []);

  const choose = (to: string) => {
    if (leaving) return;
    setLeaving(to);
    setLine(replies[to]);
    // 3D: the camera sets off on the click itself; the page follows while she's speaking
    if (three) goTo(stationForPath[to]);
    window.setTimeout(() => navigate(to), three ? 450 : 700);
  };

  if (mode === "pending") return <section className="h-[100svh] min-h-[640px]" aria-busy="true" />;
  if (!three) return <ClassicLobby line={line} showOptions={showOptions} leaving={Boolean(leaving)} choose={choose} />;

  // The lobby itself is the 3D world behind this page (see the office layout).
  return (
    <section className="relative h-[100svh] min-h-[640px] overflow-hidden" aria-label="TBC reception">
      <h1 className="sr-only">{brand.headline} The Brand Cappuccino reception</h1>

      {/* legibility scrim for the options */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-ink via-ink/75 to-transparent" />

      {/* the promise first — it gives way to the options */}
      <AnimatePresence>
        {ready && !showOptions && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-[22%] px-6 text-center [text-shadow:0_2px_30px_rgb(0_0_0/0.8)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: dur.page, ease: easing.out } }}
            exit={{ opacity: 0, transition: { duration: dur.exit, ease: easing.out } }}
          >
            <p className="display title-xl">{brand.headline}</p>
            <p className="mt-3 text-[0.7rem] tracking-[0.34em] text-champagne uppercase">{brand.label}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {ready && (
        <>
          {/* the concierge stands behind the desk */}
          <div className="absolute inset-x-0 top-[43%] flex justify-center px-6">
            <SpeechBubble text={line} />
          </div>

          <div className="absolute inset-x-0 bottom-0 px-6 pb-8 md:px-10">
            <Options
              show={showOptions}
              leaving={Boolean(leaving)}
              choose={choose}
              onHover={(to) => (world.hovered = to ? doorForPath[to] : null)}
              layout="bar"
            />
            <motion.a
              href="/"
              className="link-underline mx-auto mt-6 block w-fit text-center text-[0.62rem] tracking-[0.28em] text-mist uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: showOptions ? 1 : 0 }}
              transition={{ delay: 0.8 }}
            >
              Prefer the traditional route? Take the classic site →
            </motion.a>
          </div>
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------------- */

/** The receptionist at her laptop, drawn flat for the CSS lobby (twin of the 3D figure). */
function Receptionist({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 112" className={className} aria-hidden>
      {/* hair bun, head, neck */}
      <circle cx="74" cy="22" r="7" fill="#1a100b" />
      <ellipse cx="64" cy="26" rx="11" ry="13.5" fill="#d6bfa4" />
      <path d="M53 25c0-9 5-14 11.5-14S76 16 76 25c-3-5-7-7-11.5-7S56 20 53 25Z" fill="#1a100b" />
      <rect x="60" y="38" width="9" height="9" rx="3" fill="#d6bfa4" />
      {/* blazer, with a V of blouse */}
      <path d="M38 112V68c0-14 10-22 26-22s26 8 26 22v44Z" fill="#2a1c14" />
      <path d="M58 46h12l-6 12Z" fill="#D9B98A" />
      {/* arms reaching to the laptop */}
      <path d="M44 66c-6 12-8 24-4 34l18-2" fill="none" stroke="#2a1c14" strokeWidth="9" strokeLinecap="round" />
      <path d="M84 66c2 14-6 26-24 33" fill="none" stroke="#2a1c14" strokeWidth="9" strokeLinecap="round" />
      {/* the laptop lid, logo towards us */}
      <path d="M14 112l6-34h40l-4 34Z" fill="#3d3f42" />
      <circle cx="37" cy="95" r="3.2" fill="#F5A623" />
    </svg>
  );
}

function Options({
  show,
  leaving,
  choose,
  onHover,
  layout,
}: {
  show: boolean;
  leaving: boolean;
  choose: (to: string) => void;
  onHover?: (to: string | null) => void;
  layout: "grid" | "bar";
}) {
  const bar = layout === "bar";
  return (
    <AnimatePresence>
      {show && (
        <motion.ul
          className={bar ? "mx-auto grid max-w-[1400px] gap-3 md:grid-cols-5" : "grid gap-3 md:grid-cols-2"}
          initial="hidden"
          animate={leaving ? "leave" : "show"}
          variants={{ show: { transition: { staggerChildren: 0.06 } }, leave: { transition: { staggerChildren: 0.03 } } }}
          aria-label="What are you looking for?"
        >
          {receptionOptions.map((o, i) => (
            <motion.li
              key={o.to}
              className={!bar && i === receptionOptions.length - 1 ? "md:col-span-2" : ""}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
                leave: { opacity: 0, y: 12, transition: { duration: 0.3 } },
              }}
            >
              <button
                type="button"
                onClick={() => choose(o.to)}
                onMouseEnter={() => onHover?.(o.to)}
                onMouseLeave={() => onHover?.(null)}
                onFocus={() => onHover?.(o.to)}
                onBlur={() => onHover?.(null)}
                className={`panel group flex w-full text-left transition-colors duration-200 hover:border-gold/60 focus-visible:border-gold/60 ${
                  bar ? "h-full flex-col gap-3 px-5 py-4" : "items-center gap-5 px-5 py-4 md:px-6 md:py-5"
                }`}
              >
                {bar && (
                  <span className="flex justify-end">
                    <Arrow className="text-champagne transition-transform duration-200 motion-safe:group-hover:translate-x-1" />
                  </span>
                )}
                <span className="flex-1">
                  <span className="block text-[0.68rem] font-semibold tracking-[0.22em] text-ivory uppercase">{o.title}</span>
                  <span className={`mt-1 block text-mist ${bar ? "text-xs leading-relaxed" : "text-sm"}`}>{o.body}</span>
                </span>
                {!bar && <Arrow className="text-champagne transition-transform duration-200 motion-safe:group-hover:translate-x-1" />}
              </button>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------------- */
/*  The CSS lobby — phones, no WebGL, or if the 3D scene can't load          */
/* ------------------------------------------------------------------------- */

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

function ClassicLobby({ line, showOptions, leaving, choose }: { line: string; showOptions: boolean; leaving: boolean; choose: (to: string) => void }) {
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
        <LogoMark className="animate-flicker w-28 md:w-36" />
        <p className="mt-3 text-[0.6rem] tracking-[0.5em] text-mist uppercase md:text-xs">{brand.name}</p>
      </motion.div>

      {/* The desk & concierge */}
      <div className="relative z-10 mx-auto mt-12 max-w-5xl px-6 md:mt-16">
        <div className="flex min-h-[7.5rem] items-end justify-center md:justify-start md:pl-[12%]">
          <SpeechBubble text={line} />
        </div>
        <motion.div
          aria-hidden
          className="relative mt-28 h-16 rounded-t-sm border-t border-gold/50 bg-umber md:mt-5 md:h-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.9, ease }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-champagne/50" />
          <Receptionist className="absolute right-[10%] bottom-full w-28 md:right-[16%] md:w-36" />
          <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[0.55rem] tracking-[0.5em] text-gold/80 uppercase">Concierge</p>
        </motion.div>
      </div>

      {/* Options */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-6 pb-24">
        <Options show={showOptions} leaving={leaving} choose={choose} layout="grid" />
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
