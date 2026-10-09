import { motion } from "framer-motion";
import { actions, bookingLink, contact, whatsappLink } from "~/content/site";
import { Reveal, RevealLines } from "~/components/ui/Reveal";
import { Arrow } from "~/components/ui/Arrow";

import { dur, ease as easing } from "~/lib/motion";

const ease = easing.out;

/** Three lit doorways — the end of the story, the start of a conversation. */
export function ActionRoom({ immediate = false }: { immediate?: boolean }) {
  return (
    <div className="mx-auto max-w-[1400px] px-6 md:px-10">
      <div className="text-center">
        <Reveal><p className="eyebrow">The action room</p></Reveal>
        <RevealLines
          immediate={immediate}
          as={immediate ? "h1" : "h2"}
          lines={["So, what are we", "building next?"]}
          className="display title-xl mt-6"
        />
      </div>

      <ul className="mt-20 grid gap-6 md:grid-cols-3">
        {actions.map((a, i) => (
          <motion.li
            key={a.title}
            initial={{ opacity: 0, transform: "translateY(24px)" }}
            whileInView={{ opacity: 1, transform: "translateY(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: dur.reveal, ease, delay: i * 0.08 }}
          >
            <a
              href={a.booking ? bookingLink(a.message) : whatsappLink(a.message)}
              target="_blank"
              rel="noreferrer"
              className="group relative flex h-[26rem] flex-col items-center justify-end overflow-hidden rounded-t-[999px] border border-line bg-coal px-8 pb-10 text-center"
            >
              {/* light spilling through the doorway */}
              <span aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(234_214_173/0.22),transparent_70%)] opacity-40 transition-opacity duration-250 group-hover:opacity-100" />
              <span aria-hidden className="absolute inset-x-10 top-10 bottom-0 rounded-t-[999px] border border-line transition-colors duration-250 group-hover:border-gold/60" />
              <span className="relative text-[0.6rem] tracking-[0.34em] text-gold uppercase">{a.eyebrow}</span>
              <span className="display title-md relative mt-3">{a.title}</span>
              <span className="relative mt-4 text-sm text-mist">{a.body}</span>
              <span className="btn relative mt-8 group-hover:border-champagne">
                {a.cta} <Arrow />
              </span>
            </a>
          </motion.li>
        ))}
      </ul>

      <div className="mt-28 flex flex-col items-center gap-8 text-center">
        <RevealLines lines={["Let's build what's next."]} className="display gold-text title-lg" />
        <Reveal delay={0.2} className="flex flex-wrap items-center justify-center gap-5">
          <a href={bookingLink()} target="_blank" rel="noreferrer" className="btn btn-solid">
            Book a consultation with TBC <Arrow />
          </a>
          <a href={contact.phoneHref} className="text-sm text-mist link-underline">or call {contact.phone}</a>
        </Reveal>
      </div>
    </div>
  );
}
