import Lenis from "lenis";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router";
import { gsap, ScrollTrigger } from "./gsap";

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

/** Lenis smooth scrolling, driven by the GSAP ticker so ScrollTrigger stays in sync. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const instance = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, anchors: { offset: -40 } });
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(instance);
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  // Every room / page starts at the top.
  useEffect(() => {
    if (hash) return;
    lenis?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }, [pathname, hash, lenis]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
