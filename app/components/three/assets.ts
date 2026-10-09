/** Paths to the 3D office assets. Built by `scripts/prepare-assets.sh`. */
const tex = (name: string) => `/assets/textures/${name}`;

export const assets = {
  walnut: {
    map: tex("smoked_walnut_veneer_diff.jpg"),
    normalMap: tex("smoked_walnut_veneer_nor.png"),
    roughnessMap: tex("smoked_walnut_veneer_rough.png"),
    aoMap: tex("smoked_walnut_veneer_ao.png"),
  },
  marble: {
    map: tex("marble_01_diff.jpg"),
    normalMap: tex("marble_01_nor.png"),
    roughnessMap: tex("marble_01_rough.png"),
  },
  brass: {
    roughnessMap: tex("brass_rough.png"),
    normalMap: tex("brass_nor.png"),
  },
  /** Poly Haven furniture & objects, exported from .blend by scripts/blend-to-glb.py */
  furniture: {
    armchairClassic: "/assets/models/armchair_classic.glb",
    armchairModern: "/assets/models/armchair_modern.glb",
    ceilingLamp: "/assets/models/ceiling_lamp.glb",
    brassVase: "/assets/models/brass_vase.glb",
    plant: "/assets/models/potted_plant.glb",
  },
  hdri: "/assets/hdri/lythwood_lounge_2k.hdr",
  /** The logo lock-up, dark-background version (wordmark in Text colour). */
  logo: "/media/tbc-logo-dark.png",
  fonts: {
    display: "/fonts/manrope-latin-700-normal.woff",
    /** three.js typeface for extruded lettering — scripts/make-typeface.mjs */
    displayTypeface: "/fonts/manrope-800.typeface.json",
    sans: "/fonts/manrope-latin-500-normal.woff",
  },
} as const;
