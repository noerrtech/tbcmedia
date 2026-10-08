import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useOutlet } from "react-router";
import { Header } from "~/components/layout/Header";
import { Passage } from "~/components/office/Passage";
import { ScrollTrigger } from "~/lib/gsap";

/** The interactive office: every room is a child route, joined by a passage transition. */
export default function Office() {
  const { pathname } = useLocation();
  const outlet = useOutlet();

  return (
    <div className="room-light min-h-screen">
      <Header variant="office" />
      <AnimatePresence mode="wait" initial={false} onExitComplete={() => requestAnimationFrame(() => ScrollTrigger.refresh())}>
        <motion.main
          key={pathname}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] } }}
          exit={{ opacity: 0, scale: 1.08, filter: "blur(8px)", transition: { duration: 0.4, ease: [0.7, 0, 0.84, 0] } }}
        >
          {outlet}
        </motion.main>
      </AnimatePresence>
      <Passage />
    </div>
  );
}
