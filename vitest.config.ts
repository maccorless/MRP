import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Run each test file in its own process so module-level state (TAG, mockCookieStore)
    // is isolated. Files run sequentially (fileParallelism: false) because they share a real DB
    // and concurrent cleanup hooks (beforeAll/afterAll) cause TOCTOU audit log failures.
    include: ["src/test/**/*.test.ts"],
    testTimeout: 15000,
    pool: "forks",
    fileParallelism: false,
    env: (() => {
      // Load .env.local for integration tests so DATABASE_URL and NEXTAUTH_SECRET
      // are available in vitest worker threads (loadEnvConfig in setup.ts only
      // runs inside the worker after the module graph is already importing db/).
      try {
        const fs = require("fs");
        const raw = fs.readFileSync(".env.local", "utf8");
        const vars: Record<string, string> = {};
        for (const line of raw.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const idx = trimmed.indexOf("=");
          if (idx === -1) continue;
          vars[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
        }
        return vars;
      } catch {
        return {};
      }
    })(),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
