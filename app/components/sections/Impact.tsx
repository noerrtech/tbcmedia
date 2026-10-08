import { impactProofs, impactStats } from "~/content/site";
import { CountUp } from "~/components/ui/CountUp";
import { Reveal, RevealLines } from "~/components/ui/Reveal";

export function ImpactWall({ heading = true }: { heading?: boolean }) {
  return (
    <div className="mx-auto max-w-[1400px] px-6 md:px-10">
      {heading && (
        <div className="mb-16 text-center">
          <Reveal><p className="eyebrow">The numbers behind the work</p></Reveal>
          <RevealLines lines={["Real strategy.", "Real impact."]} className="display mt-6 text-4xl md:text-7xl" />
        </div>
      )}

      <div className="grid grid-cols-2 border-t border-l border-line lg:grid-cols-4">
        {impactStats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.1} className="border-r border-b border-line p-6 md:p-10">
            <CountUp value={s.value} suffix={s.suffix} className="gold-text block font-display text-5xl font-light md:text-6xl xl:text-7xl" />
            <p className="mt-4 text-[0.65rem] tracking-[0.28em] text-ivory uppercase">{s.label}</p>
            {s.note && <p className="mt-2 text-sm text-mist">{s.note}</p>}
          </Reveal>
        ))}
      </div>

      <div className="mt-px grid border-l border-line md:grid-cols-3">
        {impactProofs.map((p, i) => (
          <Reveal key={p.title} delay={0.2 + i * 0.1} className="border-r border-b border-line p-6 md:p-10">
            <p className="font-display text-3xl text-champagne">{p.title}</p>
            <p className="mt-3 text-sm leading-relaxed text-mist">{p.body}</p>
          </Reveal>
        ))}
      </div>

      <RevealLines
        as="p"
        lines={["Numbers tell you what happened.", <span className="text-champagne italic">Strategy tells you why.</span>]}
        className="mt-24 text-center font-display text-3xl leading-tight font-light md:text-5xl"
      />
    </div>
  );
}
