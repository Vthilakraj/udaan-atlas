import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: "./",
  define: {
    "import.meta.env.VITE_DATA_MODE": JSON.stringify(
      mode === "api" ? "api" : "demo",
    ),
  },
  server: { proxy: { "/api": "http://127.0.0.1:4100" } },
}));
