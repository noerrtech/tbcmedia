/**
 * Phones and tablets: a touch screen or a narrow one. They get the same 3D office with lighter
 * files (1k textures, a smaller light map) and a lighter renderer — the design doesn't change.
 */
export const isHandheld = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
