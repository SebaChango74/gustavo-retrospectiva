import { Router } from "express";
import { parseJson, publicEvent, mapsEmbedUrl } from "../util.js";

export function publicRoutes(db) {
  const router = Router();

  router.get("/config", (_req, res) => {
    res.json({
      googleClientId: process.env.PG_GOOGLE_CLIENT_ID || "",
      devLogin: process.env.PG_DEV === "1",
    });
  });

  router.get("/home", (req, res) => {
    const isMember = Boolean(req.member);
    const news = db
      .prepare(`
        SELECT slug, tag, title, summary, image, featured, published_at
        FROM news WHERE status = 'published'
        ORDER BY featured DESC, published_at DESC LIMIT 6
      `)
      .all();
    const cause = db
      .prepare(`
        SELECT slug, title, summary, status_label, progress, progress_from, progress_next
        FROM causes WHERE status = 'published'
        ORDER BY updated_at DESC LIMIT 1
      `)
      .get();
    const events = db
      .prepare(`
        SELECT * FROM events
        WHERE status = 'published' AND datetime(starts_at) >= datetime('now', '-1 day')
        ORDER BY starts_at ASC LIMIT 4
      `)
      .all()
      .map((row) => withEmbed(publicEvent(row, isMember), row, isMember));
    const settings = getSettings(db);
    const causesCount = db
      .prepare("SELECT COUNT(*) AS n FROM causes WHERE status = 'published'")
      .get().n;
    res.json({
      news,
      cause,
      events,
      stats: {
        territorios: settings.stats_territorios || "23",
        causasActivas: String(causesCount || settings.stats_causas_activas || "1"),
        municipios: settings.stats_municipios || "135",
      },
    });
  });

  router.get("/news", (_req, res) => {
    const rows = db
      .prepare(`
        SELECT slug, tag, title, summary, body, image, featured, published_at
        FROM news WHERE status = 'published' ORDER BY published_at DESC LIMIT 50
      `)
      .all();
    res.json({ news: rows });
  });

  router.get("/causes", (_req, res) => {
    const rows = db
      .prepare(`
        SELECT slug, title, summary, status_label, progress, progress_from, progress_next,
          lead_image, updated_at
        FROM causes WHERE status = 'published' ORDER BY updated_at DESC
      `)
      .all();
    res.json({ causes: rows });
  });

  router.get("/causes/:slug", (req, res) => {
    const cause = db
      .prepare("SELECT * FROM causes WHERE slug = ? AND status = 'published'")
      .get(req.params.slug);
    if (!cause) return res.status(404).json({ error: "Causa no encontrada." });
    const timeline = db
      .prepare(
        "SELECT date_label, title, body, state FROM cause_timeline WHERE cause_id = ? ORDER BY position",
      )
      .all(cause.id);
    res.json({
      cause: {
        slug: cause.slug,
        title: cause.title,
        summary: cause.summary,
        statusLabel: cause.status_label,
        progress: cause.progress,
        progressFrom: cause.progress_from,
        progressNext: cause.progress_next,
        leadImage: cause.lead_image,
        briefTitle: cause.brief_title,
        briefBody: cause.brief_body,
        bullets: parseJson(cause.bullets, []),
        keyFactValue: cause.key_fact_value,
        keyFactLabel: cause.key_fact_label,
        nextSteps: parseJson(cause.next_steps, []),
        updatedAt: cause.updated_at,
      },
      timeline,
    });
  });

  router.get("/events", (req, res) => {
    const isMember = Boolean(req.member);
    const rows = db
      .prepare(`
        SELECT * FROM events
        WHERE status = 'published' AND datetime(starts_at) >= datetime('now', '-1 day')
        ORDER BY starts_at ASC LIMIT 30
      `)
      .all();
    res.json({
      events: rows.map((row) => withEmbed(publicEvent(row, isMember), row, isMember)),
      isMember,
    });
  });

  return router;
}

function withEmbed(event, row, isMember) {
  if (row.visibility === "public" || isMember) {
    return { ...event, mapsEmbedUrl: mapsEmbedUrl(row) };
  }
  return event;
}

export function getSettings(db) {
  const out = {};
  for (const row of db.prepare("SELECT key, value FROM settings").all()) {
    out[row.key] = row.value;
  }
  return out;
}
