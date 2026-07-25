import { Router } from "express";
import { requireGrant, canApprove } from "../auth.js";
import { audit, intIn, parseJson, slugify, str } from "../util.js";
import { APPROVABLE, approveItem, markPending, pendingItems, rejectItem } from "../approval.js";

export function adminRoutes(db) {
  const router = Router();

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
    const slug = str(b.slug, 80) || uniqueSlug(db, "news", slugify(title));
    const info = db
      .prepare(`
        INSERT INTO news (slug, tag, title, summary, body, image, featured, status, published_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        slug,
        str(b.tag, 60) || "Villa Gesell",
        title,
        str(b.summary, 500),
        str(b.body, 20000),
        str(b.image, 500),
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
    db.prepare(`
      UPDATE news SET tag = ?, title = ?, summary = ?, body = ?, image = ?, featured = ?,
        status = ?, published_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      str(b.tag, 60) || "Villa Gesell",
      str(b.title, 200),
      str(b.summary, 500),
      str(b.body, 20000),
      str(b.image, 500),
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
    const slug = str(b.slug, 80) || uniqueSlug(db, "causes", slugify(title));
    const info = db
      .prepare(`
        INSERT INTO causes (slug, title, summary, status_label, progress, progress_from,
          progress_next, lead_image, brief_title, brief_body, bullets, key_fact_value,
          key_fact_label, next_steps, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    const params = causeParams(b, title, row.slug);
    db.prepare(`
      UPDATE causes SET slug = ?, title = ?, summary = ?, status_label = ?, progress = ?,
        progress_from = ?, progress_next = ?, lead_image = ?, brief_title = ?, brief_body = ?,
        bullets = ?, key_fact_value = ?, key_fact_label = ?, next_steps = ?, status = ?,
        updated_at = datetime('now')
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
          address, latitude, longitude, google_maps_url, visibility, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        visibility = ?, status = ?, updated_at = datetime('now')
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
        SELECT m.id, m.email, m.name, m.role, m.admin_tier, m.status, m.territory_id, m.last_login_at,
          m.created_at, t.name AS territory_name
        FROM members m LEFT JOIN territories t ON t.id = m.territory_id
        ORDER BY m.created_at DESC
      `)
      .all();
    res.json({ items });
  });

  router.post("/members", requireGrant("members"), (req, res) => {
    const email = str(req.body?.email, 254).toLowerCase();
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Correo inválido." });
    }
    const cap = Number(
      db.prepare("SELECT value FROM settings WHERE key = 'community_cap'").get()?.value || 500,
    );
    const count = db.prepare("SELECT COUNT(*) AS n FROM members").get().n;
    if (count >= cap) {
      return res.status(400).json({ error: `La comunidad alcanzó el máximo de ${cap} miembros.` });
    }
    const existing = db.prepare("SELECT id FROM members WHERE email = ?").get(email);
    if (existing) return res.status(400).json({ error: "Ese correo ya está invitado." });
    const info = db
      .prepare(`
        INSERT INTO members (email, name, role, status, territory_id, invited_by)
        VALUES (?, ?, ?, 'invited', ?, ?)
      `)
      .run(
        email,
        str(req.body?.name, 120),
        oneOf(req.body?.role, ["admin", "editor", "moderator", "referente", "member"], "member"),
        req.body?.territoryId ? Number(req.body.territoryId) : null,
        req.member.id,
      );
    audit(db, req.member.id, "invite", "member", info.lastInsertRowid, email);
    res.json({ id: info.lastInsertRowid });
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
    db.prepare(
      "UPDATE members SET name = ?, role = ?, status = ?, territory_id = ?, admin_tier = ? WHERE id = ?",
    ).run(
      str(req.body?.name ?? row.name, 120),
      role,
      status,
      req.body?.territoryId ? Number(req.body.territoryId) : null,
      tier,
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
        SELECT p.*, m.name AS member_name, m.email AS member_email, th.title AS thread_title
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
          SELECT a.*, m.email AS actor_email FROM audit_log a
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
