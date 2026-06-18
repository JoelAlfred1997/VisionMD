import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Vitest config kept separate from vite.config.ts so the Tauri dev-server
// options there don't bleed into the test run. Tests cover the
// framework-agnostic logic (outline, file helpers) and the persistence hooks,
// so a DOM environment (localStorage, File, window) is required.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
    css: false,
  },
});
