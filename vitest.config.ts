import { defineConfig } from "vitest/config";

// Convex tests opt into the edge runtime per file with
// `// @vitest-environment edge-runtime`.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "convex/**/*.test.ts"],
  },
});
