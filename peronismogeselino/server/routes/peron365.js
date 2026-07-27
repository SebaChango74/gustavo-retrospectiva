import { Router } from "express";
import { requireMember, requireGrant } from "../auth.js";
import { audit, intIn, str } from "../util.js";
import {
  P365_THEMES,
  addDays,
  ensureDay,
  isValidDayKey,
  publicDay,
  themeForDay,
  todayKey,
} from "../peron365.js";

export function peron365Routes(db) {
  const router = Router();

  // ─── Público ───────────────────────────────────────────────────────────────
  router.get("/today", (req, res) => {
    const day = ensureDay(db, todayKey());
    const payload = publicDay(db, day, req.member);
    if (!payload) {
      return res.status(404).json({ error: "Todavía no hay frase publicada." });
    }
    res.json({ day: payload, modalEnabled: modalEnabled(db) });
  });

  router.get("/days/:date", (req, res) => {
    const date = req.params.date;
    if (!isValidDayKey(date)) return res.status(400).json({ error: "Fecha inválida." });
    const today = todayKey();
    if (date > today) return res.status(404).json({ error: "Esa fecha todavía no llegó." });
    const day =
      date === today
        ? ensureDay(db, date)
        : db.prepare("SELECT * FROM peron365_days WHERE day_key = ?").get(date);
    const payload = publicDay(db, day, req.member);
    if (!payload) return res.status(404).json({ error: "No hay frase para esa fecha." });
    res.json({ day: payload });
  });

  router.get("/archive", (req, res) => {
    ensureDay(db, todayKey());
    const rows = db
      .prepare(`
        SELECT d.day_key, d.theme, q.short_text, q.text, q.source_title, q.source_date
        FROM peron365_days d JOIN peron365_quotes q ON q.id = d.quote_id
        WHERE d.day_key <= ? AND d.status = 'published'
        ORDER BY d.day_key DESC LIMIT 90
      `)
      .all(todayKey());
    res.json({
      days: rows.map((row) => ({
        dayKey: row.day_key,
        theme: row.theme,
        shortText: row.short_text || row.text,
        sourceTitle: row.source_title,
        sourceDate: row.source_date,
      })),
    });
  });

  router.post("/days/:date/open-event", (req, res) => {
    if (isValidDayKey(req.params.date)) {
      db.prepare("UPDATE peron365_days SET opens = opens + 1 WHERE day_key = ?").run(
        req.params.date,
      );
    }
    res.json({ ok: true });
  });

  router.post("/days/:date/share-event", (req, res) => {
    if (isValidDayKey(req.params.date)) {
      db.prepare("UPDATE peron365_days SET shares = shares + 1 WHERE day_key = ?").run(
        req.params.date,
      );
    }
    res.json({ ok: true });
  });

  // ─── Miembros ──────────────────────────────────────────────────────────────
  router.post("/days/:date/save", requireMember, (req, res) => {
    const date = req.params.date;
    if (!isValidDayKey(date)) return res.status(400).json({ error: "Fecha inválida." });
    const existing = db
      .prepare("SELECT 1 FROM peron365_saves WHERE member_id = ? AND day_key = ?")
      .get(req.member.id, date);
    if (existing) {
      db.prepare("DELETE FROM peron365_saves WHERE member_id = ? AND day_key = ?").run(
        req.member.id,
        date,
      );
      return res.json({ ok: true, saved: false });
    }
    db.prepare("INSERT INTO peron365_saves (member_id, day_key) VALUES (?, ?)").run(
      req.member.id,
      date,
    );
    res.json({ ok: true, saved: true });
  });

  router.post("/days/:date/thread", requireMember, (req, res) => {
    const date = req.params.date;
    if (!isValidDayKey(date)) return res.status(400).json({ error: "Fecha inválida." });
    const title = `Perón 365 — ${date}`;
    let thread = db.prepare("SELECT id FROM threads WHERE title = ?").get(title);
    if (!thread) {
      const info = db
        .prepare(`
          INSERT INTO threads (eyebrow, title, moderation_note, created_by)
          VALUES ('PERÓN 365', ?, ?, ?)
        `)
        .run(
          title,
          "¿Qué significa esta idea hoy en Villa Gesell? La interpretación de cada uno es actual y no son palabras de Perón.",
          req.member.id,
        );
      thread = { id: info.lastInsertRowid };
      audit(db, req.member.id, "create", "thread", thread.id, title);
    }
    res.json({ threadId: thread.id });
  });

  return router;
}

// ─── Administración ──────────────────────────────────────────────────────────
export function peron365AdminRoutes(db) {
  const router = Router();

  router.get("/quotes", requireGrant("peron365"), (_req, res) => {
    res.json({
      items: db
        .prepare("SELECT * FROM peron365_quotes ORDER BY verification_status DESC, id DESC")
        .all(),
    });
  });

  router.post("/quotes", requireGrant("peron365"), (req, res) => {
    const q = quoteParams(req.body ?? {});
    if (q.error) return res.status(400).json({ error: q.error });
    const info = db
      .prepare(`
        INSERT INTO peron365_quotes (text, short_text, author, source_title, source_type,
          source_date, source_url, source_locator, historical_context, topic,
          verification_status, verified_by, verified_at, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(...q.params(req.member));
    audit(db, req.member.id, "create", "peron365_quote", info.lastInsertRowid);
    res.json({ id: info.lastInsertRowid });
  });

  router.put("/quotes/:id", requireGrant("peron365"), (req, res) => {
    const row = db.prepare("SELECT id FROM peron365_quotes WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Frase no encontrada." });
    const q = quoteParams(req.body ?? {});
    if (q.error) return res.status(400).json({ error: q.error });
    db.prepare(`
      UPDATE peron365_quotes SET text = ?, short_text = ?, author = ?, source_title = ?,
        source_type = ?, source_date = ?, source_url = ?, source_locator = ?,
        historical_context = ?, topic = ?, verification_status = ?, verified_by = ?,
        verified_at = ?, active = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(...q.params(req.member), row.id);
    audit(db, req.member.id, "update", "peron365_quote", row.id);
    res.json({ ok: true });
  });

  router.delete("/quotes/:id", requireGrant("peron365"), (req, res) => {
    const used = db
      .prepare("SELECT COUNT(*) AS n FROM peron365_days WHERE quote_id = ?")
      .get(req.params.id).n;
    if (used > 0) {
      return res.status(400).json({
        error: "Esta frase ya se publicó algún día; desactivala en lugar de borrarla.",
      });
    }
    db.prepare("DELETE FROM peron365_quotes WHERE id = ?").run(req.params.id);
    audit(db, req.member.id, "delete", "peron365_quote", req.params.id);
    res.json({ ok: true });
  });

  router.get("/calendar", requireGrant("peron365"), (_req, res) => {
    const today = todayKey();
    ensureDay(db, today);
    const from = addDays(today, -7);
    const to = addDays(today, 30);
    const assigned = db
      .prepare(`
        SELECT d.*, q.short_text, q.text, q.verification_status
        FROM peron365_days d JOIN peron365_quotes q ON q.id = d.quote_id
        WHERE d.day_key >= ? AND d.day_key <= ?
      `)
      .all(from, to);
    const byDay = new Map(assigned.map((row) => [row.day_key, row]));
    const days = [];
    for (let key = from; key <= to; key = addDays(key, 1)) {
      const row = byDay.get(key);
      days.push({
        dayKey: key,
        isToday: key === today,
        theme: row?.theme ?? themeForDay(key),
        quoteId: row?.quote_id ?? null,
        quoteText: row ? row.short_text || row.text : null,
        status: row ? row.status : "auto",
        opens: row?.opens ?? 0,
        shares: row?.shares ?? 0,
      });
    }
    const duplicates = db
      .prepare(`
        SELECT quote_id, COUNT(*) AS n FROM peron365_days
        WHERE day_key >= ? GROUP BY quote_id HAVING n > 1
      `)
      .all(addDays(today, -120));
    const verifiedCount = db
      .prepare(
        "SELECT COUNT(*) AS n FROM peron365_quotes WHERE verification_status = 'verified' AND active = 1",
      )
      .get().n;
    res.json({ days, duplicates, verifiedCount, themes: P365_THEMES });
  });

  router.put("/calendar/:date", requireGrant("peron365"), (req, res) => {
    const date = req.params.date;
    if (!isValidDayKey(date)) return res.status(400).json({ error: "Fecha inválida." });
    if (date < todayKey()) {
      return res.status(400).json({ error: "Una fecha ya publicada no se puede cambiar." });
    }
    const theme = P365_THEMES.includes(req.body?.theme) ? req.body.theme : themeForDay(date);
    const quoteId = intIn(req.body?.quoteId, 1, 1_000_000_000, 0);
    if (!quoteId) return res.status(400).json({ error: "Falta la frase para asignar." });
    const quote = db
      .prepare(
        "SELECT id FROM peron365_quotes WHERE id = ? AND verification_status = 'verified' AND active = 1",
      )
      .get(quoteId);
    if (!quote) {
      return res.status(400).json({ error: "Solo se puede programar una frase verificada." });
    }
    db.prepare(`
      INSERT INTO peron365_days (day_key, quote_id, theme, status, created_by)
      VALUES (?, ?, ?, 'scheduled', ?)
      ON CONFLICT(day_key) DO UPDATE SET quote_id = excluded.quote_id, theme = excluded.theme
    `).run(date, quoteId, theme, req.member.id);
    audit(db, req.member.id, "schedule", "peron365_day", null, `${date} → frase ${quoteId}`);
    res.json({ ok: true });
  });

  return router;
}

function modalEnabled(db) {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'peron365_modal'").get();
  return row ? row.value !== "0" : true;
}

function quoteParams(b) {
  const text = str(b.text, 600);
  const sourceTitle = str(b.sourceTitle, 250);
  if (!text) return { error: "La frase es obligatoria." };
  if (!sourceTitle) return { error: "La fuente es obligatoria." };
  const status = ["draft", "in_review", "verified", "rejected"].includes(b.verificationStatus)
    ? b.verificationStatus
    : "draft";
  return {
    params: (member) => [
      text,
      str(b.shortText, 200),
      str(b.author, 120) || "Juan Domingo Perón",
      sourceTitle,
      str(b.sourceType, 40) || "discurso",
      str(b.sourceDate, 60),
      str(b.sourceUrl, 500),
      str(b.sourceLocator, 120),
      str(b.context, 1500),
      str(b.topic, 60),
      status,
      status === "verified" ? member.name || member.phone || "" : "",
      status === "verified" ? new Date().toISOString() : null,
      b.active === false ? 0 : 1,
    ],
  };
}
