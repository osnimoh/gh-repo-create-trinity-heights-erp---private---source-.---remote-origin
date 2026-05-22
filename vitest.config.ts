import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    // Unit + RLS tests. Playwright e2e lives in /tests/e2e and is excluded here.
    include: ["tests/unit/**/*.test.ts", "tests/rls/**/*.test.ts"],
    setupFiles: [],
  },
});
