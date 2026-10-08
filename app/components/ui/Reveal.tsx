import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "p" | "li" | "section" | "span";
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1.1, ease, delay }}
    >
      {children}
    </Tag>
  );
}

const lineParent: Variants = {
  hidden: {},
  show: (stagger: number) => ({ transition: { staggerChildren: stagger } }),
};
const lineChild: Variants = {
  hidden: { y: "110%", rotate: 2 },
  show: { y: "0%", rotate: 0, transition: { duration: 1.2, ease } },
};

/**
 * Masked line-by-line headline reveal. Pass lines as an array so we control the breaks.
 * `animate` plays immediately (hero); otherwise it plays when scrolled into view.
 */
export function RevealLines({
  lines,
  className = "",
  lineClassName = "",
  stagger = 0.12,
  delay = 0,
  immediate = false,
  as = "h2",
}: {
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  stagger?: number;
  delay?: number;
  immediate?: boolean;
  as?: "h1" | "h2" | "h3" | "p";
}) {
  const Tag = motion[as];
  const trigger = immediate
    ? { animate: "show" }
    : { whileInView: "show", viewport: { once: true, margin: "-10% 0px" } };
  return (
    <Tag
      className={className}
      variants={lineParent}
      custom={stagger}
      initial="hidden"
      transition={{ delayChildren: delay }}
      {...trigger}
    >
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <motion.span className={`block origin-left ${lineClassName}`} variants={lineChild}>
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
