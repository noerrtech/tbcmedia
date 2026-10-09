import { Link, useLoaderData } from "react-router";
import { beliefs, jbn } from "~/content/site";
import { Header } from "~/components/layout/Header";
import { Footer } from "~/components/layout/Footer";
import { Entrance } from "~/components/home/Entrance";
import { GrowthGrid } from "~/components/home/GrowthGrid";
import { ScrollHighlight } from "~/components/home/ScrollHighlight";
import { Capabilities, ServicesShowroom } from "~/components/sections/Services";
import { Industries } from "~/components/sections/Industries";
import { ImpactWall } from "~/components/sections/Impact";
import { WorkGallery } from "~/components/sections/Work";
import { WhyTBC } from "~/components/sections/WhyTBC";
import { FounderProfile } from "~/components/sections/Founder";
import { FounderNote } from "~/components/sections/FounderNote";
import { JbnOffer } from "~/components/sections/Jbn";
import { Testimonials } from "~/components/sections/Testimonials";
import { ActionRoom } from "~/components/sections/Action";
import { Reveal } from "~/components/ui/Reveal";
import { Arrow } from "~/components/ui/Arrow";
import type { Route } from "./+types/home";

export function loader() {
  const claimed = Number(process.env.JBN_CLAIMED ?? jbn.defaultClaimed);
  return { claimed: Number.isFinite(claimed) ? claimed : jbn.defaultClaimed };
}

/** The classic route: entrance, then one considered scroll through TBC. */
export default function Home() {
  const { claimed } = useLoaderData<typeof loader>();
  return (
    <div className="bg-ink">
      <Header variant="site" />
      <Entrance />

      {/* GROWTH PROBLEMS — the six services, then the line on social (as in the mockup) */}
      <section id="growth" className="scroll-mt-24 pt-28 md:pt-36"><GrowthGrid /></section>

      {/* WHY TBC — what we believe */}
      <section id="why" className="relative py-40">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10">
          <Reveal><p className="eyebrow">Why TBC</p></Reveal>
          <ScrollHighlight text={beliefs.title} className="display title-xl mt-8" />
          <Reveal delay={0.1}>
            <p className="mt-12 max-w-2xl font-display text-2xl leading-snug text-ivory/80 md:text-3xl">{beliefs.body}</p>
          </Reveal>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section id="services" className="relative scroll-mt-10 py-24">
        <ServicesShowroom />
      </section>
      <Capabilities />

      {/* INDUSTRIES */}
      <section id="industries" className="scroll-mt-10 py-40"><Industries /></section>

      {/* RESULTS */}
      <section id="results" className="scroll-mt-10 border-t border-line py-40"><ImpactWall /></section>

      {/* WORK */}
      <section id="work" className="scroll-mt-10"><WorkGallery /></section>

      {/* Invitation into the office */}
      <section className="relative overflow-hidden border-y border-line py-28 text-center">
        <div aria-hidden className="velvet absolute inset-0 opacity-30" />
        <div className="relative px-6">
          <p className="eyebrow">Prefer to walk through it?</p>
          <p className="display title-lg mx-auto mt-6 max-w-3xl">Step inside the TBC office.</p>
          <Link to="/tbc" className="btn mt-10">Enter TBC <Arrow /></Link>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="scroll-mt-10 py-40"><WhyTBC /></section>

      {/* FOUNDER */}
      <section id="founder" className="scroll-mt-10 border-t border-line py-40"><FounderProfile /></section>
      <section className="py-32"><FounderNote /></section>

      {/* JBN */}
      <section id="jbn" className="scroll-mt-10 border-y border-line bg-umber py-32">
        <JbnOffer claimed={claimed} />
      </section>

      {/* TESTIMONIALS */}
      <section className="py-40"><Testimonials /></section>

      {/* CTA */}
      <section id="contact" className="scroll-mt-10 border-t border-line pt-40 pb-32"><ActionRoom /></section>

      <Footer />
    </div>
  );
}
