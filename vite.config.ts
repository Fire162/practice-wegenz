import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_TARGET || process.env.VITE_API_TARGET || "http://127.0.0.1:8085";
  const apiKey = env.PRACTICE_API_KEY || env.VITE_PYQ_API_KEY || process.env.PRACTICE_API_KEY || "";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      port: 5100,
      host: "0.0.0.0",
      allowedHosts: true,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          headers: apiKey ? { "x-api-key": apiKey } : {},
        },
      },
    },
    preview: {
      port: 5100,
      host: "0.0.0.0",
      allowedHosts: true,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          headers: apiKey ? { "x-api-key": apiKey } : {},
        },
      },
    },
  };
});
