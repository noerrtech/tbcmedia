import { ActionRoom } from "~/components/sections/Action";
import { RoomFooter } from "~/components/office/RoomFooter";
import { Footer } from "~/components/layout/Footer";
import type { Route } from "./+types/office.next";

export const meta: Route.MetaFunction = () => [{ title: "What Are We Building Next? — The Brand Cappuccino" }];

export default function NextRoom() {
  return (
    <>
      <section className="relative pt-32 pb-32 md:pt-40"><ActionRoom immediate /></section>
      <RoomFooter />
      <Footer />
    </>
  );
}
