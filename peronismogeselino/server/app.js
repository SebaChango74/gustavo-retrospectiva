import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Raíz del repositorio: ahí vive la web actual de gustavobarrera.com
// (index.html, fotos/, memogesell/), que este servidor sirve sin modificar.
export const REPO_ROOT = path.resolve(__dirname, "..", "..");
export const APP_ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(APP_ROOT, "dist");

// Rutas del repositorio que nunca deben servirse como archivos estáticos.
const BLOCKED_PREFIXES = ["/peronismogeselino", "/_handoff", "/node_modules", "/scripts"];

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "256kb" }));

  // ─── App aislada: /peronismogeselino ───────────────────────────────────────
  if (fs.existsSync(DIST_DIR)) {
    app.use(
      "/peronismogeselino",
      express.static(DIST_DIR, { index: "index.html", maxAge: "1h" }),
    );
    // SPA fallback: cualquier GET bajo /peronismogeselino que no sea API ni
    // archivo existente devuelve el shell de la aplicación.
    app.get(/^\/peronismogeselino(?!\/api\/)(\/.*)?$/, (_req, res) => {
      res.sendFile(path.join(DIST_DIR, "index.html"));
    });
  } else {
    app.get(/^\/peronismogeselino(\/.*)?$/, (_req, res) => {
      res
        .status(503)
        .type("text/plain")
        .send("Peronismo Geselino: falta compilar la aplicación (npm run build).");
    });
  }

  // ─── Web actual, sin cambios ───────────────────────────────────────────────
  app.use((req, res, next) => {
    const url = req.path;
    if (BLOCKED_PREFIXES.some((p) => url === p || url.startsWith(`${p}/`))) {
      return res.status(404).type("text/plain").send("No encontrado");
    }
    next();
  });
  app.use(
    express.static(REPO_ROOT, {
      dotfiles: "ignore",
      index: "index.html",
      maxAge: "5m",
    }),
  );

  return app;
}
