import { isHandheld } from "~/lib/device";

/**
 * Paths to the 3D office assets, built by `scripts/prepare-assets.sh` (compressed by
 * scripts/compress-assets.py): phones get the 1k textures and the smaller light map.
 */
const small = isHandheld();
const tex = (name: string) => `/assets/textures/${small ? "1k" : "2k"}/${name}`;

export const assets = {
  walnut: {
    map: tex("walnut_diff.webp"),
    normalMap: tex("walnut_nor.webp"),
    /** packed: ambient occlusion in red, roughness in green — how three.js reads both */
    orm: tex("walnut_orm.webp"),
  },
  /** the lobby floor */
  marble: {
    map: tex("marble_diff.webp"),
    normalMap: tex("marble_nor.webp"),
    roughnessMap: tex("marble_rough.webp"),
  },
  brass: {
    roughnessMap: tex("brass_rough.webp"),
    normalMap: tex("brass_nor.webp"),
  },
  /** Poly Haven furniture & objects, exported from .blend by scripts/blend-to-glb.py */
  furniture: {
    armchairClassic: "/assets/models/armchair_classic.glb",
    armchairModern: "/assets/models/armchair_modern.glb",
    ceilingLamp: "/assets/models/ceiling_lamp.glb",
    brassVase: "/assets/models/brass_vase.glb",
    plant: "/assets/models/potted_plant.glb",
  },
  /** The Work room's stage curtain, closed and gathered — scripts/make-curtain.mjs (CC BY 4.0, RomanSn) */
  curtain: "/assets/models/stage_curtain.glb",
  hdri: small ? "/assets/hdri/lounge-512.hdr" : "/assets/hdri/lounge-1k.hdr",
  /** The logo lock-up, dark-background version (wordmark in Text colour). */
  logo: "/media/tbc-logo-dark.png",
  fonts: {
    display: "/fonts/manrope-latin-700-normal.woff",
    /** three.js typeface for extruded lettering — scripts/make-typeface.mjs */
    displayTypeface: "/fonts/manrope-800.typeface.json",
    sans: "/fonts/manrope-latin-500-normal.woff",
  },
} as const;
