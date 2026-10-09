import { Link } from "react-router";

/**
 * The TBC logo — the full lock-up, exactly as supplied: both speech bubbles and THE BRAND CAPPUCCINO.
 * `tbc-logo-dark.png` is the same artwork with the black wordmark set in Text (#F3EAD8) so it reads on
 * the dark site; `tbc-logo.png` is the untouched original for light backgrounds.
 */
export function LogoMark({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <img
      src={light ? "/media/tbc-logo.png" : "/media/tbc-logo-dark.png"}
      alt=""
      aria-hidden
      width={1202}
      height={943}
      className={`h-auto ${className}`}
    />
  );
}

/** Header lock-up, as in the mockup. */
export function Logo({ to = "/", className = "" }: { to?: string; className?: string }) {
  return (
    <Link to={to} aria-label="The Brand Cappuccino — home" className={`inline-flex ${className}`}>
      <LogoMark className="w-[4.5rem]" />
    </Link>
  );
}

/** The TBC speech-bubble mark, redrawn as a champagne line drawing for dark rooms. */
export function BubbleMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 92" fill="none" className={className} aria-hidden>
      <g stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
        <path d="M14 8.5 70 6a12 12 0 0 1 12.5 11.4l1.4 28a12 12 0 0 1-11.4 12.6L32 60l.2 13-13-12.2h-2.6A12 12 0 0 1 4.4 49.4L3 21a12 12 0 0 1 11-12.5Z" />
        <path d="M62 50.5 98 44.6a10 10 0 0 1 11.5 8.2l3.2 19a10 10 0 0 1-8.2 11.6l-.6.1-5.7 8.4-2-8.9-28 4.6A10 10 0 0 1 57.4 79l-3.6-17a10 10 0 0 1 8.2-11.5Z" fill="currentColor" fillOpacity="0.12" />
        <path d="M78 60.5l.9 7.5M89 58.7l.9 7.5M75 74c5.5 5 15 4.6 19.5-3.6" />
      </g>
      <text x="13" y="44" fill="currentColor" fontFamily="Manrope, sans-serif" fontSize="26" fontWeight="800" transform="rotate(-3 40 34)">
        TBC
      </text>
    </svg>
  );
}
