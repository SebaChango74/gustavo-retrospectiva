import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Por defecto la app vive bajo /peronismogeselino (integrada al repo de
// gustavobarrera.com). Con PG_BASE=/ se compila para vivir sola en la raíz
// de su propio dominio (modo independiente).
export default defineConfig({
  base: process.env.PG_BASE || "/peronismogeselino/",
  plugins: [react()],
  define: {
    // Sello de compilación. Se le cuelga al service worker en la dirección
    // para que la red de distribución no pueda servir una copia guardada:
    // una dirección distinta es un archivo distinto para ella.
    __PG_BUILD__: JSON.stringify(Date.now().toString(36)),
  },
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
