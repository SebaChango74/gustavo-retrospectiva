import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// La app vive bajo /peronismogeselino, aislada del resto de gustavobarrera.com.
export default defineConfig({
  base: "/peronismogeselino/",
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5199,
    proxy: {
      "/peronismogeselino/api": {
        target: "http://localhost:4600",
        changeOrigin: true,
      },
    },
  },
});
