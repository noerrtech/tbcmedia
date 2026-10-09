import { services } from "~/content/site";
import { Reveal, RevealLines } from "~/components/ui/Reveal";

/** "We specialise in growth problems" — the six services as a quiet grid. */
export function GrowthGrid() {
  return (
    <div className="mx-auto max-w-[1100px] px-6">
      <RevealLines
        as="h2"
        lines={["We don't specialise in one industry.", "We specialise in growth problems."]}
        className="display title-lg max-w-[22ch]"
      />
      <ul className="mt-14 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => (
          <Reveal as="li" key={s.no} delay={(i % 3) * 0.06} className="border-t border-line pt-5 pb-10">
            <h3 className="display title-md">{s.title}</h3>
            <p className="mt-2 text-mist">{s.question}</p>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
