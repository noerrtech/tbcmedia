import { Capabilities, ServicesShowroom } from "~/components/sections/Services";
import { Industries } from "~/components/sections/Industries";
import { RoomFooter } from "~/components/office/RoomFooter";
import { RevealLines } from "~/components/ui/Reveal";
import type { Route } from "./+types/office.services";

export const meta: Route.MetaFunction = () => [{ title: "What We Do — The Brand Cappuccino" }];

export default function ServicesRoom() {
  return (
    <>
      <section className="relative overflow-hidden pt-32 pb-24 md:pt-40">
        <div aria-hidden className="absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(50%_60%_at_50%_0%,rgb(201_164_106/0.14),transparent)]" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <p className="eyebrow">What we do</p>
          <RevealLines immediate as="h1" lines={["What we do"]} className="display mt-6 text-5xl md:text-8xl" />
          <p className="mt-6 text-mist">Strategy, creativity and growth systems for ambitious brands. Pick a panel.</p>
        </div>
        <div className="relative -mt-12"><ServicesShowroom heading={false} /></div>
      </section>
      <Capabilities />
      <section className="py-32"><Industries /></section>
      <RoomFooter />
    </>
  );
}
