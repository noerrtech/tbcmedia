import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { bookingLink, featuredIn, founder, founderStats } from "~/content/site";
import { CountUp } from "~/components/ui/CountUp";
import { Reveal, RevealLines } from "~/components/ui/Reveal";
import { Arrow } from "~/components/ui/Arrow";

import { dur, ease as easing, stagger as STAGGER } from "~/lib/motion";

const ease = easing.out;

export function FounderPortrait({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["6%", "-6%"]);
  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* desk lamp glow behind */}
      <div aria-hidden className="animate-flicker absolute inset-x-[5%] top-[8%] bottom-0 rounded-full bg-[radial-gradient(closest-side,rgb(201_164_106/0.35),transparent)] blur-2xl" />
      {/* arched window frame */}
      <div aria-hidden className="absolute inset-x-[8%] top-0 bottom-[6%] rounded-t-full border border-line" />
      <motion.img
        src={founder.portrait}
        alt={`${founder.name}, ${founder.roles.join(", ")} of The Brand Cappuccino`}
        style={{ y }}
        initial={{ opacity: 0, scale: 1.04 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: dur.headline, ease }}
        className="relative z-10 mx-auto w-full max-w-md [filter:sepia(0.12)_contrast(1.05)_brightness(0.95)] [mask-image:linear-gradient(180deg,#000_70%,transparent)]"
      />
    </div>
  );
}

export function FounderStats() {
  return (
    <div className="grid border-t border-line sm:grid-cols-2">
      {founderStats.map((s, i) => (
        <Reveal key={s.label} delay={i * 0.1} className="border-b border-line py-8 pr-6">
          <CountUp value={s.value} suffix={s.suffix} className="stat-num block" />
          <p className="stat-label mt-3">
            {s.label}
            {s.note && <span className="soft"> {s.note}</span>}
          </p>
        </Reveal>
      ))}
    </div>
  );
}

export function FeaturedIn() {
  const verified = featuredIn.filter((f) => f.verified);
  return (
    <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
      <p className="eyebrow">Spoken at · Featured in</p>
      {verified.map((f) => (
        <span key={f.name} className="font-display text-xl font-semibold text-ivory/80">{f.name}</span>
      ))}
      <span className="text-sm text-mist">International & national media across domains</span>
    </div>
  );
}

function Journey() {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-mist">
      {founder.journey.map((step, i) => (
        <motion.li
          key={step}
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * STAGGER, duration: dur.reveal, ease }}
        >
          <span className={i === founder.journey.length - 1 ? "text-champagne" : ""}>{step}</span>
          {i < founder.journey.length - 1 && <span className="text-gold">→</span>}
        </motion.li>
      ))}
    </ol>
  );
}

/** Riya's room / section: who, proof, philosophy, consultation. */
export function FounderProfile({ immediate = false }: { immediate?: boolean }) {
  const [showCredentials, setShowCredentials] = useState(false);
  return (
    <div className="mx-auto max-w-[1400px] px-6 md:px-10">
      <div className="grid items-end gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div className="order-2 lg:order-1">
          <Reveal><p className="eyebrow">The founder</p></Reveal>
          <RevealLines
            immediate={immediate}
            as={immediate ? "h1" : "h2"}
            lines={["Meet", founder.name]}
            className="display title-xl mt-6"
          />
          <Reveal delay={0.3}>
            <p className="mt-6 text-[0.7rem] tracking-[0.32em] text-champagne uppercase">{founder.roles.join("  •  ")}</p>
          </Reveal>
          <Reveal delay={0.4} className="mt-8">
            <p className="max-w-lg font-display text-2xl text-ivory/90">{founder.intro}</p>
            <div className="mt-4"><Journey /></div>
          </Reveal>

          <Reveal delay={0.5} className="mt-12">
            <FounderStats />
          </Reveal>

          <Reveal delay={0.2} className="mt-10">
            <button type="button" onClick={() => setShowCredentials((v) => !v)} className="text-[0.65rem] tracking-[0.28em] text-champagne uppercase link-underline" aria-expanded={showCredentials}>
              {showCredentials ? "Hide" : "Read"} the record {showCredentials ? "−" : "+"}
            </button>
            <motion.ul
              initial={false}
              animate={{ height: showCredentials ? "auto" : 0, opacity: showCredentials ? 1 : 0 }}
              transition={{ duration: 0.6, ease }}
              className="overflow-hidden"
            >
              {founder.credentials.map((c) => (
                <li key={c} className="flex gap-4 border-b border-line py-3 text-sm text-mist first:mt-4">
                  <span className="text-gold">◆</span> {c}
                </li>
              ))}
            </motion.ul>
          </Reveal>
        </div>
        {/* up beside the name, and kept in view while the numbers scroll past */}
        <FounderPortrait className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start" />
      </div>

      <div className="mt-20 border-t border-line pt-10">
        <FeaturedIn />
      </div>

      <div className="mt-28 grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <RevealLines
          as="p"
          lines={["“I didn't start TBC", "to create another", "marketing agency.”"]}
          className="display title-lg text-champagne"
        />
        <div className="space-y-5 text-lg leading-relaxed text-ivory/80">
          {founder.philosophy.map((p, i) => (
            <Reveal key={p} delay={0.1 + i * 0.12}><p>{p}</p></Reveal>
          ))}
          <Reveal delay={0.5} className="flex flex-wrap items-center gap-6 pt-6">
            <a href={bookingLink(`Hi ${founder.firstName} — I'd like to book a brand consultation.`)} target="_blank" rel="noreferrer" className="btn btn-solid">
              Book a brand consultation <Arrow />
            </a>
            {founder.consultationRate && <span className="text-sm text-mist">Founder consultations — {founder.consultationRate}</span>}
          </Reveal>
        </div>
      </div>
    </div>
  );
}
