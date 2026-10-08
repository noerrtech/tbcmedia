import { FounderProfile } from "~/components/sections/Founder";
import { RoomFooter } from "~/components/office/RoomFooter";
import type { Route } from "./+types/office.founder";

export const meta: Route.MetaFunction = () => [{ title: "Meet the Founder — The Brand Cappuccino" }];

export default function FounderRoom() {
  return (
    <>
      <section className="relative pt-32 pb-32 md:pt-40">
        <div aria-hidden className="fluted absolute inset-y-0 right-0 w-1/3 opacity-30 [mask-image:linear-gradient(90deg,transparent,#000)]" />
        <div className="relative">
          <FounderProfile immediate />
        </div>
      </section>
      <RoomFooter />
    </>
  );
}
