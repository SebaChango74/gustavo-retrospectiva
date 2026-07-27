import { Router } from "express";
import {
  createSession,
  destroySession,
  sessionCookie,
  clearSessionCookie,
  readSessionToken,
  hasPanelAccess,
  requiereClave,
  verificarClave,
} from "../auth.js";
import { audit, str } from "../util.js";
import { normalizarWhatsapp, mostrarWhatsapp } from "../whatsapp.js";

export function authRoutes(db) {
  const router = Router();

  /**
   * Ingreso: nombre + WhatsApp. Sin costo, sin verificación externa.
   *
   * - Si el número ya es miembro activo, entra.
   * - Si es admin, además le pedimos su clave: son los únicos que publican
   *   y borran, y con solo el número cualquiera tomaría el control.
   * - Si el número no está, queda como solicitud a la espera de aprobación.
   */
  router.post("/ingresar", (req, res) => {
    const nombre = str(req.body?.nombre, 80);
    const whatsapp = normalizarWhatsapp(req.body?.whatsapp);
    const afiliado = str(req.body?.afiliado, 30);
    const clave = str(req.body?.clave, 200);

    if (!whatsapp) {
      return res.status(400).json({
        error: "Revisá el WhatsApp: poné código de área y número, sin el 0 ni el 15.",
      });
    }
    if (nombre.length < 3) {
      return res.status(400).json({ error: "Escribí tu nombre y apellido." });
    }

    const member = db.prepare("SELECT * FROM members WHERE phone = ?").get(whatsapp);

    if (!member) return registrarSolicitud(db, res, { whatsapp, nombre, afiliado });

    if (member.status === "suspended") {
      return res.status(403).json({ error: "Tu acceso está suspendido. Hablá con la moderación." });
    }

    if (requiereClave(member)) {
      if (!member.key_hash) {
        return res.status(403).json({
          error: "Tu cuenta de administración todavía no tiene clave. Pedila a quien te sumó.",
        });
      }
      if (!clave) {
        return res.status(401).json({ error: "Falta tu clave.", claveRequerida: true });
      }
      if (!verificarClave(clave, member.key_hash, member.key_salt)) {
        audit(db, member.id, "login_fallido", "member", member.id, whatsapp);
        return res.status(401).json({ error: "Clave incorrecta.", claveRequerida: true });
      }
    }

    db.prepare(`
      UPDATE members SET
        name = CASE WHEN ? != '' THEN ? ELSE name END,
        affiliate_number = CASE WHEN ? != '' THEN ? ELSE affiliate_number END,
        status = 'active',
        last_login_at = datetime('now')
      WHERE id = ?
    `).run(nombre, nombre, afiliado, afiliado, member.id);

    const { token, expires } = createSession(db, member.id);
    res.setHeader("Set-Cookie", sessionCookie(token, expires));
    audit(db, member.id, "login", "member", member.id, whatsapp);

    return res.json({ member: perfil(db, member.id) });
  });

  /** Si el WhatsApp ya es admin, el formulario pide la clave desde el vamos. */
  router.post("/consultar", (req, res) => {
    const whatsapp = normalizarWhatsapp(req.body?.whatsapp);
    if (!whatsapp) return res.json({ claveRequerida: false });
    const member = db.prepare("SELECT role, status FROM members WHERE phone = ?").get(whatsapp);
    res.json({ claveRequerida: Boolean(member) && member.role === "admin" });
  });

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

/** Deja el pedido de ingreso a la vista de los admins, sin dar acceso. */
function registrarSolicitud(db, res, { whatsapp, nombre, afiliado }) {
  const previa = db.prepare("SELECT * FROM access_requests WHERE phone = ?").get(whatsapp);

  if (previa?.status === "rejected") {
    return res.status(403).json({
      error: "Tu pedido de ingreso fue rechazado. Si creés que es un error, hablá con la mesa.",
    });
  }
  if (previa) {
    // Actualizamos los datos por si los corrigió, pero no reabrimos nada.
    db.prepare(
      "UPDATE access_requests SET name = ?, affiliate_number = ? WHERE id = ?",
    ).run(nombre, afiliado, previa.id);
  } else {
    db.prepare(
      "INSERT INTO access_requests (phone, name, affiliate_number) VALUES (?, ?, ?)",
    ).run(whatsapp, nombre, afiliado);
  }

  return res.status(202).json({
    pendiente: true,
    whatsapp: mostrarWhatsapp(whatsapp),
    mensaje:
      "Recibimos tu pedido. Cuando la mesa lo apruebe vas a poder entrar con este mismo WhatsApp.",
  });
}

function perfil(db, id) {
  const fila = db
    .prepare(`
      SELECT m.*, t.name AS territory_name FROM members m
      LEFT JOIN territories t ON t.id = m.territory_id WHERE m.id = ?
    `)
    .get(id);
  const datos = {
    id: fila.id,
    phone: fila.phone,
    email: fila.email,
    affiliateNumber: fila.affiliate_number ?? "",
    name: fila.name,
    picture: fila.picture,
    role: fila.role,
    adminTier: fila.admin_tier ?? "builder",
    territoryId: fila.territory_id,
    territoryName: fila.territory_name ?? "",
  };
  return { ...datos, panelAccess: hasPanelAccess(datos) };
}
