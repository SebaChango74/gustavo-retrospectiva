import crypto from "node:crypto";
import { normalizarWhatsapp } from "./whatsapp.js";

const SESSION_COOKIE = "pg_session";
const SESSION_DAYS = 30;

// Módulos de contenido que puede cargar un editor (queda pendiente de
// aprobación) o gestionar un admin.
const CONTENT_GRANTS = [
  "news",
  "causes",
  "events",
  "questions",
  "announcements",
  "materials",
  "peron365",
];

// El admin manager: aprueba y controla editores; NO toca ajustes (diseño,
// estructura, concepto). El admin builder puede todo ("*").
const MANAGER_GRANTS = [...CONTENT_GRANTS, "approve", "moderation", "members", "territorio"];

// Qué módulos del panel puede tocar cada rol.
const ROLE_GRANTS = {
  admin: ["*"], // admin builder (tier por defecto)
  editor: [...CONTENT_GRANTS],
  moderator: ["moderation", "announcements"],
  referente: ["territorio"],
  member: [],
};

function grantsFor(member) {
  if (member.role === "admin") {
    return member.adminTier === "manager" ? MANAGER_GRANTS : ["*"];
  }
  return ROLE_GRANTS[member.role] ?? [];
}

export function can(member, grant) {
  if (!member) return false;
  const grants = grantsFor(member);
  return grants.includes("*") || grants.includes(grant);
}

/** Un builder tiene control total; un manager no decide diseño/estructura. */
export function isBuilder(member) {
  return Boolean(member) && member.role === "admin" && member.adminTier !== "manager";
}

/** Puede aprobar contenido pendiente (builder o manager). */
export function canApprove(member) {
  return can(member, "approve") || isBuilder(member);
}

/** El contenido de un editor entra pendiente de aprobación. */
export function needsApproval(member) {
  return Boolean(member) && member.role === "editor";
}

export function hasPanelAccess(member) {
  return Boolean(member) && member.role !== "member";
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createSession(db, memberId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
  db.prepare(
    "INSERT INTO sessions (token_hash, member_id, expires_at) VALUES (?, ?, ?)",
  ).run(hashToken(token), memberId, expires);
  return { token, expires };
}

export function destroySession(db, token) {
  if (!token) return;
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}

function cookiePath() {
  return process.env.PG_STANDALONE === "1" ? "/" : "/peronismogeselino";
}

export function sessionCookie(token, expires) {
  const secure = process.env.NODE_ENV === "production" || process.env.PG_SECURE_COOKIES === "1";
  return [
    `${SESSION_COOKIE}=${token}`,
    "HttpOnly",
    "SameSite=Lax",
    `Path=${cookiePath()}`,
    `Expires=${new Date(expires).toUTCString()}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=${cookiePath()}; Max-Age=0`;
}

export function readSessionToken(req) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return rest.join("=");
  }
  return null;
}

/** Middleware: carga req.member si hay una sesión válida. */
export function attachMember(db) {
  return (req, _res, next) => {
    req.member = null;
    const token = readSessionToken(req);
    if (token) {
      const row = db
        .prepare(`
          SELECT m.*, s.token_hash, t.name AS territory_name
          FROM sessions s
          JOIN members m ON m.id = s.member_id
          LEFT JOIN territories t ON t.id = m.territory_id
          WHERE s.token_hash = ? AND s.expires_at > datetime('now')
            AND m.status = 'active'
        `)
        .get(hashToken(token));
      if (row) {
        req.member = {
          id: row.id,
          phone: row.phone,
          email: row.email,
          affiliateNumber: row.affiliate_number ?? "",
          name: row.name,
          picture: row.picture,
          role: row.role,
          adminTier: row.admin_tier ?? "builder",
          territoryId: row.territory_id,
          territoryName: row.territory_name ?? "",
        };
      }
    }
    next();
  };
}

export function requireMember(req, res, next) {
  if (!req.member) {
    return res.status(401).json({ error: "Necesitás iniciar sesión." });
  }
  next();
}

export function requireGrant(grant) {
  return (req, res, next) => {
    if (!req.member) {
      return res.status(401).json({ error: "Necesitás iniciar sesión." });
    }
    if (!can(req.member, grant)) {
      return res.status(403).json({ error: "No tenés permisos para esta acción." });
    }
    next();
  };
}

/** Solo los admins usan clave: son los únicos que aprueban y publican. */
export function requiereClave(member) {
  return Boolean(member) && member.role === "admin";
}

/** Guarda la clave derivada con scrypt y sal propia; nunca en texto plano. */
export function hashClave(clave, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(clave), salt, 64).toString("hex");
  return { hash, salt };
}

/** Comparación en tiempo constante contra la clave guardada. */
export function verificarClave(clave, hashGuardado, salt) {
  if (!hashGuardado || !salt) return false;
  const { hash } = hashClave(clave, salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(hashGuardado, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Da de alta al administrador fundador definido por entorno.
 * PG_ADMIN_PHONES: uno o más WhatsApp separados por coma.
 * PG_ADMIN_KEY: clave inicial, solo se aplica si todavía no tienen una.
 */
export function ensureAdmins(db) {
  const telefonos = (process.env.PG_ADMIN_PHONES || "")
    .split(",")
    .map((t) => normalizarWhatsapp(t))
    .filter(Boolean);
  const claveInicial = process.env.PG_ADMIN_KEY || "";

  for (const phone of telefonos) {
    const existente = db.prepare("SELECT id, key_hash FROM members WHERE phone = ?").get(phone);
    const id = existente
      ? (db
          .prepare("UPDATE members SET role = 'admin', status = 'active' WHERE id = ?")
          .run(existente.id),
        existente.id)
      : Number(
          db
            .prepare(
              "INSERT INTO members (phone, name, role, status) VALUES (?, 'Administración', 'admin', 'active')",
            )
            .run(phone).lastInsertRowid,
        );

    const sinClave = !existente || !existente.key_hash;
    if (claveInicial && sinClave) {
      const { hash, salt } = hashClave(claveInicial);
      db.prepare("UPDATE members SET key_hash = ?, key_salt = ? WHERE id = ?").run(hash, salt, id);
    }
  }
}
