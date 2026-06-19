import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Vitest config for HLShajara unit tests.
 *
 * vite-tsconfig-paths reads tsconfig.json `paths` so `@/*` resolves to `./src/*`
 * exactly as the app does — tests import project modules with no alias drift.
 * environment "node" because the suites under test (challenge lib, /api/submit
 * route) are server-side and never touch the DOM.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
