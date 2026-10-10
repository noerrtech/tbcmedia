import { motion } from "framer-motion";
import { useState } from "react";
import { jbn, whatsappLink } from "~/content/site";
import { Arrow } from "~/components/ui/Arrow";

import { dur, ease as easing } from "~/lib/motion";

const ease = easing.out;

function Ring({ claimed, total }: { claimed: number; total: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const pct = Math.min(claimed / total, 1);
  return (
    <div className="relative h-48 w-48">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgb(201 154 69 / 0.15)" strokeWidth="2" />
        <motion.circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="#D9B98A"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - pct) }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease, delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display text-5xl font-extrabold text-ivory" style={{ fontVariantNumeric: "lining-nums tabular-nums" }}>
          {claimed}<span className="text-mist"> / {total}</span>
        </p>
        <p className="mt-1 text-[0.6rem] tracking-[0.3em] text-gold uppercase">Claimed</p>
      </div>
    </div>
  );
}

/**
 * The JBN offer. Claims are sent as a pre-filled WhatsApp message to TBC so
 * there is no backend to run; the counter is set with the JBN_CLAIMED env var.
 */
export function JbnOffer({ claimed }: { claimed: number }) {
  const [open, setOpen] = useState(false);
  const left = Math.max(jbn.total - claimed, 0);
  const soldOut = left === 0;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const msg = [
      "Hi TBC — I'm a JBN member and I'd like to claim my free 20-min social media audit.",
      `Name: ${f.get("name")}`,
      `Brand: ${f.get("brand")}`,
      `Phone: ${f.get("phone")}`,
      `JBN chapter: ${f.get("chapter")}`,
      f.get("handle") ? `Instagram: ${f.get("handle")}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    window.open(whatsappLink(msg), "_blank", "noopener");
  };

  return (
    <div className="relative mx-auto max-w-3xl px-6 text-center">
      <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="eyebrow">
        Community offer
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, transform: "translateY(16px)" }}
        whileInView={{ opacity: 1, transform: "translateY(0px)" }}
        viewport={{ once: true }}
        transition={{ duration: dur.headline, ease }}
        className="display gold-text title-xl mt-6 pb-3"
      >
        {jbn.title}
      </motion.h2>
      <div className="hairline mx-auto my-10 w-40" />
      <p className="display title-md text-ivory">{jbn.offer}</p>
      <p className="mt-3 text-mist">For the first {jbn.total} members.</p>

      <div className="mt-12 flex flex-col items-center gap-4">
        <Ring claimed={claimed} total={jbn.total} />
        <p className="text-sm text-mist">{soldOut ? "All audits have been claimed." : `Only ${left} audits left.`}</p>
      </div>

      {!soldOut && (
        <div className="mt-10">
          {!open ? (
            <button type="button" onClick={() => setOpen(true)} className="btn btn-solid">
              Claim your audit <Arrow />
            </button>
          ) : (
            <motion.form
              onSubmit={onSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease }}
              className="panel mx-auto grid max-w-lg gap-5 p-8 text-left"
            >
              {[
                { name: "name", label: "Your name", required: true, autoComplete: "name" },
                { name: "brand", label: "Brand / business", required: true },
                { name: "phone", label: "Phone number", required: true, type: "tel", autoComplete: "tel" },
                { name: "chapter", label: "JBN chapter", required: true },
                { name: "handle", label: "Instagram handle (optional)", required: false },
              ].map((field) => (
                <label key={field.name} className="block">
                  <span className="text-[0.6rem] tracking-[0.28em] text-gold uppercase">{field.label}</span>
                  <input
                    name={field.name}
                    type={field.type ?? "text"}
                    autoComplete={field.autoComplete}
                    required={field.required}
                    className="mt-2 w-full border-b border-line bg-transparent py-2 text-ivory outline-none transition-colors focus:border-champagne"
                  />
                </label>
              ))}
              <button type="submit" className="btn btn-solid mt-4 justify-center">
                Send claim on WhatsApp <Arrow />
              </button>
            </motion.form>
          )}
        </div>
      )}
    </div>
  );
}
