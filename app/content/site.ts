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
  headline: "We make brands that people remember.",
  /** The proof line that goes with 419M+ wherever it appears. */
  proof: "Without a rupee spent on ads.",
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
  { value: 419, suffix: "M+", label: "views.", note: "Without a rupee spent on ads." },
  { value: 51000, suffix: "+", label: "professionals", note: "in a global community." },
  { value: 44, suffix: "+", label: "countries", note: "represented." },
  // TODO(confirm): "35+ industries / categories" comes from the brief.
  { value: 35, suffix: "+", label: "industries", note: "and categories." },
];

export const impactStats: Stat[] = [
  { value: 419, suffix: "M+", label: "views.", note: "Without a rupee spent on ads." },
  { value: 51000, suffix: "+", label: "community members,", note: "built across 44+ countries." },
  { value: 35, suffix: "+", label: "industries.", note: "Growth problems, not niches." },
  { value: 4, suffix: "", label: "markets.", note: "India · Dubai · UK · USA." },
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
export type WorkMetric = { value: string; label: string };
/**
 * One act of the Work room: a growth problem and the case study that shows it solved.
 * The story beats (problem → what we did → what changed) are what the page lays out.
 */
export type WorkCategory = {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  problem: string;
  approach: string;
  change: string;
  metrics?: WorkMetric[];
  services: string[];
  items: WorkItem[];
};

// TODO(confirm): placeholders until the real case studies come in — swap in the client, the
// problem in their words, what TBC did and the measured result. Numbers here are TBC's real
// totals (419M+ views, the 51,000+ / 44+ country community), not a single client's.
export const work: WorkCategory[] = [
  {
    id: "zero",
    title: "Built from zero",
    subtitle: "Brand launches & new businesses",
    body: "Name, story, identity and launch — for brands that didn't exist yesterday.",
    problem: "A new business with a product and a plan — but no name, no story and no face the market would remember.",
    approach: "Named it, wrote the story, built the identity and planned the launch as a sequence, not a single post.",
    change: "A brand that walked into its market with a clear promise from day one.",
    services: ["Naming", "Brand identity", "Launch roadmap"],
    items: [{ client: "Case study", summary: "A brand launched from a blank page." }],
  },
  {
    id: "repositioned",
    title: "Repositioned",
    subtitle: "Brands that needed a sharper market position",
    body: "Good businesses the market had misread — re-framed so the right customers finally saw them.",
    problem: "A good business filed on the wrong shelf — compared on price, not on what it did best.",
    approach: "Mapped the category and the competition, found the space only it could own and rebuilt the messaging around it.",
    change: "The right customers finally saw it for what it was.",
    services: ["Market mapping", "Positioning", "Messaging"],
    items: [{ client: "Case study", summary: "A home-grown brand repositioned to lead its category." }],
  },
  {
    id: "visible",
    title: "Made visible",
    subtitle: "Social, content & awareness",
    body: "Content systems that put brands in front of millions — without buying the attention.",
    problem: "A strong product nobody was seeing — and no budget to buy the attention.",
    approach: "A strategy-led content system: reels, creators and formats built from the brand outward, not from trends inward.",
    change: "Reach in the hundreds of millions, earned rather than bought.",
    metrics: [{ value: "419M+", label: "views, without a rupee spent on ads" }],
    services: ["Content strategy", "Reels & production", "Creators & UGC"],
    items: [{ client: "Case study", summary: "Organic reach built through strategy-led content." }],
  },
  {
    id: "desirable",
    title: "Made desirable",
    subtitle: "Creative, campaigns & brand identity",
    body: "Campaigns with recall. Identities people want to be seen with.",
    problem: "A brand people knew of — but didn't want to be seen with.",
    approach: "Campaign ideas with recall, an identity worth wearing and experiences people talked about.",
    change: "A brand people chose to share, not just scroll past.",
    services: ["Campaigns", "Brand identity", "Experiential"],
    items: [{ client: "Case study", summary: "A campaign remembered long after it ran." }],
  },
  {
    id: "grow",
    title: "Made to grow",
    subtitle: "Growth strategy & marketing systems",
    body: "Communities, performance and automation that turn attention into business.",
    problem: "Plenty of attention — that wasn't turning into business.",
    approach: "Community, performance marketing and automation, built to work as one growth engine.",
    change: "A community and growth engine that runs across continents.",
    metrics: [
      { value: "51,000+", label: "professionals in the community" },
      { value: "44+", label: "countries" },
    ],
    services: ["Community", "Performance marketing", "AI automation"],
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
  { path: "/tbc/services", key: "services", no: "03", name: "What We Do" },
  { path: "/tbc/work", key: "work", no: "04", name: "The Work" },
  { path: "/tbc/jbn", key: "jbn", no: "05", name: "JBN Offer" },
  { path: "/tbc/next", key: "next", no: "06", name: "Start a project" },
] as const;

export const receptionOptions = [
  { no: "01", title: "Meet the Founder", body: "I want to understand who is behind TBC.", to: "/tbc/founder" },
  { no: "02", title: "See the Work", body: "Show me what you've built.", to: "/tbc/work" },
  { no: "03", title: "What We Do", body: "I have a brand problem. Let's talk.", to: "/tbc/services" },
  { no: "04", title: "JBN Offer", body: "I heard there's something for the community.", to: "/tbc/jbn" },
  { no: "05", title: "Start a project", body: "Take me straight to the next step.", to: "/tbc/next" },
];
