import { useEffect, useRef, type ReactNode } from "react";
import { world } from "~/components/three/world";

/**
 * Sets how dark the 3D world behind this section should be while the section crosses the
 * middle of the screen — 0 to show the room (the curtain, the corridor), ~0.85 for reading.
 */
export function ScrimZone({ value, children, className = "" }: { value: number; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let mine = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          world.scrimOverride = value;
          mine = true;
        } else if (mine && world.scrimOverride === value) {
          world.scrimOverride = null;
          mine = false;
        }
        window.dispatchEvent(new Event("tbc:scrim"));
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (mine) {
        world.scrimOverride = null;
        window.dispatchEvent(new Event("tbc:scrim"));
      }
    };
  }, [value]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
