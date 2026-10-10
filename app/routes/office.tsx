import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigationType, useOutlet } from "react-router";
import { Header } from "~/components/layout/Header";
import { Passage } from "~/components/office/Passage";
import { OfficeContext } from "~/components/office/OfficeContext";
import { LogoMark } from "~/components/ui/Logo";
import { goTo, stationForPath, world, type Direction, type StationKey } from "~/components/three/world";
import { rooms } from "~/content/site";
import { dur, ease } from "~/lib/motion";
import { ScrollTrigger } from "~/lib/gsap";
import { isHandheld } from "~/lib/device";
import { use3D } from "~/lib/use-3d";

const OfficeCanvas = lazy(() => import("~/components/three/OfficeCanvas"));

/** If the 3D world throws (driver, context loss, missing asset), quietly fall back. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Shown while the world loads — and server-rendered, so there's no blank flash. */
export function LightsComingOn() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-ink">
      <LogoMark className="animate-flicker w-32" />
      <p className="eyebrow">The lights are coming on</p>
    </div>
  );
}

/**
 * Don't keep anyone waiting on a slow connection: after 15s of actually looking at the page,
 * fall back to the CSS rooms. (A background tab doesn't render, so it doesn't count.)
 */
function useLoadTimeout(active: boolean, onTimeout: () => void) {
  useEffect(() => {
    if (!active) return;
    let left = isHandheld() ? 25000 : 15000; // phones on mobile data get longer to build the world
    let started: number | null = null;
    let id = 0;
    const run = () => {
      if (started !== null) return;
      started = performance.now();
      id = window.setTimeout(onTimeout, left);
    };
    const pause = () => {
      if (started === null) return;
      window.clearTimeout(id);
      left -= performance.now() - started;
      started = null;
    };
    const onVisibility = () => (document.visibilityState === "visible" ? run() : pause());
    if (document.visibilityState === "visible") run();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active, onTimeout]);
}

/**
 * Darkens the 3D world behind a room's words: light at the top so the room is seen,
 * deeper as you scroll into the content. Sections can ask for their own level (ScrimZone).
 * Scroll moves it instantly (the scroll is the animation); a section change fades it over
 * 300ms; a revisit's cut (world.fade) dips it to black.
 */
function Scrim({ station }: { station: StationKey }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    let level = 0;
    let lastFade = -1;
    const compute = () => {
      const vh = window.innerHeight || 1;
      world.scroll = window.scrollY / vh;
      const base = station === "reception" ? 0 : 0.5 + 0.36 * Math.min(1, world.scroll);
      level = world.scrimOverride ?? base;
    };
    const apply = (fade: boolean) => {
      const el = ref.current;
      if (!el) return;
      el.style.transition = fade ? "opacity 300ms cubic-bezier(0.23, 1, 0.32, 1)" : "none";
      el.style.opacity = String(Math.max(level, world.fade));
    };
    const onScroll = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          compute();
          apply(false);
        });
    };
    const onZone = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = 0;
        compute();
        apply(true);
      });
    };
    // follow a cut's dip to black frame by frame
    let watch = 0;
    const follow = () => {
      if (world.fade !== lastFade) {
        lastFade = world.fade;
        apply(false);
      }
      watch = requestAnimationFrame(follow);
    };
    compute();
    apply(true);
    watch = requestAnimationFrame(follow);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("tbc:scrim", onZone);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(watch);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("tbc:scrim", onZone);
    };
  }, [station]);
  return <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[1] bg-ink" />;
}

/** Walking order of the office — deeper rooms are "forward", shallower ones "back". */
const depth = (path: string | null) => Math.max(0, rooms.findIndex((r) => r.path === path));

/** The interactive office: every room is a child route, all inside one 3D world. */
export default function Office() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const detected = use3D();
  const [failed, setFailed] = useState(false);
  const mode = failed ? "classic" : detected;
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onFail = useCallback(() => setFailed(true), []);
  useLoadTimeout(mode === "3d" && !ready, onFail);

  const station = stationForPath[pathname] ?? "reception";

  // Which way you're going: browser Back/Forward is "back"; otherwise deeper rooms are forward.
  const navType = useNavigationType();
  const prevPath = useRef<string | null>(null);
  const dir = useRef<{ for: string; value: Direction }>({ for: "", value: "forward" });
  if (dir.current.for !== pathname) {
    const value: Direction =
      prevPath.current === null ? "forward" : navType === "POP" || depth(pathname) < depth(prevPath.current) ? "back" : "forward";
    dir.current = { for: pathname, value };
  }
  const direction = dir.current.value;

  useLayoutEffect(() => {
    goTo(station, dir.current.value);
    prevPath.current = pathname;
  }, [station, pathname]);

  const three = mode === "3d";

  // The film grain is for the flat pages — over the 3D it's just more motion.
  useEffect(() => {
    if (!three) return;
    document.body.classList.remove("grain");
    return () => document.body.classList.add("grain");
  }, [three]);

  // In the 3D office the next room's page mounts only once the camera arrives: mounting is
  // the heaviest moment of a page change, and doing it mid-walk would stall the walk.
  // Timed off the walk that's actually running (it may have started on the click).
  const [arrived, setArrived] = useState(pathname);
  useEffect(() => {
    if (!three) return setArrived(pathname);
    const tr = world.travel;
    const remaining = tr ? tr.start + tr.duration * 1000 - performance.now() : 0;
    const id = window.setTimeout(() => setArrived(pathname), Math.max(0, remaining - 250));
    return () => window.clearTimeout(id);
  }, [pathname, three]);
  const showPage = !three || arrived === pathname;

  // 16px in the direction of travel: deeper rises from below, back settles from above.
  const still = useReducedMotion() ?? false;
  const shift = (d: Direction, entering: boolean) => (still ? 0 : entering ? (d === "back" ? -16 : 16) : d === "back" ? 8 : -8);
  const page: Variants = {
    initial: (d: Direction) => ({ opacity: 0, transform: `translateY(${shift(d, true)}px)` }),
    // transform cleared once in: a leftover transform would break pinned (position: fixed) sections
    enter: { opacity: 1, transform: "translateY(0px)", transition: { duration: dur.page, ease: ease.out, delay: three ? 0 : 0.45 }, transitionEnd: { transform: "none" } },
    exit: (d: Direction) => ({ opacity: 0, transform: `translateY(${shift(d, false)}px)`, transition: { duration: dur.exit, ease: ease.out } }),
  };

  return (
    <OfficeContext.Provider value={{ mode, ready: mode === "classic" || ready }}>
      <div className={three ? "min-h-screen" : "room-light min-h-screen"}>
        <Header variant="office" />

        {three && (
          <div aria-hidden className="fixed inset-0 z-0">
            <SceneBoundary onError={onFail}>
              <Suspense fallback={null}>
                <OfficeCanvas onReady={onReady} />
              </Suspense>
            </SceneBoundary>
          </div>
        )}
        {three && <Scrim station={station} />}

        <AnimatePresence mode="wait" initial={false} custom={direction} onExitComplete={() => requestAnimationFrame(() => ScrollTrigger.refresh())}>
          <motion.main
            key={pathname}
            className="relative z-10"
            custom={direction}
            variants={page}
            initial={three ? false : "initial"}
            animate="enter"
            exit="exit"
          >
            {three ? (
              showPage && (
                <motion.div custom={direction} variants={page} initial="initial" animate="enter">
                  {outlet}
                </motion.div>
              )
            ) : (
              outlet
            )}
          </motion.main>
        </AnimatePresence>

        {/* the lights coming on, until the world is built */}
        <AnimatePresence>
          {(mode === "pending" || (three && !ready)) && (
            <motion.div className="fixed inset-0 z-40" exit={{ opacity: 0, transition: { duration: 0.9 } }}>
              <LightsComingOn />
            </motion.div>
          )}
        </AnimatePresence>

        {!three && mode !== "pending" && <Passage direction={direction} />}
      </div>
    </OfficeContext.Provider>
  );
}
