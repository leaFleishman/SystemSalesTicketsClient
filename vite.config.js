import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// The .NET API (SystemSalesTickets) does not have CORS enabled, and its
// "https" launch profile uses a self-signed dev certificate. Rather than
// touching the backend, we proxy /api and /health through the Vite dev
// server so the browser only ever talks to same-origin URLs.
//
// Point VITE_API_PROXY_TARGET (in a .env file, see .env.example) at
// whichever profile you run the API with:
//   http  -> http://localhost:5153   (default, simplest)
//   https -> https://localhost:7171  (requires secure: false, see below)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const PROXY_TARGET = env.VITE_API_PROXY_TARGET || "http://localhost:5153";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: PROXY_TARGET,
          changeOrigin: true,
          secure: false, // allow the https profile's self-signed cert
        },
        "/health": {
          target: PROXY_TARGET,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
