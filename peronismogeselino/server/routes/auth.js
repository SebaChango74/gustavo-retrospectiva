import { Router } from "express";
import {
  createSession,
  destroySession,
  sessionCookie,
  clearSessionCookie,
  readSessionToken,
  verifyGoogleIdToken,
  hasPanelAccess,
} from "../auth.js";
import { audit, str } from "../util.js";
import { devLoginEnabled } from "../dev-login.js";

export function authRoutes(db) {
  const router = Router();

  // Ingreso real con Google. El cliente envía el ID token (credential) que
  // entrega Google Identity Services; el servidor lo verifica y comprueba que
  // el correo esté invitado.
  router.post("/google", async (req, res) => {
    const clientId = process.env.PG_GOOGLE_CLIENT_ID || "";
    if (!clientId) {
      return res.status(503).json({
        error: "El ingreso con Google todavía no está configurado (PG_GOOGLE_CLIENT_ID).",
      });
    }
    const credential = str(req.body?.credential, 4096);
    if (!credential) return res.status(400).json({ error: "Falta la credencial de Google." });

    let profile;
    try {
      profile = await verifyGoogleIdToken(credential, clientId);
    } catch {
      profile = null;
    }
    if (!profile) {
      return res.status(401).json({ error: "No pudimos verificar tu cuenta de Google." });
    }
    return finishLogin(db, res, profile);
  });

  // Ingreso de desarrollo: ver server/dev-login.js. Se apaga solo al publicar.
  if (devLoginEnabled()) {
    router.post("/dev", (req, res) => {
      const email = str(req.body?.email, 254).toLowerCase();
      if (!email) return res.status(400).json({ error: "Falta el correo." });
      return finishLogin(db, res, { email, name: req.body?.name || email.split("@")[0], picture: "" });
    });
  }

  router.post("/logout", (req, res) => {
    destroySession(db, readSessionToken(req));
    res.setHeader("Set-Cookie", clearSessionCookie());
    res.json({ ok: true });
  });

  router.get("/me", (req, res) => {
    if (!req.member) return res.json({ member: null });
    res.json({ member: { ...req.member, panelAccess: hasPanelAccess(req.member) } });
  });

  return router;
}

function finishLogin(db, res, profile) {
  const member = db
    .prepare("SELECT * FROM members WHERE email = ?")
    .get(profile.email);

  if (!member) {
    return res.status(403).json({
      error:
        "Tu correo no figura entre las invitaciones. Escribile a quien te invitó para que te sume.",
    });
  }
  if (member.status === "suspended") {
    return res.status(403).json({ error: "Tu acceso está suspendido. Hablá con la moderación." });
  }

  db.prepare(`
    UPDATE members SET
      name = CASE WHEN ? != '' THEN ? ELSE name END,
      picture = ?,
      status = 'active',
      last_login_at = datetime('now')
    WHERE id = ?
  `).run(profile.name, profile.name, profile.picture, member.id);

  const { token, expires } = createSession(db, member.id);
  res.setHeader("Set-Cookie", sessionCookie(token, expires));
  audit(db, member.id, "login", "member", member.id, profile.email);

  const fresh = db
    .prepare(`
      SELECT m.*, t.name AS territory_name FROM members m
      LEFT JOIN territories t ON t.id = m.territory_id WHERE m.id = ?
    `)
    .get(member.id);
  const payload = {
    id: fresh.id,
    email: fresh.email,
    name: fresh.name,
    picture: fresh.picture,
    role: fresh.role,
    territoryId: fresh.territory_id,
    territoryName: fresh.territory_name ?? "",
  };
  res.json({ member: { ...payload, panelAccess: hasPanelAccess(payload) } });
}
