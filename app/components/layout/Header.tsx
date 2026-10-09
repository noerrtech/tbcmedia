import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { bookingLink, rooms } from "~/content/site";
import { Logo } from "~/components/ui/Logo";
import { dur, ease } from "~/lib/motion";

const siteLinks = [
  { label: "About", href: "/#about" },
  { label: "Work", href: "/#work" },
  { label: "Services", href: "/#services" },
  { label: "Industries", href: "/#industries" },
  { label: "Founder", href: "/#founder" },
  { label: "Contact", href: "/#contact" },
];

/** The header's own short list, as in the Mughal Noir mockup. */
const navLinks = [
  { label: "Work", href: "/#work" },
  { label: "What we do", href: "/#services" },
  { label: "Founder", href: "/#founder" },
  { label: "JBN offer", href: "/#jbn" },
];

export function Header({ variant = "site" }: { variant?: "site" | "office" }) {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const { scrollY } = useScroll();
  const { pathname } = useLocation();
  useMotionValueEvent(scrollY, "change", (y) => setSolid(y > 40));
  useEffect(() => setOpen(false), [pathname]);

  const current = rooms.find((r) => r.path === pathname);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background,backdrop-filter,border-color] duration-700 ${
          solid || open ? "border-b border-line bg-ink/70 backdrop-blur-md" : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between gap-6 px-6 md:px-10">
          <Logo to={variant === "office" ? "/tbc" : "/"} />

          {variant === "site" ? (
            <nav className="ml-auto hidden items-center gap-8 lg:flex" aria-label="Primary">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className="text-sm text-ivory transition-colors hover:text-champagne">
                  {l.label}
                </a>
              ))}
            </nav>
          ) : (
            <AnimatePresence mode="wait">
              {current && (
                <motion.p
                  key={current.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.5 }}
                  className="hidden text-[0.65rem] tracking-[0.34em] text-mist uppercase md:block"
                >
                  <span className="text-gold">{current.no}</span> &nbsp;—&nbsp; {current.name}
                </motion.p>
              )}
            </AnimatePresence>
          )}

          <div className="flex items-center gap-5">
            {variant === "site" ? (
              <a
                href={bookingLink()}
                target="_blank"
                rel="noreferrer"
                className="hidden border border-champagne px-4 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-champagne hover:text-ink sm:block"
              >
                Book a consultation
              </a>
            ) : (
              <Link to="/" className="hidden text-[0.65rem] tracking-[0.28em] text-champagne uppercase sm:block link-underline">
                Classic site
              </Link>
            )}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              className={`group relative flex h-10 w-10 ${variant === "site" ? "lg:hidden" : ""} flex-col items-center justify-center gap-[6px]`}
            >
              <span className={`h-px w-6 bg-ivory transition-transform duration-200 ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
              <span className={`h-px w-6 bg-ivory transition-transform duration-200 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 overflow-y-auto bg-ink/95 backdrop-blur-xl"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)", transition: { duration: 0.32, ease: ease.out } }}
            transition={{ duration: dur.menu, ease: ease.drawer }}
            data-lenis-prevent
          >
            <div className="mx-auto grid min-h-full max-w-[1600px] gap-16 px-6 pt-32 pb-16 md:grid-cols-2 md:px-10">
              <div>
                <p className="eyebrow mb-8">The office — walk the rooms</p>
                <ul className="space-y-3">
                  {rooms.map((r, i) => (
                    <motion.li
                      key={r.key}
                      initial={{ opacity: 0, transform: "translateX(-12px)" }}
                      animate={{ opacity: 1, transform: "translateX(0px)" }}
                      transition={{ delay: 0.12 + i * 0.04, duration: 0.35, ease: ease.out }}
                    >
                      <Link to={r.path} className="group flex items-baseline gap-5">
                        <span className="text-xs text-gold">{r.no}</span>
                        <span className="display title-md text-ivory/80 transition-colors group-hover:text-champagne">{r.name}</span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow mb-8">The classic route — just scroll</p>
                <ul className="space-y-3">
                  {siteLinks.map((l, i) => (
                    <motion.li
                      key={l.href}
                      initial={{ opacity: 0, transform: "translateX(-12px)" }}
                      animate={{ opacity: 1, transform: "translateX(0px)" }}
                      transition={{ delay: 0.16 + i * 0.04, duration: 0.35, ease: ease.out }}
                    >
                      <a href={l.href} onClick={() => setOpen(false)} className="display title-md text-ivory/80 transition-colors hover:text-champagne">
                        {l.label}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
