/// <reference types="node" />
import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (
            id.includes("recharts") ||
            id.includes("d3-") ||
            id.includes("react-smooth") ||
            id.includes("victory")
          ) {
            return "charts";
          }
          if (id.includes("framer-motion") || id.includes("motion-dom")) {
            return "motion";
          }
          if (id.includes("lucide-react")) {
            return "icons";
          }
          if (
            id.includes("react") ||
            id.includes("react-dom") ||
            id.includes("react-router") ||
            id.includes("scheduler") ||
            id.includes("@vercel")
          ) {
            return "react-vendor";
          }
          return "vendor";
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
})
