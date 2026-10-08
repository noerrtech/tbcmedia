import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { MotionConfig } from "framer-motion";
import type { Route } from "./+types/root";
import { SmoothScroll } from "./lib/smooth-scroll";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.png", type: "image/png" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Manrope:wght@300;400;500;600&family=Pinyon+Script&display=swap",
  },
  { rel: "preload", href: "/media/founder.webp", as: "image" },
];

export const meta: Route.MetaFunction = () => [
  { title: "The Brand Cappuccino — We make brands grow." },
  {
    name: "description",
    content:
      "TBC is a brand growth & strategy firm. Brand strategy, positioning, go-to-market, growth and creative execution for ambitious brands. 419M+ organic views.",
  },
  { name: "theme-color", content: "#0a0807" },
  { property: "og:title", content: "The Brand Cappuccino — We make brands grow." },
  { property: "og:description", content: "Brand strategy. Positioning. Growth. Creative execution." },
  { property: "og:image", content: "/media/tbc-logo-color.png" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="grain">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll>
        <Outlet />
      </SmoothScroll>
    </MotionConfig>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Something went wrong";
  let details = "Please try again in a moment.";
  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? "This room doesn't exist" : `Error ${error.status}`;
    details = error.status === 404 ? "Let's take you back to reception." : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
  }
  return (
    <main className="room-light flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="eyebrow">The Brand Cappuccino</p>
      <h1 className="display text-5xl md:text-7xl">{title}</h1>
      <p className="text-mist">{details}</p>
      <a href="/" className="btn">Back to the entrance <span className="arrow">→</span></a>
    </main>
  );
}
