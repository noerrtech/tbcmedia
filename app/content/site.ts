/**
 * Single source of truth for every word, number and link on the site.
 *
 * Anything marked `TODO(confirm)` is copy from the brief/mockup that has not
 * yet been verified against the TBC profile — confirm with Riya before launch.
 */

export const brand = {
  name: "The Brand Cappuccino",
  short: "TBC",
  label: "Brand Growth & Strategy",
  headline: "We make brands grow.",
  subline: "Brand strategy. Positioning. Growth. Creative execution.",
  pillars: ["Positioning", "Strategy", "Creative", "Growth"],
  promise: "We build brands that are built to grow.",
  descriptor: "Strategy, positioning and creative growth systems for ambitious brands.",
};

export const contact = {
  phone: "+91 88790 76477",
  phoneHref: "tel:+918879076477",
  whatsapp: "918879076477",
  email: "Hello@TBCmedia.in",
  website: "TBCmedia.in",
  instagram: "TBC.thebrandcappuccino",
  instagramHref: "https://www.instagram.com/tbc.thebrandcappuccino/",
  cities: "Surat | Mumbai",
  reach: "Serving clients across the globe",
  markets: ["India", "Dubai", "UK", "USA"],
  // Booking buttons open a pre-filled WhatsApp chat. Set a Calendly URL here to switch them over.
  bookingUrl: "",
};

export function whatsappLink(message: string) {
  return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;
}

/** Calendly when configured, otherwise a pre-filled WhatsApp message. */
export function bookingLink(context = "I'd like to book a consultation with TBC.") {
  return contact.bookingUrl || whatsappLink(context);
}

export const founder = {
  name: "Riya Nanavati",
  firstName: "Riya",
  roles: ["Founder", "CEO", "Lead Strategist"],
  intro: "Investment banker turned entrepreneur.",
  portrait: "/media/founder.webp",
  journey: [
    "Investment banking",
    "Entrepreneurship",
    "Building brands",
    "Building communities",
    "Helping businesses grow",
  ],
  // TODO(confirm): consultation price, e.g. "₹X / hour". Hidden on the site while empty.
  consultationRate: "",
  credentials: [
    "Founded a global community of 51,000+ professionals spanning 44+ countries.",
    "Invited speaker at UC Berkeley, California.",
    "Featured in international & national media across domains.",
    "Co-founded an NGO creating social impact.",
    "A track record of building brands and communities with measurable results.",
  ],
  philosophyHook: "I didn't start TBC to create another marketing agency.",
  philosophy: [
    "I built TBC because great businesses don't always become great brands.",
    "Sometimes they need clarity. Sometimes they need positioning. Sometimes they need a completely different way of going to market.",
    "That's where we come in.",
  ],
  note: {
    quote: "I built TBC to help businesses become brands that matter.",
    opening:
      "I've spent my career sitting at the intersection of business, brands and people.",
    ambition:
      "My ambition for TBC is simple. To build a firm that doesn't just help brands communicate better — but helps them become better businesses.",
    // Drop a file at public/media/founder-note.mp4 and set this to play the film.
    video: "",
  },
};

/**
 * Media / stage credibility, confirmed by TBC. Only `verified` entries are
 * rendered — set one to false to hide it.
 */
export const featuredIn: { name: string; verified: boolean }[] = [
  { name: "UC Berkeley", verified: true },
  { name: "TEDx", verified: true },
  { name: "Forbes", verified: true },
  { name: "Entrepreneur", verified: true },
  { name: "Business Standard", verified: true },
  { name: "YourStory", verified: true },
];

export type Stat = { value: number; suffix: string; label: string; note?: string };

export const founderStats: Stat[] = [
  { value: 419, suffix: "M+", label: "Organic views generated" },
  { value: 51000, suffix: "+", label: "Professionals in a global community" },
  { value: 44, suffix: "+", label: "Countries represented" },
  // TODO(confirm): "35+ industries / categories" comes from the brief.
  { value: 35, suffix: "+", label: "Industries & categories" },
];

export const impactStats: Stat[] = [
  { value: 419, suffix: "M+", label: "Organic views", note: "Across the TBC portfolio" },
  { value: 51000, suffix: "+", label: "Community members", note: "Built across 44+ countries" },
  { value: 35, suffix: "+", label: "Industries", note: "Growth problems, not niches" },
  { value: 4, suffix: "", label: "Markets", note: "India · Dubai · UK · USA" },
];

export const impactProofs = [
  { title: "Home-grown to leading", body: "Converted home-grown brands into India's leading brands." },
  { title: "Record time", body: "Delivered industry-best results in record time." },
  { title: "Real recall", body: "Creative campaigns known for strong recall and real results." },
];

export const beliefs = {
  title: "Great businesses deserve great positioning.",
  body: "Great brands aren't built by posting more. They're built by knowing what they stand for, who they're for and why the market should care.",
};

export type Service = {
  no: string;
  title: string;
  question: string;
  detail: string;
  outcomes: string[];
};

export const services: Service[] = [
  {
    no: "01",
    title: "Brand Strategy",
    question: "What should your brand stand for?",
    detail: "We define the purpose, promise and personality that every decision, campaign and conversation should return to.",
    outcomes: ["Brand platform", "Purpose & promise", "Tone of voice", "Brand architecture"],
  },
  {
    no: "02",
    title: "Positioning",
    question: "Why should the market choose you?",
    detail: "We find the space only you can own — and make it impossible for the right customer to confuse you with anyone else.",
    outcomes: ["Market & competitor mapping", "Audience insight", "Positioning statement", "Messaging hierarchy"],
  },
  {
    no: "03",
    title: "Go-to-Market",
    question: "How do we introduce or reposition you?",
    detail: "Launches and relaunches planned as a sequence, not a moment — channels, timing, partners and the story that ties them.",
    outcomes: ["Launch roadmap", "Channel plan", "Brand launch events", "Partnerships & influence"],
  },
  {
    no: "04",
    title: "Growth Strategy",
    question: "How do we turn attention into business?",
    detail: "Systems that connect visibility to revenue — so growth is something you can plan, measure and repeat.",
    outcomes: ["Growth model", "Performance marketing", "Community building", "AI automation"],
  },
  {
    no: "05",
    title: "Social & Content",
    question: "How does the strategy show up in culture?",
    detail: "Reels, content and creator programmes built from the strategy outward — not trends inward.",
    outcomes: ["Social media marketing", "Reels & content production", "Influencer & UGC", "Event social media"],
  },
  {
    no: "06",
    title: "Creative & Campaigns",
    question: "How do we make people care?",
    detail: "Ideas with recall. Campaigns, identities and experiences that make the brand impossible to scroll past.",
    outcomes: ["Campaign ideas", "Brand identity", "Websites", "Experiential"],
  },
];

export const serviceLine = {
  lead: "Social media isn't the strategy.",
  follow: "It's one of the places strategy comes to life.",
};

/** Execution capabilities from the TBC profile. */
export const capabilities = [
  "Brand Strategy & Consulting",
  "Social Media Marketing",
  "Reels & Content Production",
  "Influencer & UGC Campaigns",
  "Brand Launch Events",
  "Wedding & Event Social Media",
  "Community Building",
  "Performance Marketing",
  "AI Automation",
  "Websites",
];

// TODO(confirm): keep only industries TBC has evidence for.
export const industries = [
  { name: "Consumer Brands", tone: "from-amber-900/40" },
  { name: "Fashion & Lifestyle", tone: "from-rose-900/40" },
  { name: "Hospitality", tone: "from-orange-900/40" },
  { name: "Events & Experiences", tone: "from-yellow-900/40" },
  { name: "Education", tone: "from-stone-700/40" },
  { name: "Technology", tone: "from-slate-700/40" },
  { name: "Professional Services", tone: "from-neutral-700/40" },
  { name: "Wellness & Personal Brands", tone: "from-emerald-950/40" },
];

export type WorkItem = { client: string; summary: string; result?: string; image?: string };
export type WorkCategory = { id: string; title: string; subtitle: string; body: string; items: WorkItem[] };

// Placeholders until real case studies come in.
export const work: WorkCategory[] = [
  {
    id: "zero",
    title: "Built from zero",
    subtitle: "Brand launches & new businesses",
    body: "Name, story, identity and launch — for brands that didn't exist yesterday.",
    items: [{ client: "Case study", summary: "A brand launched from a blank page." }],
  },
  {
    id: "repositioned",
    title: "Repositioned",
    subtitle: "Brands that needed a sharper market position",
    body: "Good businesses the market had misread — re-framed so the right customers finally saw them.",
    items: [{ client: "Case study", summary: "A home-grown brand repositioned to lead its category." }],
  },
  {
    id: "visible",
    title: "Made visible",
    subtitle: "Social, content & awareness",
    body: "Content systems that put brands in front of millions — 419M+ organic views and counting.",
    items: [{ client: "Case study", summary: "Organic reach built through strategy-led content." }],
  },
  {
    id: "desirable",
    title: "Made desirable",
    subtitle: "Creative, campaigns & brand identity",
    body: "Campaigns with recall. Identities people want to be seen with.",
    items: [{ client: "Case study", summary: "A campaign remembered long after it ran." }],
  },
  {
    id: "grow",
    title: "Made to grow",
    subtitle: "Growth strategy & marketing systems",
    body: "Communities, performance and automation that turn attention into business.",
    items: [{ client: "Case study", summary: "A community and growth engine across 44+ countries." }],
  },
];

export const principles = [
  { title: "Think commercially.", body: "We don't separate brand from business." },
  { title: "Position before promotion.", body: "Clarity comes before content." },
  { title: "Build for the long game.", body: "We're interested in brands, not campaigns alone." },
  { title: "Make strategy visible.", body: "A strategy is only useful when it changes what people see, feel and do." },
];

export const jbn = {
  title: "JBN Exclusive",
  offer: "Free 20-min social media audit",
  total: 30,
  defaultClaimed: 17,
  greeting: "Oh, you're here through JBN?",
};

// Placeholders until real client words come in (the profile QR links to them).
export const testimonials = [
  {
    quote: "Working with TBC completely changed how we show up in the market. It's not just content, it's real strategic thinking.",
    name: "Founder",
    company: "Lifestyle brand",
    placeholder: true,
  },
  {
    quote: "They asked questions about our business nobody had asked before — and the brand that came out of it finally sounds like us.",
    name: "Co-founder",
    company: "Consumer brand",
    placeholder: true,
  },
  {
    quote: "Our launch didn't feel like a post. It felt like an event the whole city was talking about.",
    name: "Director",
    company: "Hospitality group",
    placeholder: true,
  },
];

export const actions = [
  {
    eyebrow: "I'm building",
    title: "A brand",
    body: "Let's build the foundation.",
    cta: "Start a conversation",
    message: "Hi TBC — I'm building a new brand and would like to start a conversation.",
  },
  {
    eyebrow: "I'm growing",
    title: "An existing brand",
    body: "Let's find the next level.",
    cta: "Talk growth",
    message: "Hi TBC — I'm growing an existing brand and want to talk growth.",
  },
  {
    eyebrow: "I need a",
    title: "Strategic reset",
    body: "Let's figure out what's not working.",
    cta: "Book a consultation",
    message: "Hi TBC — I need a strategic reset and would like to book a consultation.",
    booking: true,
  },
];

/** Rooms of the interactive office, in walking order. */
export const rooms = [
  { path: "/tbc", key: "reception", no: "00", name: "Reception" },
  { path: "/tbc/founder", key: "founder", no: "01", name: "The Founder's Room" },
  { path: "/tbc/story", key: "story", no: "02", name: "Why TBC Exists" },
  { path: "/tbc/services", key: "services", no: "03", name: "The Strategy Library" },
  { path: "/tbc/work", key: "work", no: "04", name: "The Work" },
  { path: "/tbc/jbn", key: "jbn", no: "05", name: "The JBN Room" },
  { path: "/tbc/next", key: "next", no: "06", name: "The Action Room" },
] as const;

export const receptionOptions = [
  { no: "01", title: "Meet the Founder", body: "I want to understand who is behind TBC.", to: "/tbc/founder" },
  { no: "02", title: "See the Work", body: "Show me what you've built.", to: "/tbc/work" },
  { no: "03", title: "Explore What We Do", body: "I have a brand problem. Let's talk.", to: "/tbc/services" },
  { no: "04", title: "TBC / JBN Offers", body: "I heard there's something for the community.", to: "/tbc/jbn" },
  { no: "05", title: "I Know What I Need", body: "Take me straight to the next step.", to: "/tbc/next" },
];
