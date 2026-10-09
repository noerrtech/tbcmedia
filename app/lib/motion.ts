/** Shared motion values — the JS twin of the tokens in app.css (Emil Kowalski's values). */
export const ease = {
  out: [0.23, 1, 0.32, 1],
  inOut: [0.77, 0, 0.175, 1],
  drawer: [0.32, 0.72, 0, 1],
} as const;

/** Durations in seconds. */
export const dur = {
  hover: 0.2,
  press: 0.16,
  exit: 0.25,
  page: 0.45,
  reveal: 0.7,
  headline: 0.9,
  menu: 0.5,
} as const;

/** Gap between items in a staggered entrance, seconds. */
export const stagger = 0.06;

