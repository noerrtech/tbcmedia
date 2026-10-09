import { impactProofs, impactStats } from "~/content/site";
import { CountUp } from "~/components/ui/CountUp";
import { Reveal, RevealLines } from "~/components/ui/Reveal";

export function ImpactWall({ heading = true, stats = true }: { heading?: boolean; stats?: boolean }) {
  return (
    <div className="mx-auto max-w-[1400px] px-6 md:px-10">
      {heading && (
        <div className="mb-16 text-center">
          <Reveal><p className="eyebrow">The numbers behind the work</p></Reveal>
          <RevealLines lines={["Real strategy.", "Real impact."]} className="display title-lg mt-6" />
        </div>
      )}

      {stats && (
      <div className="grid border-t border-l border-line sm:grid-cols-2 xl:grid-cols-4">
        {impactStats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.1} className="border-r border-b border-line p-6 md:p-10">
            <CountUp value={s.value} suffix={s.suffix} className="stat-num block" />
            <p className="stat-label mt-4">
              {s.label}
              {s.note && <span className="soft"> {s.note}</span>}
            </p>
          </Reveal>
        ))}
      </div>
      )}

      <div className={`grid border-l border-line md:grid-cols-3 ${stats ? "mt-px" : "border-t"}`}>
        {impactProofs.map((p, i) => (
          <Reveal key={p.title} delay={0.2 + i * 0.1} className="border-r border-b border-line p-6 md:p-10">
            <p className="display title-md text-champagne">{p.title}</p>
            <p className="mt-3 text-sm leading-relaxed text-mist">{p.body}</p>
          </Reveal>
        ))}
      </div>

      <RevealLines
        as="p"
        lines={["Numbers tell you what happened.", <span className="text-champagne">Strategy tells you why.</span>]}
        className="display title-lg mt-24 text-center"
      />
    </div>
  );
}
