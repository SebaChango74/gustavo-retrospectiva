import express from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { attachMember, ensureAdmins } from "./auth.js";
import { publicRoutes } from "./routes/public.js";
import { authRoutes } from "./routes/auth.js";
import { adminRoutes } from "./routes/admin.js";
import { communityRoutes } from "./routes/community.js";
import { quizRoutes } from "./routes/quiz.js";
import { peron365Routes, peron365AdminRoutes } from "./routes/peron365.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Raíz del repositorio: ahí vive la web actual de gustavobarrera.com
// (index.html, fotos/, memogesell/).
export const REPO_ROOT = path.resolve(__dirname, "..", "..");
export const APP_ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(APP_ROOT, "dist");

// Modos de funcionamiento:
// - Integrado (por defecto): sirve la web actual en / y la app en /peronismogeselino.
// - Independiente (PG_STANDALONE=1): sirve SOLO la app, en la raíz de su propio
//   dominio. Requiere compilar la SPA con PG_BASE=/ .
// - PG_APP_DISABLED=1: sirve SOLO la web actual, sin la app (para que el
//   servicio de gustavobarrera.com nunca la muestre aunque el código esté).
const STANDALONE = process.env.PG_STANDALONE === "1";
const APP_DISABLED = process.env.PG_APP_DISABLED === "1";

// Rutas del repositorio que nunca deben servirse como archivos estáticos.
const BLOCKED_PREFIXES = ["/peronismogeselino", "/_handoff", "/node_modules", "/scripts"];

export function createApp(db) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "256kb" }));
  app.use(express.urlencoded({ extended: false, limit: "16kb" }));

  // Compuerta de vista previa: con PG_PREVIEW_CODE definido, nada se sirve sin
  // la clave. Pensada para mostrar la app en privado antes de publicarla.
  if (process.env.PG_PREVIEW_CODE) {
    app.use(previewGate(process.env.PG_PREVIEW_CODE));
  }

  // Encabezados de seguridad para todo el sitio.
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    // HSTS: solo cuando ya se sirve por HTTPS, para no bloquear pruebas locales.
    if (req.secure || req.headers["x-forwarded-proto"] === "https") {
      res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
    }
    // Política de contenido: solo scripts propios y los de Google necesarios
    // para el ingreso; mapas embebidos de Google; nada de plugins ni marcos
    // ajenos. Bloquea la ejecución de scripts inyectados.
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' https://accounts.google.com https://apis.google.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com",
        "frame-src https://www.google.com https://accounts.google.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
      ].join("; "),
    );
    next();
  });

  // Anti-CSRF: un sitio ajeno no puede provocar acciones con tu sesión. Si el
  // navegador informa un origen y no es el propio, se rechaza.
  app.use((req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    const origin = req.headers.origin;
    if (origin) {
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      let originHost = "";
      try {
        originHost = new URL(origin).host;
      } catch {
        originHost = "";
      }
      if (originHost && host && originHost !== host) {
        return res.status(403).json({ error: "Origen no permitido." });
      }
    }
    next();
  });

  const appBase = STANDALONE ? "" : "/peronismogeselino";

  if (!APP_DISABLED) {
    // ─── API ─────────────────────────────────────────────────────────────────
    const api = express.Router();
    api.use(rateLimit({ windowMs: 60_000, max: 240 }));
    api.use("/auth", rateLimit({ windowMs: 60_000, max: 20, methods: ["POST"] }));
    api.use(attachMember(db));
    api.use("/auth", authRoutes(db));
    api.use("/public", publicRoutes(db));
    api.use("/admin", adminRoutes(db));
    api.use("/community", communityRoutes(db));
    api.use("/quiz", quizRoutes(db));
    api.use("/peron365", peron365Routes(db));
    api.use("/admin/peron365", peron365AdminRoutes(db));
    api.use((req, res) => res.status(404).json({ error: "Ruta de API inexistente." }));
    api.use((err, _req, res, _next) => {
      console.error("API error:", err);
      res.status(500).json({ error: "Error interno del servidor." });
    });
    app.use(`${appBase}/api`, api);

    // ─── SPA ─────────────────────────────────────────────────────────────────
    if (fs.existsSync(DIST_DIR)) {
      if (STANDALONE) {
        // Compatibilidad: el contenido guarda imágenes como
        // /peronismogeselino/images/…; acá también resuelven.
        app.use(
          "/peronismogeselino",
          (req, res, next) => {
            if (path.extname(req.path)) return next();
            res.redirect(301, req.path === "/" || req.path === "" ? "/" : req.path);
          },
          express.static(DIST_DIR, { maxAge: "1h" }),
        );
        app.use(express.static(DIST_DIR, { index: "index.html", maxAge: "1h" }));
        // El respaldo SPA es solo para páginas: un archivo inexistente (JS/CSS
        // de una versión vieja, imagen borrada) debe dar 404, nunca HTML.
        app.get(/^\/(?!api\/).*/, (req, res) => {
          if (path.extname(req.path)) {
            return res.status(404).type("text/plain").send("No encontrado");
          }
          res.sendFile(path.join(DIST_DIR, "index.html"));
        });
      } else {
        app.use(
          "/peronismogeselino",
          express.static(DIST_DIR, { index: "index.html", maxAge: "1h" }),
        );
        app.get(/^\/peronismogeselino(?!\/api\/)(\/.*)?$/, (req, res) => {
          if (path.extname(req.path)) {
            return res.status(404).type("text/plain").send("No encontrado");
          }
          res.sendFile(path.join(DIST_DIR, "index.html"));
        });
      }
    } else {
      app.get(new RegExp(`^${appBase || ""}(?!/api/)(/.*)?$`), (_req, res) => {
        res
          .status(503)
          .type("text/plain")
          .send("Peronismo Geselino: falta compilar la aplicación (npm run build).");
      });
    }
  }

  // ─── Web actual, sin cambios (solo en modo integrado) ─────────────────────
  if (!STANDALONE) {
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
  }

  return app;
}

export { ensureAdmins };

// Pantalla de clave para la vista previa privada.
function previewGate(code) {
  const expected = crypto.createHash("sha256").update(`pg-preview:${code}`).digest("hex").slice(0, 40);
  const COOKIE = "pg_preview";

  return (req, res, next) => {
    const cookies = req.headers.cookie || "";
    if (cookies.split(";").some((c) => c.trim() === `${COOKIE}=${expected}`)) {
      return next();
    }
    if (req.method === "POST" && typeof req.body?.previewCode === "string") {
      if (req.body.previewCode.trim() === code) {
        const secure =
          process.env.NODE_ENV === "production" || process.env.PG_SECURE_COOKIES === "1";
        res.setHeader(
          "Set-Cookie",
          `${COOKIE}=${expected}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${45 * 86400}${secure ? "; Secure" : ""}`,
        );
        return res.redirect(303, req.originalUrl || "/");
      }
      return res.status(401).send(previewPage(true));
    }
    res.status(401).send(previewPage(false));
  };
}

function previewPage(wrongCode) {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Vista previa privada</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#071b33;color:#f3eadb;font-family:Arial,sans-serif}
  form{max-width:340px;padding:40px 30px;text-align:center}
  .mark{width:74px;height:74px;margin:0 auto 18px;border:3px solid #f3eadb;border-radius:50%;display:grid;place-items:center;font-size:30px;font-weight:900;position:relative}
  .mark i{position:absolute;right:-2px;top:4px;width:14px;height:14px;border-radius:50%;background:#e84b3c}
  h1{margin:0 0 6px;font-size:24px;letter-spacing:.02em}
  p{margin:0 0 22px;color:rgba(255,255,255,.65);font-size:13px;line-height:1.5}
  input{width:100%;box-sizing:border-box;padding:13px;border:1px solid rgba(255,255,255,.35);border-radius:8px;background:rgba(255,255,255,.08);color:#fff;font-size:16px;text-align:center;letter-spacing:.15em}
  button{width:100%;margin-top:12px;padding:13px;border:0;border-radius:8px;background:#19baf3;color:#071b33;font-weight:800;font-size:14px;letter-spacing:.06em;cursor:pointer}
  .err{color:#ff8d80;font-size:12px;margin-top:10px}
</style></head>
<body><form method="POST">
  <div class="mark">PG<i></i></div>
  <h1>PERONISMO GESELINO</h1>
  <p>Vista previa privada. Ingresá la clave que te compartieron.</p>
  <input type="password" name="previewCode" placeholder="Clave" autofocus autocomplete="off">
  <button type="submit">ENTRAR</button>
  ${wrongCode ? '<div class="err">La clave no es correcta.</div>' : ""}
</form></body></html>`;
}

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
