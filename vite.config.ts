import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
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
        target: process.env.VITE_API_TARGET || "http://127.0.0.1:8085",
        changeOrigin: true,
        headers: {
          "x-api-key": process.env.PW_PRACTICE_API_KEY || "arjunonfire",
        },
      },
    },
  },
  preview: {
    port: 5100,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: process.env.VITE_API_TARGET || "http://127.0.0.1:8085",
        changeOrigin: true,
        headers: {
          "x-api-key": process.env.PW_PRACTICE_API_KEY || "arjunonfire",
        },
      },
    },
  },
});
