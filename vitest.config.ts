import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts so the React Router plugin doesn't load for unit tests.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
