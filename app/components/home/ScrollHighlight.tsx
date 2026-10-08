import { useRef } from "react";
import { gsap, useGSAP } from "~/lib/gsap";

/** Words light up one by one as you scroll past — the statement becomes the scroll. */
export function ScrollHighlight({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useGSAP(
    () => {
      gsap.fromTo(
        "[data-word]",
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top 80%", end: "bottom 45%", scrub: true },
        },
      );
    },
    { scope: ref },
  );
  return (
    <p ref={ref} className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <span key={i} data-word aria-hidden className="inline-block whitespace-pre">
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
