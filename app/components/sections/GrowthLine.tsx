import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { founderStats, serviceLine, services } from "~/content/site";
import { gsap, ScrollTrigger, useGSAP } from "~/lib/gsap";
import { line, rideAt, stopProgress, TUNNEL_AFTER } from "~/lib/growth-line";
import { useLenis } from "~/lib/smooth-scroll";

/**
 * WHAT WE DO — the TBC Growth Line.
 *
 * You sit in a night train. Scrolling drives it down the line: it slows into each station, the
 * station's sign stands in the window and the panel beside it says what TBC does there, then it pulls
 * away. The night lifts as it goes — fog at departure, a tunnel before Growth, first light at the end.
 *
 * Layers: interior (window frame, blind, sill) · exterior (sky, hills, city, fog, track side, stations)
 * · route map · content · atmosphere (glass sheen, tunnel reflections, motion blur, sway).
 * Under reduced motion the ride is replaced by a timetable of the same content.
 */

const n = line.stops.length;
const SCROLL_PER_UNIT = 0.75; // viewport heights of scroll per timeline unit

/* ---------------------------------------------------------------- scenery */

/** Small seeded random, so the prerendered page and the browser draw the same city. */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PAR = { far: 0.08, mid: 0.3 } as const;
const tunnel = { from: line.positions[TUNNEL_AFTER] + 0.72, to: line.positions[TUNNEL_AFTER + 1] - 0.72 };

function Hills() {
  const w = line.length * PAR.far + 1.4;
  const d = useMemo(() => {
    const W = w * 1000;
    let p = `M0 300 L0 170`;
    for (let x = 0; x <= W; x += 20) {
      const y = 150 + Math.sin(x / 260) * 38 + Math.sin(x / 97 + 1.3) * 14 + Math.sin(x / 610 + 0.4) * 30;
      p += ` L${x} ${y.toFixed(1)}`;
    }
    return `${p} L${W} 300 Z`;
  }, [w]);
  return (
    <svg className="absolute bottom-[20%] left-0 h-[42%]" style={{ width: `${w * 100}%` }} viewBox={`0 0 ${w * 1000} 300`} preserveAspectRatio="none">
      <path d={d} fill="#1B120D" />
    </svg>
  );
}

function City() {
  const w = line.length * PAR.mid + 1.4;
  const { blocks, lights } = useMemo(() => {
    const rnd = seeded(7);
    const blocks: { x: number; w: number; h: number }[] = [];
    const lights: { x: number; y: number }[] = [];
    let x = 0;
    while (x < w * 1000) {
      if (rnd() < 0.12) { x += 60 + rnd() * 140; continue; } // open ground between districts
      const bw = 18 + rnd() * 46;
      const bh = 30 + rnd() ** 1.6 * 150;
      blocks.push({ x, w: bw, h: bh });
      for (let ly = 300 - bh + 8; ly < 290; ly += 11) for (let lx = x + 4; lx < x + bw - 4; lx += 8) if (rnd() < 0.09) lights.push({ x: lx, y: ly });
      x += bw + rnd() * 6;
    }
    return { blocks, lights };
  }, [w]);
  return (
    <svg className="absolute bottom-[20%] left-0 h-[46%]" style={{ width: `${w * 100}%` }} viewBox={`0 0 ${w * 1000} 300`} preserveAspectRatio="none">
      {blocks.map((b, i) => <rect key={i} x={b.x} y={300 - b.h} width={b.w} height={b.h} fill="#120b07" />)}
      {lights.map((l, i) => <rect key={i} x={l.x} y={l.y} width="3" height="4" fill="#D9B98A" opacity={0.35 + ((i * 37) % 10) / 25} />)}
    </svg>
  );
}

/** Track-side poles between stations, skipping platforms and the tunnel. */
function Poles() {
  const xs: number[] = [];
  for (let x = -0.6; x < line.length + 0.6; x += 0.42) {
    const atStation = line.positions.some((p) => Math.abs(x - p) < 0.52);
    const inTunnel = x > tunnel.from - 0.05 && x < tunnel.to + 0.05;
    if (!atStation && !inTunnel) xs.push(x);
  }
  return (
    <>
      {xs.map((x) => (
        <div key={x} className="absolute bottom-[13%] h-[80%] w-[0.7cqw]" style={{ left: `${(x + 0.5) * 100}%`, background: "#0b0705" }}>
          <span className="absolute top-[4%] -left-[2.2cqw] h-[0.5cqw] w-[5cqw]" style={{ background: "#0b0705" }} />
        </div>
      ))}
    </>
  );
}

function Station({ i }: { i: number }) {
  const s = line.stops[i];
  const left = line.positions[i] + 0.5 - 0.46;
  return (
    <div className="absolute inset-y-0 w-[92%]" style={{ left: `${left * 100}%` }}>
      {/* slender canopy on columns, open to the sky behind */}
      <div className="absolute inset-x-0 top-[20%] h-[4%]" style={{ background: "#0e0805", boxShadow: "inset 0 -1px 0 rgb(217 185 138 / 0.5)" }} />
      {[0.04, 0.5, 0.96].map((c) => (
        <div key={c} className="absolute top-[24%] bottom-[22%] w-[0.8cqw] -translate-x-1/2" style={{ left: `${c * 100}%`, background: "#0e0805" }} />
      ))}
      {/* lamp pools under the canopy and on the platform */}
      {[0.2, 0.8].map((c) => (
        <div key={c} className="absolute top-[24%] bottom-[13%] w-[30%] -translate-x-1/2" style={{ left: `${c * 100}%`, background: "radial-gradient(45% 30% at 50% 0%, rgb(243 234 216 / 0.32), transparent 75%), radial-gradient(60% 12% at 50% 88%, rgb(217 185 138 / 0.22), transparent 80%)" }} />
      ))}
      {/* the station sign */}
      <div className="absolute top-[24%] left-1/2 -translate-x-1/2 text-center">
        <div className="mx-auto flex h-[3cqw] w-[60%] justify-between"><span className="w-px bg-champagne/40" /><span className="w-px bg-champagne/40" /></div>
        <div className="border border-champagne/60 px-[2.4cqw] py-[1.2cqw]" style={{ background: "#150D09", boxShadow: "0 1cqw 3cqw rgb(0 0 0 / 0.6)" }}>
          <p className="font-display text-[1.5cqw] font-semibold tracking-[0.3em] text-champagne">{i === 0 ? "DEPARTURES" : `STATION ${s.no}`}</p>
          <p className="mt-[0.6cqw] font-display text-[3.6cqw] leading-none font-bold tracking-[0.06em] whitespace-nowrap text-ivory uppercase">{s.name}</p>
          <p className="mt-[0.8cqw] text-[1.2cqw] tracking-[0.3em] text-mist uppercase">TBC Growth Line</p>
        </div>
      </div>
      {/* low back wall and the platform with its gold edge line */}
      <div className="absolute inset-x-0 bottom-[22%] h-[7%]" style={{ background: "#1B120D", boxShadow: "inset 0 1px 0 rgb(217 185 138 / 0.18)" }} />
      <div className="absolute inset-x-0 bottom-[13%] h-[9%]" style={{ background: "#221710", boxShadow: "inset 0 0.35cqw 0 rgb(201 154 69 / 0.75)" }} />
    </div>
  );
}

function Tunnel() {
  const w = tunnel.to - tunnel.from;
  const lamps: number[] = [];
  for (let x = 0.08; x < w; x += 0.16) lamps.push(x);
  return (
    <div className="absolute inset-y-0" style={{ left: `${(tunnel.from + 0.5) * 100}%`, width: `${w * 100}%`, background: "#070403" }}>
      <div className="absolute inset-y-0 left-0 w-[5%]" style={{ background: "#1B120D", boxShadow: "inset -1cqw 0 2cqw #070403" }} />
      <div className="absolute inset-y-0 right-0 w-[5%]" style={{ background: "#1B120D", boxShadow: "inset 1cqw 0 2cqw #070403" }} />
      {lamps.map((x) => (
        <span key={x} className="absolute top-[34%] h-[0.7cqw] w-[3cqw] rounded-full" style={{ left: `${(x / w) * 100}%`, background: "#F3EAD8", boxShadow: "0 0 3cqw 1cqw rgb(217 185 138 / 0.45)" }} />
      ))}
    </div>
  );
}

/** Stars for the first stretch of the night. */
function Stars() {
  const dots = useMemo(() => {
    const rnd = seeded(3);
    return Array.from({ length: 46 }, () => ({ x: rnd() * 100, y: rnd() * 45, r: rnd() < 0.15 ? 2 : 1 }));
  }, []);
  return (
    <>
      {dots.map((d, i) => (
        <span key={i} className="absolute rounded-full bg-ivory" style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.r, height: d.r, opacity: 0.5 }} />
      ))}
    </>
  );
}

/* ---------------------------------------------------------------- content */

function Stagger({ i, children, className = "" }: { i: number; children: ReactNode; className?: string }) {
  return <div className={className} style={{ "--i": i } as CSSProperties}>{children}</div>;
}

function StopPanel({ i, active }: { i: number; active: boolean }) {
  if (i === 0)
    return (
      <div className="gl-panel [grid-area:1/1]" data-active={active}>
        <Stagger i={0}><p className="eyebrow">What we do</p></Stagger>
        <Stagger i={1}><p className="display title-lg mt-5 text-ivory">Six stations. One route to growth.</p></Stagger>
        <Stagger i={2}><p className="mt-5 max-w-md text-mist">Strategy, creativity and growth systems for ambitious brands. Every stop is a question we answer for you.</p></Stagger>
        <Stagger i={3}><p className="mt-8 flex items-center gap-3 text-[0.7rem] font-semibold tracking-[0.28em] text-champagne uppercase">Scroll to ride <span className="gl-nudge">↓</span></p></Stagger>
      </div>
    );
  const s = services[i - 1];
  return (
    <div className="gl-panel [grid-area:1/1]" data-active={active}>
      <Stagger i={0}><p className="eyebrow">Station {s.no} <span className="text-mist">/ 0{services.length}</span></p></Stagger>
      <Stagger i={1}><p className="display title-lg mt-4 text-ivory">{s.title}</p></Stagger>
      <Stagger i={2}><p className="mt-3 font-sans text-xl text-champagne italic md:text-2xl">{s.question}</p></Stagger>
      <Stagger i={3}><p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-mist max-md:line-clamp-3">{s.detail}</p></Stagger>
      {s.no === "04" && (
        <Stagger i={4} className="mt-5 flex items-baseline gap-3 border-l border-gold pl-4">
          <span className="font-display text-3xl font-extrabold text-champagne">{founderStats[0].value}{founderStats[0].suffix}</span>
          <span className="text-sm text-ivory">{founderStats[0].label} {founderStats[0].note}</span>
        </Stagger>
      )}
      {s.no === "05" && (
        <Stagger i={4} className="mt-5 border-l border-gold pl-4">
          <p className="font-display text-lg leading-snug font-semibold text-ivory md:text-xl">“{serviceLine.lead} <span className="text-champagne">{serviceLine.follow}”</span></p>
        </Stagger>
      )}
      <Stagger i={5} className="mt-6 max-md:hidden">
        <p className="text-[0.65rem] font-semibold tracking-[0.3em] text-champagne uppercase">What you get</p>
        <ul className="mt-3 grid grid-cols-2 gap-x-6 border-t border-line">
          {s.outcomes.map((o) => <li key={o} className="border-b border-line py-2.5 text-sm text-ivory/90">{o}</li>)}
        </ul>
      </Stagger>
      <Stagger i={5} className="mt-4 md:hidden"><p className="text-sm text-ivory/80">{s.outcomes.join(" · ")}</p></Stagger>
    </div>
  );
}

/** The same content as a plain timetable: what screen readers read, and what reduced motion shows. */
function Timetable() {
  return (
    <div className="sr-only motion-reduce:not-sr-only motion-reduce:block motion-reduce:py-28">
      <div className="mx-auto max-w-[1100px] px-6 md:px-10">
        <p className="eyebrow">The TBC Growth Line</p>
        <h2 className="display title-lg mt-5">What we do</h2>
        <p className="mt-5 max-w-xl text-mist">Strategy, creativity and growth systems for ambitious brands. Six stations, one route to growth.</p>
        <ol className="mt-14 border-l border-line">
          {services.map((s) => (
            <li key={s.no} className="relative pb-12 pl-8 last:pb-0">
              <span aria-hidden className="absolute top-2 -left-[5px] h-2.5 w-2.5 rounded-full bg-champagne" />
              <p className="eyebrow">Station {s.no}</p>
              <h3 className="display title-md mt-3">{s.title}</h3>
              <p className="mt-2 font-sans text-xl text-champagne italic">{s.question}</p>
              <p className="mt-3 max-w-2xl text-mist">{s.detail}</p>
              {s.no === "05" && <p className="mt-4 font-display text-lg text-ivory">“{serviceLine.lead} {serviceLine.follow}”</p>}
              <p className="mt-3 text-sm text-ivory/85">What you get: {s.outcomes.join(", ")}.</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- the ride */

export function GrowthLine() {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const lenis = useLenis();
  const [at, setAt] = useState(0);
  const [status, setStatus] = useState({ label: "Now boarding", name: line.stops[0].name });

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(root);
        const [near, mid, far, carriage] = ["[data-near]", "[data-mid]", "[data-far]", "[data-carriage]"].map((s) => q(s)[0] as HTMLElement);
        const [stars, dawn, sun, fog, dark, reflect, fill, marker] = ["[data-stars]", "[data-dawn]", "[data-sun]", "[data-fog]", "[data-dark]", "[data-reflect]", "[data-fill]", "[data-marker]"].map((s) => q(s)[0] as HTMLElement);
        const proxy = { p: 0 };
        let lastAt = 0;
        let lastStatus = "";
        let x = 0;

        const render = () => {
          const r = rideAt(proxy.p);
          x = r.x;
          gsap.set(near, { xPercent: -r.x * 100 });
          gsap.set(mid, { xPercent: -r.x * PAR.mid * 100 });
          gsap.set(far, { xPercent: -r.x * PAR.far * 100 });
          const k = r.d / (n - 1);
          gsap.set(stars, { opacity: Math.max(0, 1 - r.d / 3.6) });
          gsap.set(fog, { opacity: Math.max(0, 1 - r.d / 3.2) });
          const light = Math.min(1, Math.max(0, (r.d - 3.4) / 2.6));
          gsap.set(dawn, { opacity: light });
          gsap.set(sun, { opacity: light, yPercent: 60 - light * 75 });
          // how much of the window the tunnel fills
          const inside = Math.max(0, Math.min(r.x + 0.5, tunnel.to) - Math.max(r.x - 0.5, tunnel.from));
          gsap.set(dark, { opacity: inside * 0.55 });
          gsap.set(reflect, { opacity: 0.35 + inside * 0.65 });
          gsap.set(fill, { scaleX: k });
          gsap.set(marker, { left: `${k * 100}%` });
          if (r.at !== lastAt) setAt((lastAt = r.at));
          const next = r.stopped ? r.at : r.next!;
          const label = r.stopped ? (r.at === 0 ? "Now boarding" : r.at === n - 1 ? "Arrived" : "Now at") : "Next station";
          const key = label + next;
          if (key !== lastStatus) {
            lastStatus = key;
            setStatus({ label, name: line.stops[next].name });
          }
        };

        gsap.to(proxy, {
          p: 1,
          ease: "none",
          onUpdate: render,
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${window.innerHeight * line.units * SCROLL_PER_UNIT}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onRefresh: (self) => (trigger.current = self),
          },
        });
        render();

        // atmosphere: the carriage sways and the track side blurs with speed
        let prev = 0;
        let speed = 0;
        let blur = -1;
        const tick = (time: number) => {
          speed += (Math.abs(x - prev) * 60 - speed) * 0.12;
          prev = x;
          const b = Math.min(3, speed * 4);
          if (Math.abs(b - blur) > 0.15) gsap.set(near, { filter: b < 0.2 ? "none" : `blur(${(blur = b).toFixed(2)}px)` });
          if (b < 0.2) blur = 0;
          gsap.set(carriage, { y: Math.sin(time * 1.4) * 0.8 + Math.sin(time * 9) * Math.min(1, speed) * 1.6 });
        };
        gsap.ticker.add(tick);
        return () => gsap.ticker.remove(tick);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const goTo = (i: number) => {
    const st = trigger.current;
    if (!st) return;
    const y = st.start + (st.end - st.start) * stopProgress(i);
    if (lenis) lenis.scrollTo(y, { duration: 1.2 + Math.abs(i - at) * 0.35 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <>
      <Timetable />
      <div ref={root} aria-hidden className="relative h-[100svh] min-h-[600px] overflow-hidden bg-ink motion-reduce:hidden">
        <div className="mx-auto flex h-full max-w-[1500px] flex-col px-5 pt-24 pb-5 md:px-10 lg:pt-28 lg:pb-8">
          <div className="grid min-h-0 flex-1 content-center items-center gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
            {/* content */}
            <div className="order-2 grid lg:order-1">
              {line.stops.map((_, i) => <StopPanel key={i} i={i} active={i === at} />)}
            </div>

            {/* the carriage window */}
            <div data-carriage className="order-1 mx-auto w-full max-w-[min(100%,calc(54svh*1.6))] lg:order-2">
              {/* passenger information display */}
              <div className="mb-3 flex items-center justify-between gap-4 border border-line px-4 py-2" style={{ background: "#0f0906" }}>
                <p className="flex min-w-0 items-baseline gap-3 font-display text-[0.7rem] tracking-[0.22em] uppercase">
                  <span className="shrink-0 text-mist">{status.label}</span>
                  <span key={status.name + status.label} className="gl-ticker truncate font-semibold text-champagne">{status.name}</span>
                </p>
                <p className="shrink-0 font-display text-[0.7rem] tracking-[0.22em] text-mist uppercase">{String(at).padStart(2, "0")} / 0{n - 1}</p>
              </div>

              {/* frame */}
              <div className="rounded-[30px] border border-champagne/25 p-2.5 shadow-[0_50px_100px_-40px_rgb(0_0_0/0.9)] md:p-3.5" style={{ background: "#221710" }}>
                <div className="relative aspect-[16/10] overflow-hidden rounded-[22px]" style={{ containerType: "inline-size", background: "linear-gradient(180deg, #0b0705 0%, #150D09 40%, #2c1f16 72%, #3B2A1E 80%, #150D09 100%)" }}>
                  <div data-stars className="absolute inset-0">
                    <Stars />
                    <span className="absolute top-[22%] left-[18%] h-[4.5cqw] w-[4.5cqw] rounded-full bg-ivory/85 shadow-[0_0_6cqw_1.5cqw_rgb(243_234_216/0.18)]" />
                  </div>
                  {/* first light: a warm wash, then the sun lifting over the hills */}
                  <div data-dawn className="absolute inset-0 opacity-0" style={{ background: "radial-gradient(70% 45% at 64% 62%, rgb(201 154 69 / 0.75), rgb(217 185 138 / 0.18) 50%, transparent 78%), linear-gradient(180deg, transparent 20%, rgb(201 154 69 / 0.18) 62%, transparent 80%)" }} />
                  <span data-sun className="absolute top-[52%] left-[64%] h-[11cqw] w-[11cqw] -translate-x-1/2 rounded-full" style={{ background: "#D9B98A", boxShadow: "0 0 8cqw 3cqw rgb(201 154 69 / 0.45)", opacity: 0 }} />
                  <div data-far className="absolute inset-0"><Hills /></div>
                  <div data-mid className="absolute inset-0"><City /></div>
                  <div data-fog className="pointer-events-none absolute inset-0">
                    <div className="gl-fog absolute -inset-x-1/2 top-[30%] h-[45%]" style={{ background: "radial-gradient(40% 50% at 30% 50%, rgb(183 165 138 / 0.16), transparent 70%), radial-gradient(35% 45% at 75% 60%, rgb(183 165 138 / 0.12), transparent 70%)" }} />
                  </div>
                  {/* track side: low wall, poles, stations, tunnel */}
                  <div data-near className="absolute inset-0 will-change-transform">
                    <div className="absolute bottom-0 h-[13%]" style={{ left: "-100%", width: `${(line.length + 3) * 100}%`, background: "repeating-linear-gradient(90deg, #120b07 0 2.6cqw, #0b0705 2.6cqw 3cqw)" }} />
                    <Poles />
                    {line.stops.map((_, i) => <Station key={i} i={i} />)}
                    <Tunnel />
                  </div>
                  {/* the overhead wire, which never moves */}
                  <div className="absolute inset-x-0 top-[13%] h-px" style={{ background: "#0b0705" }} />
                  {/* atmosphere: tunnel darkness, glass reflections, vignette, the blind */}
                  <div data-dark className="absolute inset-0 bg-ink opacity-0" />
                  <div data-reflect className="pointer-events-none absolute inset-0 opacity-35" style={{ background: "linear-gradient(112deg, transparent 22%, rgb(243 234 216 / 0.09) 34%, transparent 46%), radial-gradient(40% 35% at 12% 95%, rgb(201 154 69 / 0.22), transparent 70%)" }} />
                  <div className="pointer-events-none absolute inset-0 rounded-[22px] shadow-[inset_0_0_70px_rgb(0_0_0/0.75)]" />
                  <div className="absolute inset-x-0 top-0 h-[9%] border-b border-champagne/20" style={{ background: "repeating-linear-gradient(180deg, #221710 0 5px, #1B120D 5px 7px)" }}>
                    <span className="absolute -bottom-[7px] left-1/2 h-3 w-8 -translate-x-1/2 rounded-b-md bg-bronze" />
                  </div>
                </div>
              </div>
              {/* sill */}
              <div className="mx-4 h-2.5 rounded-b-md border-t border-champagne/30" style={{ background: "#1B120D" }} />
            </div>
          </div>

          {/* route map */}
          <div className="relative mt-6 h-12 shrink-0 lg:mt-8 lg:h-14">
            <div className="absolute inset-x-[4%] top-3">
              <div className="absolute inset-x-0 top-0 h-px bg-line" />
              <div data-fill className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-champagne" />
              {line.stops.map((s, i) => {
                const passed = i < at;
                const here = i === at;
                return (
                  <button
                    key={i}
                    type="button"
                    tabIndex={-1}
                    onClick={() => goTo(i)}
                    className="group absolute top-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                    style={{ left: `${(i / (n - 1)) * 100}%` }}
                  >
                    <span className={`block h-2 w-2 rounded-full border transition-colors duration-300 ${passed || here ? "border-champagne bg-champagne" : "border-mist bg-ink group-hover:border-champagne"}`} />
                    <span className={`absolute top-4 hidden whitespace-nowrap text-[0.7rem] tracking-[0.04em] transition-colors lg:block ${here ? "text-ivory" : "text-mist group-hover:text-ivory"}`}>
                      {s.name}
                    </span>
                  </button>
                );
              })}
              <span data-marker className="absolute top-0 h-[7px] w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_12px_rgb(201_154_69/0.6)]" style={{ left: 0 }} />
            </div>
            <p className="absolute right-[4%] bottom-0 text-[0.7rem] tracking-[0.04em] text-ivory lg:hidden">{line.stops[at].name}</p>
          </div>
        </div>
      </div>
    </>
  );
}
