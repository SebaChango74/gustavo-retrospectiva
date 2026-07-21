import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { attachMember, ensureAdmins } from "./auth.js";
import { publicRoutes } from "./routes/public.js";
import { authRoutes } from "./routes/auth.js";
import { adminRoutes } from "./routes/admin.js";
import { communityRoutes } from "./routes/community.js";
import { quizRoutes } from "./routes/quiz.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Raíz del repositorio: ahí vive la web actual de gustavobarrera.com
// (index.html, fotos/, memogesell/), que este servidor sirve sin modificar.
export const REPO_ROOT = path.resolve(__dirname, "..", "..");
export const APP_ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(APP_ROOT, "dist");

// Rutas del repositorio que nunca deben servirse como archivos estáticos.
const BLOCKED_PREFIXES = ["/peronismogeselino", "/_handoff", "/node_modules", "/scripts"];

export function createApp(db) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "256kb" }));

  // Encabezados de seguridad para todo el sitio.
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  // ─── API de la app aislada ────────────────────────────────────────────────
  const api = express.Router();
  api.use(rateLimit({ windowMs: 60_000, max: 240 }));
  api.use("/auth", rateLimit({ windowMs: 60_000, max: 20, methods: ["POST"] }));
  api.use(attachMember(db));
  api.use("/auth", authRoutes(db));
  api.use("/public", publicRoutes(db));
  api.use("/admin", adminRoutes(db));
  api.use("/community", communityRoutes(db));
  api.use("/quiz", quizRoutes(db));
  api.use((req, res) => res.status(404).json({ error: "Ruta de API inexistente." }));
  api.use((err, _req, res, _next) => {
    console.error("API error:", err);
    res.status(500).json({ error: "Error interno del servidor." });
  });
  app.use("/peronismogeselino/api", api);

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
    app.get(/^\/peronismogeselino(?!\/api\/)(\/.*)?$/, (_req, res) => {
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

export { ensureAdmins };

// Limitador de ritmo simple en memoria, suficiente para el volumen del portal.
function rateLimit({ windowMs, max, methods }) {
  const hits = new Map();
  return (req, res, next) => {
    if (methods && !methods.includes(req.method)) return next();
    const now = Date.now();
    const key = req.ip || "local";
    const entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      hits.set(key, { start: now, count: 1 });
      if (hits.size > 10_000) hits.clear();
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      return res.status(429).json({ error: "Demasiadas solicitudes. Esperá un momento." });
    }
    next();
  };
}
