import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BubbleMark } from "~/components/ui/Logo";

/** Types a line out like someone speaking, then calls onDone. */
export function useTyped(text: string, { speed = 16, start = true } = {}) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOut(text);
      return;
    }
    setOut("");
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed, start]);
  return { out, done: out.length >= text.length };
}

/** The concierge's speech bubble — the TBC bubble, reimagined in brass and glass. */
export function SpeechBubble({ text, start = true, className = "" }: { text: string; start?: boolean; className?: string }) {
  const { out, done } = useTyped(text, { start });
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={text}
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`panel relative max-w-sm rounded-2xl rounded-bl-sm px-6 py-5 ${className}`}
        role="status"
        aria-live="polite"
      >
        <BubbleMark className="absolute -top-5 -left-5 h-9 w-12 text-gold" />
        <p className="font-display text-xl leading-snug text-ivory md:text-2xl">
          <span className="sr-only">{text}</span>
          <span aria-hidden>
            {out}
            {!done && <span className="ml-0.5 inline-block h-5 w-px translate-y-1 animate-pulse bg-champagne" />}
          </span>
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
