import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const format = (n: number) => Math.round(n).toLocaleString("en-IN");

export function CountUp({ value, suffix = "", duration = 2.2, className = "" }: { value: number; suffix?: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(format(value));
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!inView || reduce) return;
    setStarted(true);
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(format(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, value, duration]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "lining-nums tabular-nums" }}>
      <span style={{ opacity: started || reduce ? 1 : 0 }}>{display}</span>
      {suffix}
    </span>
  );
}
