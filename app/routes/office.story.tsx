import { WhyTBC } from "~/components/sections/WhyTBC";
import { FounderNote } from "~/components/sections/FounderNote";
import { Testimonials } from "~/components/sections/Testimonials";
import { RoomFooter } from "~/components/office/RoomFooter";
import type { Route } from "./+types/office.story";

export const meta: Route.MetaFunction = () => [{ title: "Why TBC Exists — The Brand Cappuccino" }];

export default function StoryRoom() {
  return (
    <>
      <section className="pt-32 pb-32 md:pt-40"><WhyTBC /></section>
      <section className="bg-ink py-32"><FounderNote /></section>
      <section className="py-32"><Testimonials /></section>
      <RoomFooter />
    </>
  );
}
