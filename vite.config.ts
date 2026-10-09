import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  // The 3D office is lazy-loaded, so Vite would otherwise discover these mid-session,
  // re-bundle, and briefly serve two copies of React. Pre-bundle them up front.
  optimizeDeps: {
    include: [
      "three",
      "three/examples/jsm/loaders/FontLoader.js",
      "three/examples/jsm/utils/BufferGeometryUtils.js",
      "@react-three/fiber",
      "@react-three/drei",
      "@react-three/drei/materials/BlurPass.js",
      "@react-three/drei/materials/MeshReflectorMaterial.js",
      "@react-three/postprocessing",
      "postprocessing",
    ],
  },
});
