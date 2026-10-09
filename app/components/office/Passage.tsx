import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { rooms } from "~/content/site";

/**
 * The "camera travelling through the building" moment between rooms:
 * a rush of doorframes towards the viewer with the next room's name — or, going back,
 * the doorframes receding behind you.
 */
export function Passage({ direction = "forward" }: { direction?: "forward" | "back" }) {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const first = useRef(true);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setRun((n) => n + 1);
  }, [pathname]);

  if (run === 0 || reduce) return null;
  const room = rooms.find((r) => r.path === pathname);
  const back = direction === "back";

  return (
    <motion.div
      key={run}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[55] overflow-hidden bg-ink"
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0] }}
      transition={{ duration: 1.25, times: [0, 0.55, 1], ease: "easeInOut" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(40%_50%_at_50%_50%,rgb(201_164_106/0.25),transparent_70%)]" />
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 h-[46vh] w-[26vh] -translate-x-1/2 -translate-y-1/2 rounded-t-full border border-champagne/50 shadow-[0_0_40px_rgba(234,214,173,0.15)]"
          initial={{ scale: 0.15, opacity: 0 }}
          animate={{ scale: back ? [5, 1, 0.15] : [0.15, 1, 5], opacity: [0, 1, 0] }}
          transition={{ duration: 1.05, delay: (back ? 5 - i : i) * 0.09, ease: [0.55, 0, 0.9, 0.4] }}
        />
      ))}
      {/* light streaks along the floor */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.span
          key={`s${i}`}
          className="absolute top-1/2 left-1/2 h-px w-[40vw] origin-left bg-gradient-to-r from-champagne/60 to-transparent"
          style={{ rotate: 25 + i * 40 }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: back ? [1, 0] : [0, 1], opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.9, delay: 0.1 + i * 0.05, ease: "easeIn" }}
        />
      ))}
      {room && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1.02, 1.1] }}
          transition={{ duration: 1.3, times: [0, 0.3, 0.7, 1] }}
        >
          <p className="eyebrow">Room {room.no}</p>
          <p className="display mt-4 text-4xl md:text-6xl">{room.name}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
