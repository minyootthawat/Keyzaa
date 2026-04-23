import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    exclude: ["node_modules", ".kilo", "tests", ".next"],
    coverage: { provider: "v8", exclude: ["node_modules", ".kilo", ".next", "tests"] },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
