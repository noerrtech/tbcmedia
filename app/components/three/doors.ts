/**
 * The lobby's doorways. Pure data (no three.js import) so the reception page can use it
 * without pulling the 3D bundle into the first load.
 */
export type DoorKey = "founder" | "work" | "services" | "jbn" | "next";

export type Door = {
  key: DoorKey;
  label: string;
  /** Where the doorway stands, on the floor. */
  pos: [number, number, number];
  /** The direction the doorway faces (into the lobby). */
  normal: [number, number, number];
  /** Colour of the light spilling out of the room beyond. */
  tint: string;
};

export const doors: Door[] = [
  { key: "founder", label: "Meet the Founder", pos: [4.7, 0, -7.9], normal: [0, 0, 1], tint: "#f2c98a" },
  { key: "work", label: "See the Work", pos: [-4.7, 0, -7.9], normal: [0, 0, 1], tint: "#d9694a" },
  { key: "services", label: "What We Do", pos: [-6.9, 0, -5.4], normal: [1, 0, 0], tint: "#D9B98A" },
  { key: "jbn", label: "JBN Offer", pos: [6.9, 0, -5.4], normal: [-1, 0, 0], tint: "#e8c27a" },
];

/** Reception answers → which doorway the camera walks through. "next" goes straight to the desk. */
export const doorForPath: Record<string, DoorKey> = {
  "/tbc/founder": "founder",
  "/tbc/work": "work",
  "/tbc/services": "services",
  "/tbc/jbn": "jbn",
  "/tbc/next": "next",
};
