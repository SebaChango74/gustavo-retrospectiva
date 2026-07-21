import crypto from "node:crypto";

const SESSION_COOKIE = "pg_session";
const SESSION_DAYS = 30;

// Qué módulos del panel puede tocar cada rol. El administrador puede todo.
const ROLE_GRANTS = {
  admin: ["*"],
  editor: ["news", "causes", "events", "questions", "announcements", "materials"],
  moderator: ["moderation", "announcements"],
  referente: ["territorio"],
  member: [],
};

export function can(member, grant) {
  if (!member) return false;
  const grants = ROLE_GRANTS[member.role] ?? [];
  return grants.includes("*") || grants.includes(grant);
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
          email: row.email,
          name: row.name,
          picture: row.picture,
          role: row.role,
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

/** Da de alta (o asciende) a los administradores definidos por entorno. */
export function ensureAdmins(db) {
  const emails = (process.env.PG_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  for (const email of emails) {
    const existing = db.prepare("SELECT id FROM members WHERE email = ?").get(email);
    if (existing) {
      db.prepare("UPDATE members SET role = 'admin', status = 'active' WHERE id = ?").run(
        existing.id,
      );
    } else {
      db.prepare(
        "INSERT INTO members (email, role, status) VALUES (?, 'admin', 'active')",
      ).run(email);
    }
  }
}

/** Verifica un ID token de Google Sign-In contra el endpoint oficial de
 *  tokeninfo. Sin dependencias y sin costo; apto para el volumen del portal. */
export async function verifyGoogleIdToken(credential, clientId) {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
  );
  if (!response.ok) return null;
  const payload = await response.json();
  if (payload.aud !== clientId) return null;
  if (payload.email_verified !== "true" && payload.email_verified !== true) return null;
  if (!payload.email) return null;
  return {
    email: String(payload.email).toLowerCase(),
    name: payload.name || "",
    picture: payload.picture || "",
  };
}
