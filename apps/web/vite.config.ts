import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@atelier/domain": path.resolve(__dirname, "../../packages/domain/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4111",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost:4111",
        changeOrigin: true,
      },
      "/app": {
        target: "http://localhost:4111",
        changeOrigin: true,
      },
    },
  },
})
