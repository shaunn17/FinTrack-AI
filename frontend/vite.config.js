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
  },
});
