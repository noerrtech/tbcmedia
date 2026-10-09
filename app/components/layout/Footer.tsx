import { Link } from "react-router";
import { brand, contact } from "~/content/site";
import { LogoMark } from "~/components/ui/Logo";

export function Footer() {
  return (
    <footer className="bg-sink relative border-t border-line">
      <div className="mx-auto grid max-w-[1600px] gap-14 px-6 py-20 md:grid-cols-12 md:px-10">
        <div className="md:col-span-5">
          <LogoMark className="w-40" alt={brand.name} />
          <p className="mt-8 max-w-sm font-display text-2xl leading-snug text-ivory/85">{brand.promise}</p>
        </div>
        <div className="space-y-3 text-sm text-mist md:col-span-3">
          <p className="eyebrow mb-5">Talk to us</p>
          <a className="block hover:text-ivory" href={contact.phoneHref}>{contact.phone}</a>
          <a className="block hover:text-ivory" href={`mailto:${contact.email}`}>{contact.email}</a>
          <a className="block hover:text-ivory" href={contact.instagramHref} target="_blank" rel="noreferrer">@{contact.instagram}</a>
        </div>
        <div className="space-y-3 text-sm text-mist md:col-span-2">
          <p className="eyebrow mb-5">Studios</p>
          <p>{contact.cities}</p>
          <p>{contact.reach}</p>
          <p className="text-smoke">{contact.markets.join(" · ")}</p>
        </div>
        <div className="space-y-3 text-sm text-mist md:col-span-2">
          <p className="eyebrow mb-5">Explore</p>
          <Link className="block hover:text-ivory" to="/tbc">Enter the office</Link>
          <Link className="block hover:text-ivory" to="/tbc/work">The work</Link>
          <Link className="block hover:text-ivory" to="/tbc/jbn">JBN offer</Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-2 border-t border-line px-6 py-6 text-[0.65rem] tracking-[0.2em] text-smoke uppercase md:flex-row md:px-10">
        <p>© {new Date().getFullYear()} {brand.name}</p>
        <p>{brand.label}</p>
      </div>
    </footer>
  );
}
