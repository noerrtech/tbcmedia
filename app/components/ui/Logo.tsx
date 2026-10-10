import { Link } from "react-router";

/**
 * The TBC logo — the full lock-up, exactly as supplied: both speech bubbles and THE BRAND CAPPUCCINO.
 * `tbc-logo-dark.png` is the same artwork with the black wordmark set in Text (#F3EAD8) so it reads on
 * the dark site; `tbc-logo.png` is the untouched original for light backgrounds.
 */
export function LogoMark({ className = "", light = false, alt = "" }: { className?: string; light?: boolean; alt?: string }) {
  return (
    <img
      src={light ? "/media/tbc-logo.png" : "/media/tbc-logo-dark.png"}
      alt={alt}
      aria-hidden={alt ? undefined : true}
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
