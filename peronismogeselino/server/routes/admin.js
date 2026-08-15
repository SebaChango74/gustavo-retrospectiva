import express, { Router } from "express";
import { requireGrant, requireMember, can, canApprove, hashClave, verificarClave } from "../auth.js";
import { audit, intIn, normalizarVideo, parseJson, slugify, str } from "../util.js";
import { APPROVABLE, approveItem, markPending, pendingItems, rejectItem } from "../approval.js";
import { normalizarWhatsapp, mostrarWhatsapp, enlaceWhatsapp } from "../whatsapp.js";
import {
  LIMITE_BYTES,
  LIMITE_PDF,
  SUBIDAS_URL,
  borrarImagen,
  dondeSeUsa,
  esPdf,
  guardarImagen,
  listarImagenes,
  reconocerImagen,
} from "../media.js";
import {
  codigoValido,
  direccionOtpauth,
  generarCodigosRespaldo,
  generarSecreto,
  huellaRespaldo,
  secretoLegible,
} from "../totp.js";

/** Solo se acepta como adjunto un PDF ya subido a la propia carpeta. */
function adjuntoUrl(valor) {
  const texto = str(valor, 500);
  return /^\/peronismogeselino\/subidas\/[a-f0-9]{16}\.pdf$/.test(texto) ? texto : "";
}

/** Galería: lista de direcciones de imágenes, saneadas y con tope de cantidad. */
function galeriaJson(valor) {
  const lista = Array.isArray(valor) ? valor : [];
  const limpias = lista
    .map((x) => str(x, 500))
    .filter(Boolean)
    .slice(0, 40);
  return JSON.stringify(limpias);
}

/** Guarda la clave de un administrador. Sin clave, no la toca. */
function aplicarClave(db, memberId, clave) {
  const texto = str(clave, 200);
  if (texto.length < 8) return false;
  const { hash, salt } = hashClave(texto);
  db.prepare("UPDATE members SET key_hash = ?, key_salt = ? WHERE id = ?").run(hash, salt, memberId);
  return true;
}

export function adminRoutes(db) {
  const router = Router();

  // Nada del panel sin sesión. Cada ruta además exige su permiso.
  router.use(requireMember);

  // ─── Aprobaciones (lo que enviaron los editores) ──────────────────────────
  router.get("/pending", (req, res) => {
    if (!canApprove(req.member)) {
      return res.status(403).json({ error: "No tenés permisos para aprobar." });
    }
    res.json({ items: pendingItems(db) });
  });

  router.post("/pending/:table/:id/approve", (req, res) => {
    if (!canApprove(req.member)) {
      return res.status(403).json({ error: "No tenés permisos para aprobar." });
    }
    const { table, id } = req.params;
    if (!APPROVABLE[table]) return res.status(400).json({ error: "Sección inválida." });
    if (!approveItem(db, table, id)) {
      return res.status(404).json({ error: "No hay nada pendiente con ese identificador." });
    }
    audit(db, req.member.id, "approve", table, id);
    res.json({ ok: true });
  });

  router.post("/pending/:table/:id/reject", (req, res) => {
    if (!canApprove(req.member)) {
      return res.status(403).json({ error: "No tenés permisos para aprobar." });
    }
    const { table, id } = req.params;
    if (!APPROVABLE[table]) return res.status(400).json({ error: "Sección inválida." });
    if (!rejectItem(db, table, id)) {
      return res.status(404).json({ error: "No hay nada pendiente con ese identificador." });
    }
    audit(db, req.member.id, "reject", table, id, str(req.body?.reason, 300));
    res.json({ ok: true });
  });

  // ─── Noticias ──────────────────────────────────────────────────────────────
  router.get("/news", requireGrant("news"), (_req, res) => {
    res.json({ items: db.prepare("SELECT * FROM news ORDER BY published_at DESC, id DESC").all() });
  });

  router.post("/news", requireGrant("news"), (req, res) => {
    const b = req.body ?? {};
    const title = str(b.title, 200);
    if (!title) return res.status(400).json({ error: "El título es obligatorio." });
    const video = normalizarVideo(b.video);
    if (video.error) return res.status(400).json({ error: video.error });
    const slug = str(b.slug, 80) || uniqueSlug(db, "news", slugify(title));
    const info = db
      .prepare(`
        INSERT INTO news (slug, tag, title, summary, body, image, video, embed, gallery,
          attachment, attachment_name, featured, status, published_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        slug,
        str(b.tag, 60) || "Villa Gesell",
        title,
        str(b.summary, 500),
        str(b.body, 20000),
        str(b.image, 500),
        video.valor,
        str(b.embed, 500),
        galeriaJson(b.gallery),
        adjuntoUrl(b.attachment),
        str(b.attachmentName, 200),
        b.featured ? 1 : 0,
        oneOf(b.status, ["draft", "published", "archived"], "draft"),
        str(b.publishedAt, 40) || new Date().toISOString(),
      );
    markPending(db, "news", info.lastInsertRowid, req.member);
    audit(db, req.member.id, "create", "news", info.lastInsertRowid, title);
    res.json({ id: info.lastInsertRowid });
  });

  router.put("/news/:id", requireGrant("news"), (req, res) => {
    const row = db.prepare("SELECT id FROM news WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Noticia no encontrada." });
    const b = req.body ?? {};
    const video = normalizarVideo(b.video);
    if (video.error) return res.status(400).json({ error: video.error });
    db.prepare(`
      UPDATE news SET tag = ?, title = ?, summary = ?, body = ?, image = ?, video = ?,
        embed = ?, gallery = ?, attachment = ?, attachment_name = ?, featured = ?, status = ?,
        published_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      str(b.tag, 60) || "Villa Gesell",
      str(b.title, 200),
      str(b.summary, 500),
      str(b.body, 20000),
      str(b.image, 500),
      video.valor,
      str(b.embed, 500),
      galeriaJson(b.gallery),
      adjuntoUrl(b.attachment),
      str(b.attachmentName, 200),
      b.featured ? 1 : 0,
      oneOf(b.status, ["draft", "published", "archived"], "draft"),
      str(b.publishedAt, 40) || new Date().toISOString(),
      row.id,
    );
    markPending(db, "news", row.id, req.member);
    audit(db, req.member.id, "update", "news", row.id);
    res.json({ ok: true });
  });

  router.delete("/news/:id", requireGrant("news"), (req, res) => {
    db.prepare("DELETE FROM news WHERE id = ?").run(req.params.id);
    audit(db, req.member.id, "delete", "news", req.params.id);
    res.json({ ok: true });
  });

  // ─── Causas ────────────────────────────────────────────────────────────────
  router.get("/causes", requireGrant("causes"), (_req, res) => {
    const causes = db.prepare("SELECT * FROM causes ORDER BY updated_at DESC").all();
    const timeline = db.prepare("SELECT * FROM cause_timeline ORDER BY cause_id, position").all();
    res.json({ items: causes, timeline });
  });

  router.post("/causes", requireGrant("causes"), (req, res) => {
    const b = req.body ?? {};
    const title = str(b.title, 300);
    if (!title) return res.status(400).json({ error: "El título es obligatorio." });
    if (normalizarVideo(b.video).error) {
      return res.status(400).json({ error: normalizarVideo(b.video).error });
    }
    const slug = str(b.slug, 80) || uniqueSlug(db, "causes", slugify(title));
    const info = db
      .prepare(`
        INSERT INTO causes (slug, title, summary, status_label, progress, progress_from,
          progress_next, lead_image, video, attachment, attachment_name, brief_title, brief_body,
          bullets, key_fact_value, key_fact_label, next_steps, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(...causeParams(b, title, slug));
    markPending(db, "causes", info.lastInsertRowid, req.member);
    audit(db, req.member.id, "create", "causes", info.lastInsertRowid, title);
    res.json({ id: info.lastInsertRowid });
  });

  router.put("/causes/:id", requireGrant("causes"), (req, res) => {
    const row = db.prepare("SELECT id, slug FROM causes WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Causa no encontrada." });
    const b = req.body ?? {};
    const title = str(b.title, 300);
    if (normalizarVideo(b.video).error) {
      return res.status(400).json({ error: normalizarVideo(b.video).error });
    }
    const params = causeParams(b, title, row.slug);
    db.prepare(`
      UPDATE causes SET slug = ?, title = ?, summary = ?, status_label = ?, progress = ?,
        progress_from = ?, progress_next = ?, lead_image = ?, video = ?, attachment = ?,
        attachment_name = ?, brief_title = ?, brief_body = ?, bullets = ?, key_fact_value = ?,
        key_fact_label = ?, next_steps = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(...params, row.id);
    if (Array.isArray(b.timeline)) {
      db.prepare("DELETE FROM cause_timeline WHERE cause_id = ?").run(row.id);
      const insert = db.prepare(`
        INSERT INTO cause_timeline (cause_id, date_label, title, body, state, position)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      b.timeline.forEach((item, index) => {
        insert.run(
          row.id,
          str(item.dateLabel, 30),
          str(item.title, 200),
          str(item.body, 1000),
          oneOf(item.state, ["done", "current", "pending"], "pending"),
          index + 1,
        );
      });
    }
    markPending(db, "causes", row.id, req.member);
    audit(db, req.member.id, "update", "causes", row.id);
    res.json({ ok: true });
  });

  router.delete("/causes/:id", requireGrant("causes"), (req, res) => {
    db.prepare("DELETE FROM causes WHERE id = ?").run(req.params.id);
    audit(db, req.member.id, "delete", "causes", req.params.id);
    res.json({ ok: true });
  });

  // ─── Agenda ────────────────────────────────────────────────────────────────
  router.get("/events", requireGrant("events"), (_req, res) => {
    const items = db.prepare("SELECT * FROM events ORDER BY starts_at DESC").all();
    const rsvps = db
      .prepare(`
        SELECT e.event_id, COUNT(*) AS yes FROM event_rsvps e
        WHERE e.response = 'yes' GROUP BY e.event_id
      `)
      .all();
    res.json({ items, rsvps });
  });

  router.post("/events", requireGrant("events"), (req, res) => {
    const b = req.body ?? {};
    const title = str(b.title, 200);
    const startsAt = str(b.startsAt, 40);
    if (!title || !startsAt) {
      return res.status(400).json({ error: "Título y fecha de inicio son obligatorios." });
    }
    const info = db
      .prepare(`
        INSERT INTO events (title, summary, event_type, starts_at, ends_at, place_name,
          address, latitude, longitude, google_maps_url, visibility, status, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(...eventParams(b, title, startsAt));
    markPending(db, "events", info.lastInsertRowid, req.member);
    audit(db, req.member.id, "create", "events", info.lastInsertRowid, title);
    res.json({ id: info.lastInsertRowid });
  });

  router.put("/events/:id", requireGrant("events"), (req, res) => {
    const row = db.prepare("SELECT id FROM events WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Actividad no encontrada." });
    const b = req.body ?? {};
    db.prepare(`
      UPDATE events SET title = ?, summary = ?, event_type = ?, starts_at = ?, ends_at = ?,
        place_name = ?, address = ?, latitude = ?, longitude = ?, google_maps_url = ?,
        visibility = ?, status = ?, image = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(...eventParams(b, str(b.title, 200), str(b.startsAt, 40)), row.id);
    markPending(db, "events", row.id, req.member);
    audit(db, req.member.id, "update", "events", row.id);
    res.json({ ok: true });
  });

  router.delete("/events/:id", requireGrant("events"), (req, res) => {
    db.prepare("DELETE FROM events WHERE id = ?").run(req.params.id);
    audit(db, req.member.id, "delete", "events", req.params.id);
    res.json({ ok: true });
  });

  // ─── Preguntas del Peronómetro ─────────────────────────────────────────────
  router.get("/questions", requireGrant("questions"), (_req, res) => {
    const items = db.prepare("SELECT * FROM questions ORDER BY category, id").all();
    res.json({
      items: items.map((q) => ({ ...q, options: parseJson(q.options, []) })),
    });
  });

  router.post("/questions", requireGrant("questions"), (req, res) => {
    const q = questionParams(req.body ?? {});
    if (q.error) return res.status(400).json({ error: q.error });
    const info = db
      .prepare(`
        INSERT INTO questions (category, prompt, options, correct_option, explanation,
          source_title, source_url, difficulty, enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(...q.params);
    audit(db, req.member.id, "create", "questions", info.lastInsertRowid);
    res.json({ id: info.lastInsertRowid });
  });

  router.put("/questions/:id", requireGrant("questions"), (req, res) => {
    const row = db.prepare("SELECT id FROM questions WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Pregunta no encontrada." });
    const q = questionParams(req.body ?? {});
    if (q.error) return res.status(400).json({ error: q.error });
    db.prepare(`
      UPDATE questions SET category = ?, prompt = ?, options = ?, correct_option = ?,
        explanation = ?, source_title = ?, source_url = ?, difficulty = ?, enabled = ?
      WHERE id = ?
    `).run(...q.params, row.id);
    audit(db, req.member.id, "update", "questions", row.id);
    res.json({ ok: true });
  });

  router.delete("/questions/:id", requireGrant("questions"), (req, res) => {
    db.prepare("DELETE FROM questions WHERE id = ?").run(req.params.id);
    audit(db, req.member.id, "delete", "questions", req.params.id);
    res.json({ ok: true });
  });

  // ─── Resultados agregados del Peronómetro ─────────────────────────────────
  router.get("/results", requireGrant("questions"), (_req, res) => {
    const total = db.prepare("SELECT COUNT(*) AS n FROM quiz_results").get().n;
    const avg = db.prepare("SELECT AVG(score) AS avg FROM quiz_results").get().avg;
    const byDay = db
      .prepare(`
        SELECT date(created_at) AS day, COUNT(*) AS games, ROUND(AVG(score)) AS avgScore
        FROM quiz_results GROUP BY date(created_at) ORDER BY day DESC LIMIT 30
      `)
      .all();
    const distribution = db
      .prepare(`
        SELECT CASE
          WHEN score <= 20 THEN '0-20'
          WHEN score <= 40 THEN '21-40'
          WHEN score <= 60 THEN '41-60'
          WHEN score <= 80 THEN '61-80'
          ELSE '81-100' END AS range,
          COUNT(*) AS n
        FROM quiz_results GROUP BY range
      `)
      .all();
    res.json({ total, average: avg == null ? null : Math.round(avg), byDay, distribution });
  });

  // ─── Miembros e invitaciones (solo administración) ────────────────────────
  router.get("/members", requireGrant("members"), (_req, res) => {
    const items = db
      .prepare(`
        SELECT m.id, m.phone, m.email, m.affiliate_number, m.name, m.role, m.admin_tier, m.status,
          m.oculto, m.territory_id, m.last_login_at, m.created_at,
          CASE WHEN m.key_hash != '' THEN 1 ELSE 0 END AS tiene_clave,
          t.name AS territory_name
        FROM members m LEFT JOIN territories t ON t.id = m.territory_id
        ORDER BY m.created_at DESC
      `)
      .all()
      .map((m) => ({
        ...m,
        phone_display: mostrarWhatsapp(m.phone),
        phone_link: enlaceWhatsapp(m.phone),
      }));
    res.json({ items });
  });

  router.post("/members", requireGrant("members"), (req, res) => {
    const phone = normalizarWhatsapp(req.body?.phone);
    if (!phone) {
      return res.status(400).json({
        error: "WhatsApp inválido: código de área y número, sin el 0 ni el 15.",
      });
    }
    const cap = Number(
      db.prepare("SELECT value FROM settings WHERE key = 'community_cap'").get()?.value || 500,
    );
    const count = db.prepare("SELECT COUNT(*) AS n FROM members").get().n;
    if (count >= cap) {
      return res.status(400).json({ error: `La comunidad alcanzó el máximo de ${cap} miembros.` });
    }
    if (db.prepare("SELECT id FROM members WHERE phone = ?").get(phone)) {
      return res.status(400).json({ error: "Ese WhatsApp ya está en la comunidad." });
    }
    const email = str(req.body?.email, 254).toLowerCase() || null;
    if (email && db.prepare("SELECT id FROM members WHERE email = ?").get(email)) {
      return res.status(400).json({ error: "Ese correo ya figura en otro miembro." });
    }
    const info = db
      .prepare(`
        INSERT INTO members
          (phone, email, name, affiliate_number, role, admin_tier, status, territory_id, invited_by)
        VALUES (?, ?, ?, ?, ?, ?, 'invited', ?, ?)
      `)
      .run(
        phone,
        email,
        str(req.body?.name, 120),
        str(req.body?.affiliateNumber, 30),
        oneOf(req.body?.role, ["admin", "editor", "moderator", "referente", "member"], "member"),
        req.body?.adminTier === "manager" ? "manager" : "builder",
        req.body?.territoryId ? Number(req.body.territoryId) : null,
        req.member.id,
      );
    // Si lo suman como administración, la clave viaja en el mismo alta.
    aplicarClave(db, Number(info.lastInsertRowid), req.body?.clave);
    audit(db, req.member.id, "invite", "member", info.lastInsertRowid, phone);
    res.json({ id: info.lastInsertRowid });
  });

  /** Cambiar o poner la clave de un administrador. */
  router.put("/members/:id/clave", requireGrant("members"), (req, res) => {
    const row = db.prepare("SELECT id, role FROM members WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Miembro no encontrado." });
    if (row.role !== "admin") {
      return res.status(400).json({ error: "Solo la administración usa clave." });
    }
    const clave = str(req.body?.clave, 200);
    if (clave.length < 8) {
      return res.status(400).json({ error: "La clave tiene que tener al menos 8 caracteres." });
    }
    aplicarClave(db, row.id, clave);
    // Cambiar la clave cierra las sesiones abiertas de esa cuenta.
    db.prepare("DELETE FROM sessions WHERE member_id = ?").run(row.id);
    audit(db, req.member.id, "clave", "member", row.id);
    res.json({ ok: true });
  });

  // ─── Fotos ────────────────────────────────────────────────────────────────
  // Cualquiera que cargue contenido puede subir fotos: sin esto un editor
  // escribe la nota pero no puede ilustrarla.
  const puedeSubir = (req, res, next) =>
    can(req.member, "news") || can(req.member, "causes")
      ? next()
      : res.status(403).json({ error: "No tenés permisos para subir fotos." });

  router.get("/media", puedeSubir, (_req, res) => {
    res.json({ items: listarImagenes() });
  });

  /**
   * La foto llega como cuerpo crudo, sin formulario de varias partes: así no
   * hace falta ninguna dependencia. El navegador ya la redujo antes de
   * mandarla, así que lo que llega acá pesa poco.
   */
  router.post("/media", puedeSubir, express.raw({ type: "image/*", limit: LIMITE_BYTES }), (req, res) => {
    const buffer = req.body;
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      return res.status(400).json({ error: "No llegó ninguna imagen." });
    }
    const reconocida = reconocerImagen(buffer);
    if (!reconocida) {
      return res.status(400).json({
        error: "El archivo no es una imagen válida. Sirven JPG, PNG y WebP.",
      });
    }
    const { nombre, url } = guardarImagen(buffer, reconocida.ext);
    audit(db, req.member.id, "subir_foto", "media", null, nombre);
    res.json({ nombre, url });
  });

  /** Sube un PDF (una guía, un folleto) para descargar desde una nota. */
  router.post(
    "/media/pdf",
    puedeSubir,
    express.raw({ type: "application/pdf", limit: LIMITE_PDF }),
    (req, res) => {
      const buffer = req.body;
      if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        return res.status(400).json({ error: "No llegó ningún archivo." });
      }
      if (!esPdf(buffer)) {
        return res.status(400).json({ error: "El archivo no es un PDF válido." });
      }
      const { nombre, url } = guardarImagen(buffer, "pdf");
      audit(db, req.member.id, "subir_pdf", "media", null, nombre);
      res.json({ nombre, url });
    },
  );

  router.delete("/media/:nombre", puedeSubir, (req, res) => {
    const url = `${SUBIDAS_URL}/${req.params.nombre}`;
    const usos = dondeSeUsa(db, url);
    if (usos.length && req.query.igual !== "1") {
      return res.status(409).json({
        error: "Esta foto está en uso.",
        usos,
      });
    }
    if (!borrarImagen(req.params.nombre)) {
      return res.status(404).json({ error: "Esa foto no existe." });
    }
    audit(db, req.member.id, "borrar_foto", "media", null, req.params.nombre);
    res.json({ ok: true });
  });

  // ─── Segundo factor (siempre sobre la cuenta propia) ──────────────────────
  // Nadie activa ni desactiva el segundo factor de otro: sería una puerta de
  // atrás para sacárselo a un compañero y entrar con solo su clave.

  router.get("/segundo-factor", (req, res) => {
    const fila = db
      .prepare("SELECT totp_activo FROM members WHERE id = ?")
      .get(req.member.id);
    const respaldos = db
      .prepare("SELECT COUNT(*) AS n FROM recovery_codes WHERE member_id = ? AND used_at IS NULL")
      .get(req.member.id).n;
    res.json({
      activo: Boolean(fila?.totp_activo),
      respaldosSinUsar: respaldos,
      disponible: req.member.role === "admin",
    });
  });

  /** Paso 1: entrega un secreto nuevo para cargar en la app de códigos. */
  router.post("/segundo-factor/preparar", (req, res) => {
    if (req.member.role !== "admin") {
      return res.status(403).json({ error: "El segundo factor es para la administración." });
    }
    const secreto = generarSecreto();
    // Se guarda pero todavía inactivo: recién se exige cuando la persona
    // demuestra, con un código, que la app lo tomó bien. Si no, se quedaría
    // afuera de su propia cuenta.
    db.prepare("UPDATE members SET totp_secret = ?, totp_activo = 0 WHERE id = ?").run(
      secreto,
      req.member.id,
    );
    const quien = req.member.name || mostrarWhatsapp(req.member.phone) || "administración";
    res.json({
      secreto: secretoLegible(secreto),
      direccion: direccionOtpauth(secreto, quien),
    });
  });

  /** Paso 2: confirma con un código y entrega los códigos de recuperación. */
  router.post("/segundo-factor/activar", (req, res) => {
    const fila = db.prepare("SELECT totp_secret FROM members WHERE id = ?").get(req.member.id);
    if (!fila?.totp_secret) {
      return res.status(400).json({ error: "Primero generá el código en «Preparar»." });
    }
    if (!codigoValido(fila.totp_secret, str(req.body?.codigo, 20))) {
      return res.status(400).json({
        error: "Ese código no coincide. Mirá el que figura ahora mismo en tu teléfono.",
      });
    }

    db.prepare("UPDATE members SET totp_activo = 1 WHERE id = ?").run(req.member.id);
    db.prepare("DELETE FROM recovery_codes WHERE member_id = ?").run(req.member.id);
    const codigos = generarCodigosRespaldo();
    const insertar = db.prepare(
      "INSERT INTO recovery_codes (member_id, code_hash) VALUES (?, ?)",
    );
    for (const codigo of codigos) insertar.run(req.member.id, huellaRespaldo(codigo));

    audit(db, req.member.id, "segundo_factor_activado", "member", req.member.id);
    // Es la única vez que se ven: en la base solo queda su huella.
    res.json({ ok: true, codigos });
  });

  /** Desactivar exige la clave: si no, alcanzaría con una sesión robada. */
  router.post("/segundo-factor/desactivar", (req, res) => {
    const fila = db
      .prepare("SELECT key_hash, key_salt FROM members WHERE id = ?")
      .get(req.member.id);
    if (!verificarClave(str(req.body?.clave, 200), fila?.key_hash, fila?.key_salt)) {
      return res.status(401).json({ error: "Clave incorrecta." });
    }
    db.prepare("UPDATE members SET totp_secret = '', totp_activo = 0 WHERE id = ?").run(
      req.member.id,
    );
    db.prepare("DELETE FROM recovery_codes WHERE member_id = ?").run(req.member.id);
    audit(db, req.member.id, "segundo_factor_desactivado", "member", req.member.id);
    res.json({ ok: true });
  });

  // ─── Solicitudes de ingreso ───────────────────────────────────────────────
  router.get("/requests", requireGrant("members"), (_req, res) => {
    const items = db
      .prepare(
        "SELECT * FROM access_requests WHERE status = 'pending' ORDER BY created_at ASC",
      )
      .all()
      .map((r) => ({
        ...r,
        phone_display: mostrarWhatsapp(r.phone),
        phone_link: enlaceWhatsapp(r.phone),
      }));
    res.json({ items });
  });

  router.post("/requests/:id/approve", requireGrant("members"), (req, res) => {
    const row = db
      .prepare("SELECT * FROM access_requests WHERE id = ? AND status = 'pending'")
      .get(req.params.id);
    if (!row) return res.status(404).json({ error: "Solicitud no encontrada." });

    let miembroId = db.prepare("SELECT id FROM members WHERE phone = ?").get(row.phone)?.id;
    if (!miembroId) {
      miembroId = Number(
        db
          .prepare(`
            INSERT INTO members (phone, name, affiliate_number, role, status, territory_id, invited_by)
            VALUES (?, ?, ?, 'member', 'active', ?, ?)
          `)
          .run(
            row.phone,
            row.name,
            row.affiliate_number,
            req.body?.territoryId ? Number(req.body.territoryId) : null,
            req.member.id,
          ).lastInsertRowid,
      );
    }
    db.prepare(
      "UPDATE access_requests SET status = 'approved', decided_by = ?, decided_at = datetime('now') WHERE id = ?",
    ).run(req.member.id, row.id);
    audit(db, req.member.id, "aprobar_ingreso", "member", miembroId, row.phone);
    res.json({ ok: true, memberId: miembroId, whatsapp: enlaceWhatsapp(row.phone) });
  });

  router.post("/requests/:id/reject", requireGrant("members"), (req, res) => {
    const row = db
      .prepare("SELECT * FROM access_requests WHERE id = ? AND status = 'pending'")
      .get(req.params.id);
    if (!row) return res.status(404).json({ error: "Solicitud no encontrada." });
    db.prepare(
      "UPDATE access_requests SET status = 'rejected', decided_by = ?, decided_at = datetime('now') WHERE id = ?",
    ).run(req.member.id, row.id);
    audit(db, req.member.id, "rechazar_ingreso", "access_request", row.id, row.phone);
    res.json({ ok: true });
  });

  router.put("/members/:id", requireGrant("members"), (req, res) => {
    const row = db.prepare("SELECT * FROM members WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Miembro no encontrado." });
    const role = oneOf(
      req.body?.role,
      ["admin", "editor", "moderator", "referente", "member"],
      row.role,
    );
    const status = oneOf(req.body?.status, ["invited", "active", "suspended"], row.status);
    if (row.id === req.member.id && role !== "admin") {
      return res.status(400).json({ error: "No podés quitarte tu propio rol de administración." });
    }
    const tier = req.body?.adminTier === "manager" ? "manager" : "builder";
    const oculto = req.body?.oculto === undefined ? row.oculto : req.body.oculto ? 1 : 0;
    db.prepare(`
      UPDATE members SET name = ?, role = ?, status = ?, territory_id = ?, admin_tier = ?,
        oculto = ?
      WHERE id = ?
    `).run(
      str(req.body?.name ?? row.name, 120),
      role,
      status,
      req.body?.territoryId ? Number(req.body.territoryId) : null,
      tier,
      oculto,
      row.id,
    );
    if (status === "suspended") {
      db.prepare("DELETE FROM sessions WHERE member_id = ?").run(row.id);
    }
    audit(db, req.member.id, "update", "member", row.id, `${role}/${status}`);
    res.json({ ok: true });
  });

  router.delete("/members/:id", requireGrant("members"), (req, res) => {
    const row = db.prepare("SELECT id FROM members WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Miembro no encontrado." });
    if (row.id === req.member.id) {
      return res.status(400).json({ error: "No podés eliminar tu propia cuenta." });
    }
    db.prepare("DELETE FROM members WHERE id = ?").run(row.id);
    audit(db, req.member.id, "delete", "member", row.id);
    res.json({ ok: true });
  });

  // ─── Territorios ───────────────────────────────────────────────────────────
  router.get("/territories", requireGrant("members"), (_req, res) => {
    const items = db
      .prepare(`
        SELECT t.*, COUNT(m.id) AS members
        FROM territories t LEFT JOIN members m ON m.territory_id = t.id
        GROUP BY t.id ORDER BY t.name
      `)
      .all();
    res.json({ items });
  });

  router.post("/territories", requireGrant("members"), (req, res) => {
    const name = str(req.body?.name, 80);
    if (!name) return res.status(400).json({ error: "El nombre es obligatorio." });
    try {
      const info = db
        .prepare("INSERT INTO territories (name, description) VALUES (?, ?)")
        .run(name, str(req.body?.description, 400));
      res.json({ id: info.lastInsertRowid });
    } catch {
      res.status(400).json({ error: "Ese territorio ya existe." });
    }
  });

  router.put("/territories/:id", requireGrant("members"), (req, res) => {
    db.prepare("UPDATE territories SET name = ?, description = ? WHERE id = ?").run(
      str(req.body?.name, 80),
      str(req.body?.description, 400),
      req.params.id,
    );
    res.json({ ok: true });
  });

  router.delete("/territories/:id", requireGrant("members"), (req, res) => {
    db.prepare("DELETE FROM territories WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  });

  // ─── Anuncios internos ─────────────────────────────────────────────────────
  router.get("/announcements", requireGrant("announcements"), (_req, res) => {
    res.json({
      items: db.prepare("SELECT * FROM announcements ORDER BY pinned DESC, id DESC").all(),
    });
  });

  router.post("/announcements", requireGrant("announcements"), (req, res) => {
    const title = str(req.body?.title, 200);
    if (!title) return res.status(400).json({ error: "El título es obligatorio." });
    const info = db
      .prepare(`
        INSERT INTO announcements (title, body, event_id, pinned, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        title,
        str(req.body?.body, 4000),
        req.body?.eventId ? Number(req.body.eventId) : null,
        req.body?.pinned ? 1 : 0,
        oneOf(req.body?.status, ["draft", "published", "archived"], "published"),
        req.member.id,
      );
    markPending(db, "announcements", info.lastInsertRowid, req.member);
    audit(db, req.member.id, "create", "announcement", info.lastInsertRowid, title);
    res.json({ id: info.lastInsertRowid });
  });

  router.put("/announcements/:id", requireGrant("announcements"), (req, res) => {
    db.prepare(`
      UPDATE announcements SET title = ?, body = ?, event_id = ?, pinned = ?, status = ?
      WHERE id = ?
    `).run(
      str(req.body?.title, 200),
      str(req.body?.body, 4000),
      req.body?.eventId ? Number(req.body.eventId) : null,
      req.body?.pinned ? 1 : 0,
      oneOf(req.body?.status, ["draft", "published", "archived"], "published"),
      req.params.id,
    );
    res.json({ ok: true });
  });

  router.delete("/announcements/:id", requireGrant("announcements"), (req, res) => {
    db.prepare("DELETE FROM announcements WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  });

  // ─── Materiales ────────────────────────────────────────────────────────────
  router.get("/materials", requireGrant("materials"), (_req, res) => {
    res.json({ items: db.prepare("SELECT * FROM materials ORDER BY id DESC").all() });
  });

  router.post("/materials", requireGrant("materials"), (req, res) => {
    const title = str(req.body?.title, 200);
    if (!title) return res.status(400).json({ error: "El título es obligatorio." });
    const info = db
      .prepare(`
        INSERT INTO materials (title, description, url, kind, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        title,
        str(req.body?.description, 1000),
        str(req.body?.url, 800),
        oneOf(req.body?.kind, ["document", "image", "video", "link"], "link"),
        oneOf(req.body?.status, ["draft", "published", "archived"], "published"),
        req.member.id,
      );
    markPending(db, "materials", info.lastInsertRowid, req.member);
    res.json({ id: info.lastInsertRowid });
  });

  router.put("/materials/:id", requireGrant("materials"), (req, res) => {
    db.prepare(`
      UPDATE materials SET title = ?, description = ?, url = ?, kind = ?, status = ?
      WHERE id = ?
    `).run(
      str(req.body?.title, 200),
      str(req.body?.description, 1000),
      str(req.body?.url, 800),
      oneOf(req.body?.kind, ["document", "image", "video", "link"], "link"),
      oneOf(req.body?.status, ["draft", "published", "archived"], "published"),
      req.params.id,
    );
    res.json({ ok: true });
  });

  router.delete("/materials/:id", requireGrant("materials"), (req, res) => {
    db.prepare("DELETE FROM materials WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  });

  // ─── Moderación del foro ───────────────────────────────────────────────────
  router.get("/moderation", requireGrant("moderation"), (_req, res) => {
    const threads = db
      .prepare(`
        SELECT th.*, c.title AS cause_title,
          (SELECT COUNT(*) FROM posts p WHERE p.thread_id = th.id AND p.status = 'visible') AS visible_posts
        FROM threads th LEFT JOIN causes c ON c.id = th.cause_id
        ORDER BY th.pinned DESC, th.id DESC
      `)
      .all();
    const hidden = db
      .prepare(`
        SELECT p.*, m.name AS member_name, COALESCE(NULLIF(m.name, ''), m.phone) AS member_email, th.title AS thread_title
        FROM posts p
        JOIN members m ON m.id = p.member_id
        JOIN threads th ON th.id = p.thread_id
        WHERE p.status != 'visible' ORDER BY p.id DESC LIMIT 100
      `)
      .all();
    const recent = db
      .prepare(`
        SELECT p.*, m.name AS member_name, th.title AS thread_title
        FROM posts p
        JOIN members m ON m.id = p.member_id
        JOIN threads th ON th.id = p.thread_id
        WHERE p.status = 'visible' ORDER BY p.id DESC LIMIT 50
      `)
      .all();
    res.json({ threads, hidden, recent });
  });

  router.post("/moderation/threads", requireGrant("moderation"), (req, res) => {
    const title = str(req.body?.title, 250);
    if (!title) return res.status(400).json({ error: "El título es obligatorio." });
    const info = db
      .prepare(`
        INSERT INTO threads (eyebrow, title, moderation_note, cause_id, territory_id, pinned, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        str(req.body?.eyebrow, 80),
        title,
        str(req.body?.moderationNote, 1000),
        req.body?.causeId ? Number(req.body.causeId) : null,
        req.body?.territoryId ? Number(req.body.territoryId) : null,
        req.body?.pinned ? 1 : 0,
        req.member.id,
      );
    audit(db, req.member.id, "create", "thread", info.lastInsertRowid, title);
    res.json({ id: info.lastInsertRowid });
  });

  router.put("/moderation/threads/:id", requireGrant("moderation"), (req, res) => {
    const row = db.prepare("SELECT * FROM threads WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Conversación no encontrada." });
    db.prepare(`
      UPDATE threads SET eyebrow = ?, title = ?, moderation_note = ?, pinned = ?, locked = ?, status = ?
      WHERE id = ?
    `).run(
      str(req.body?.eyebrow ?? row.eyebrow, 80),
      str(req.body?.title ?? row.title, 250),
      str(req.body?.moderationNote ?? row.moderation_note, 1000),
      req.body?.pinned != null ? (req.body.pinned ? 1 : 0) : row.pinned,
      req.body?.locked != null ? (req.body.locked ? 1 : 0) : row.locked,
      oneOf(req.body?.status, ["open", "closed", "hidden"], row.status),
      row.id,
    );
    audit(db, req.member.id, "update", "thread", row.id);
    res.json({ ok: true });
  });

  router.put("/moderation/posts/:id", requireGrant("moderation"), (req, res) => {
    const row = db.prepare("SELECT id FROM posts WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Mensaje no encontrado." });
    db.prepare("UPDATE posts SET status = ?, hidden_reason = ? WHERE id = ?").run(
      oneOf(req.body?.status, ["visible", "hidden", "deleted"], "hidden"),
      str(req.body?.reason, 300),
      row.id,
    );
    audit(db, req.member.id, "moderate", "post", row.id, req.body?.status);
    res.json({ ok: true });
  });

  // ─── Ajustes y auditoría (solo administración) ────────────────────────────
  router.get("/settings", requireGrant("settings"), (_req, res) => {
    res.json({ items: db.prepare("SELECT key, value FROM settings ORDER BY key").all() });
  });

  router.put("/settings", requireGrant("settings"), (req, res) => {
    const entries = Object.entries(req.body ?? {});
    const upsert = db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    );
    for (const [key, value] of entries) {
      upsert.run(str(key, 60), str(String(value), 500));
    }
    audit(db, req.member.id, "update", "settings", null);
    res.json({ ok: true });
  });

  router.get("/audit", requireGrant("settings"), (_req, res) => {
    res.json({
      items: db
        .prepare(`
          SELECT a.*, COALESCE(NULLIF(m.name, ''), m.phone) AS actor_email FROM audit_log a
          LEFT JOIN members m ON m.id = a.actor_id
          ORDER BY a.id DESC LIMIT 200
        `)
        .all(),
    });
  });

  return router;
}

function uniqueSlug(db, table, base) {
  let slug = base || "item";
  let n = 2;
  while (db.prepare(`SELECT 1 FROM ${table} WHERE slug = ?`).get(slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function oneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function causeParams(b, title, slug) {
  return [
    slug,
    title,
    str(b.summary, 600),
    str(b.statusLabel, 60) || "EN GESTIÓN",
    intIn(b.progress, 0, 100, 0),
    str(b.progressFrom, 120),
    str(b.progressNext, 120),
    str(b.leadImage, 500),
    normalizarVideo(b.video).valor ?? "",
    adjuntoUrl(b.attachment),
    str(b.attachmentName, 200),
    str(b.briefTitle, 120) || "¿QUÉ ESTÁ PASANDO?",
    str(b.briefBody, 4000),
    JSON.stringify(Array.isArray(b.bullets) ? b.bullets.map((x) => str(x, 300)) : []),
    str(b.keyFactValue, 60),
    str(b.keyFactLabel, 200),
    JSON.stringify(Array.isArray(b.nextSteps) ? b.nextSteps.map((x) => str(x, 300)) : []),
    ["draft", "published", "archived"].includes(b.status) ? b.status : "draft",
  ];
}

function eventParams(b, title, startsAt) {
  const lat = b.latitude === "" || b.latitude == null ? null : Number(b.latitude);
  const lng = b.longitude === "" || b.longitude == null ? null : Number(b.longitude);
  return [
    title,
    str(b.summary, 1000),
    str(b.eventType, 80) || "ACTIVIDAD",
    startsAt,
    str(b.endsAt, 40) || null,
    str(b.placeName, 200),
    str(b.address, 300),
    Number.isFinite(lat) ? lat : null,
    Number.isFinite(lng) ? lng : null,
    str(b.googleMapsUrl, 800),
    b.visibility === "members" ? "members" : "public",
    ["draft", "published", "cancelled"].includes(b.status) ? b.status : "draft",
    str(b.image, 500),
  ];
}

function questionParams(b) {
  const prompt = str(b.prompt, 500);
  const options = Array.isArray(b.options) ? b.options.map((o) => str(o, 200)) : [];
  if (!prompt) return { error: "La pregunta es obligatoria." };
  if (options.length !== 4 || options.some((o) => !o)) {
    return { error: "Se necesitan exactamente 4 opciones no vacías." };
  }
  const correct = intIn(b.correctOption, 0, 3, -1);
  if (correct < 0) return { error: "Falta indicar la opción correcta (0 a 3)." };
  const category = ["biography", "governments", "rights", "history", "culture"].includes(
    b.category,
  )
    ? b.category
    : null;
  if (!category) return { error: "Categoría inválida." };
  return {
    params: [
      category,
      prompt,
      JSON.stringify(options),
      correct,
      str(b.explanation, 1000),
      str(b.sourceTitle, 200),
      str(b.sourceUrl, 500),
      intIn(b.difficulty, 1, 3, 1),
      b.enabled === false ? 0 : 1,
    ],
  };
}
