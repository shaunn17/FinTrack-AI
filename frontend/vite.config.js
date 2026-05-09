import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  appType: "spa",
  server: {
    port: 5173,
    strictPort: false,
    // Same machine: use the URL Vite prints (localhost or 127.0.0.1). Listening
    // on all interfaces avoids odd “works in IDE preview but not Chrome” cases.
    host: true,
    // Browser calls /api on the same host:port as the dev server (e.g. 10.0.0.x:5173),
    // so income/expenses work when you open the Network URL instead of localhost.
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
