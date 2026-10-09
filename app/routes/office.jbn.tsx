import { motion } from "framer-motion";
import { useLoaderData } from "react-router";
import { jbn } from "~/content/site";
import { JbnOffer } from "~/components/sections/Jbn";
import { SpeechBubble } from "~/components/office/Concierge";
import { RoomFooter } from "~/components/office/RoomFooter";
import { useOffice } from "~/components/office/OfficeContext";
import type { Route } from "./+types/office.jbn";

export const meta: Route.MetaFunction = () => [{ title: "JBN Exclusive — The Brand Cappuccino" }];

export function loader() {
  const claimed = Number(process.env.JBN_CLAIMED ?? jbn.defaultClaimed);
  return { claimed: Number.isFinite(claimed) ? claimed : jbn.defaultClaimed };
}

export default function JbnRoom() {
  // During the exit transition this route's data is already gone — fall back gracefully.
  const data = useLoaderData<typeof loader>() as { claimed: number } | undefined;
  const claimed = data?.claimed ?? jbn.defaultClaimed;
  const { mode } = useOffice();

  return (
    <>
      <section className="relative min-h-screen overflow-hidden pt-32 pb-32">
        {mode !== "3d" && (
          <>
            <div aria-hidden className="fluted absolute inset-y-0 left-0 w-1/5 opacity-50" />
            <div aria-hidden className="fluted absolute inset-y-0 right-0 w-1/5 opacity-50" />
          </>
        )}
        <div className="relative flex justify-center px-6">
          <SpeechBubble text={jbn.greeting} />
        </div>
        {/* the big screen */}
        <motion.div
          className="relative mx-auto mt-12 max-w-4xl px-4"
          initial={{ opacity: 0, scaleY: 0.02 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 1.1, delay: 1.2, ease: [0.7, 0, 0.2, 1] }}
        >
          <div className="relative border border-champagne/30 bg-[radial-gradient(80%_70%_at_50%_30%,#2a2018,#0b0908)] py-16 shadow-[0_0_120px_-20px_rgba(234,214,173,0.3)]">
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-20 [background:repeating-linear-gradient(0deg,transparent_0_3px,rgb(0_0_0/0.4)_3px_4px)]" />
            <JbnOffer claimed={claimed} />
          </div>
          <div aria-hidden className="mx-auto h-10 w-3/4 bg-[radial-gradient(closest-side,rgb(234_214_173/0.18),transparent)]" />
        </motion.div>
      </section>
      <RoomFooter />
    </>
  );
}
