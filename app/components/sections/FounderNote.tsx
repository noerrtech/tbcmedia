import { motion } from "framer-motion";
import { useState } from "react";
import { founder } from "~/content/site";
import { Reveal, RevealLines } from "~/components/ui/Reveal";

const reel = [
  { label: "UC Berkeley", sub: "Invited speaker" },
  { label: "Community", sub: "51,000+ professionals" },
  { label: "Business", sub: "Investment banking roots" },
  { label: "TBC", sub: "The impact creators", image: "/media/team.webp" },
];

export function FounderNote() {
  const [playing, setPlaying] = useState(false);
  const hasVideo = Boolean(founder.note.video);

  return (
    <div className="mx-auto max-w-[1400px] px-6 md:px-10">
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <Reveal><p className="eyebrow">Founder's message</p></Reveal>
          <RevealLines lines={["A note from", "the founder"]} className="display title-lg mt-6" />
          <Reveal delay={0.2}>
            <p className="mt-10 font-sans text-2xl leading-snug text-ivory/85 italic">“{founder.note.opening}”</p>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="mt-6 leading-relaxed text-mist">{founder.note.ambition}</p>
          </Reveal>
          <Reveal delay={0.4}>
            <p className="display title-md mt-10 text-champagne">{founder.name}</p>
            <p className="mt-1 text-[0.6rem] tracking-[0.3em] text-mist uppercase">Founder, TBC</p>
          </Reveal>
        </div>

        <Reveal className="relative">
          <div className="relative aspect-[16/10] overflow-hidden bg-coal">
            {hasVideo && playing ? (
              <video src={founder.note.video} className="h-full w-full object-cover" autoPlay controls playsInline />
            ) : (
              <>
                <div className="absolute inset-0 bg-umber" />
                <img src={founder.portrait} alt="" className="absolute bottom-0 left-1/2 h-[92%] -translate-x-1/2 object-contain opacity-90 [mask-image:linear-gradient(180deg,#000_75%,transparent)]" />
                <p className="absolute top-6 right-6 max-w-[14rem] text-right font-sans text-xl leading-snug text-ivory/90 italic md:text-2xl">
                  “{founder.note.quote}”
                </p>
                {hasVideo && (
                  <button
                    type="button"
                    onClick={() => setPlaying(true)}
                    aria-label="Play the founder's message"
                    className="group absolute top-1/2 left-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-champagne/70 backdrop-blur-sm transition-transform duration-200 motion-safe:hover:scale-110"
                  >
                    <span className="ml-1 border-y-[9px] border-l-[15px] border-y-transparent border-l-champagne" />
                  </button>
                )}
              </>
            )}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {reel.map((r, i) => (
              <motion.div
                key={r.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="relative aspect-[4/3] overflow-hidden border border-line bg-umber"
              >
                {r.image && <img src={r.image} alt="The TBC team" className="absolute inset-0 h-full w-full object-cover opacity-60" loading="lazy" />}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 to-transparent" />
                <div className="absolute inset-x-2 bottom-2 md:inset-x-3 md:bottom-3">
                  <p className="font-display text-sm text-ivory md:text-lg">{r.label}</p>
                  <p className="hidden text-[0.55rem] tracking-[0.15em] text-mist uppercase md:block">{r.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
