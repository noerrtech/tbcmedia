import { Capabilities } from "~/components/sections/Services";
import { GrowthLine } from "~/components/sections/GrowthLine";
import { Industries } from "~/components/sections/Industries";
import { RoomFooter } from "~/components/office/RoomFooter";
import type { Route } from "./+types/office.services";

export const meta: Route.MetaFunction = () => [{ title: "What We Do — The Brand Cappuccino" }];

/** What we do: the same ride down the TBC Growth Line as the classic home, as its own room. */
export default function ServicesRoom() {
  return (
    <>
      <section aria-label="What we do" className="bg-ink">
        <GrowthLine heading="h1" />
      </section>
      <Capabilities />
      <section className="py-32"><Industries /></section>
      <RoomFooter />
    </>
  );
}
