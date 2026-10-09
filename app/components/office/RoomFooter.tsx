import { Link, useLocation } from "react-router";
import { rooms } from "~/content/site";
import { Arrow } from "~/components/ui/Arrow";

/** "Next room" door + a floor plan of the office. */
export function RoomFooter() {
  const { pathname } = useLocation();
  const index = rooms.findIndex((r) => r.path === pathname);
  const next = rooms[index + 1];

  return (
    <div className="border-t border-line">
      {next && (
        <Link to={next.path} className="group relative block overflow-hidden px-6 py-24 text-center md:py-32">
          <span aria-hidden className="absolute inset-0 bg-[radial-gradient(40%_80%_at_50%_100%,rgb(201_164_106/0.18),transparent_70%)] opacity-50 transition-opacity duration-250 group-hover:opacity-100" />
          <span className="eyebrow relative">Next room — {next.no}</span>
          <span className="display relative mt-5 flex items-center justify-center gap-6 text-4xl transition-colors duration-200 group-hover:text-champagne md:text-7xl">
            {next.name}
            <Arrow className="h-4 w-10 transition-transform duration-200 motion-safe:group-hover:translate-x-2" />
          </span>
        </Link>
      )}
      <nav aria-label="Office floor plan" className="border-t border-line">
        <ol className="mx-auto flex max-w-[1600px] items-center gap-2 overflow-x-auto px-6 py-6 md:px-10">
          {rooms.map((r, i) => {
            const here = r.path === pathname;
            return (
              <li key={r.key} className="flex items-center gap-2">
                <Link
                  to={r.path}
                  aria-current={here ? "page" : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap px-2 py-1 text-[0.6rem] tracking-[0.22em] uppercase transition-colors ${here ? "text-champagne" : "text-smoke hover:text-ivory"}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${here ? "bg-champagne shadow-[0_0_10px_#ead6ad]" : "bg-smoke"}`} />
                  {r.name}
                </Link>
                {i < rooms.length - 1 && <span className="h-px w-6 bg-line" />}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
