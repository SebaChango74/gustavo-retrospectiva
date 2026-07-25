import { Router } from "express";
import { requireMember } from "../auth.js";
import { audit, mapsEmbedUrl, str } from "../util.js";

const AVATAR_COLORS = ["sky", "red", "gold", "navy"];

export function communityRoutes(db) {
  const router = Router();
  router.use(requireMember);

  router.get("/overview", (req, res) => {
    const announcements = db
      .prepare(`
        SELECT a.id, a.title, a.body, a.pinned, a.created_at,
          e.id AS event_id, e.title AS event_title, e.starts_at AS event_starts_at
        FROM announcements a LEFT JOIN events e ON e.id = a.event_id
        WHERE a.status = 'published' AND a.pending = 0
        ORDER BY a.pinned DESC, a.id DESC LIMIT 10
      `)
      .all();

    const nextEventRow = db
      .prepare(`
        SELECT * FROM events
        WHERE status = 'published' AND pending = 0 AND datetime(starts_at) >= datetime('now', '-6 hours')
        ORDER BY starts_at ASC LIMIT 1
      `)
      .get();

    const stats = {
      activeMembers: db
        .prepare("SELECT COUNT(*) AS n FROM members WHERE status = 'active'")
        .get().n,
      territories: db.prepare("SELECT COUNT(*) AS n FROM territories").get().n,
      openThreads: db
        .prepare("SELECT COUNT(*) AS n FROM threads WHERE status = 'open'")
        .get().n,
    };

    let nextEvent = null;
    if (nextEventRow) {
      const myRsvp = db
        .prepare("SELECT response FROM event_rsvps WHERE event_id = ? AND member_id = ?")
        .get(nextEventRow.id, req.member.id);
      nextEvent = {
        id: nextEventRow.id,
        title: nextEventRow.title,
        summary: nextEventRow.summary,
        eventType: nextEventRow.event_type,
        startsAt: nextEventRow.starts_at,
        placeName: nextEventRow.place_name,
        address: nextEventRow.address,
        googleMapsUrl: nextEventRow.google_maps_url,
        mapsEmbedUrl: mapsEmbedUrl(nextEventRow),
        visibility: nextEventRow.visibility,
        myRsvp: myRsvp?.response ?? null,
        confirmed: db
          .prepare(
            "SELECT COUNT(*) AS n FROM event_rsvps WHERE event_id = ? AND response = 'yes'",
          )
          .get(nextEventRow.id).n,
      };
    }

    res.json({ member: req.member, announcements, stats, nextEvent });
  });

  router.get("/threads", (req, res) => {
    const filter = String(req.query.filter || "plaza");
    let where = "th.status = 'open'";
    const params = [];
    if (filter === "causas") {
      where += " AND th.cause_id IS NOT NULL";
    } else if (filter === "territorio") {
      where += " AND th.territory_id IS NOT NULL AND th.territory_id = ?";
      params.push(req.member.territoryId ?? -1);
    } else if (filter === "ideas") {
      where += " AND th.cause_id IS NULL AND th.territory_id IS NULL AND th.pinned = 0";
    }
    const threads = db
      .prepare(`
        SELECT th.id, th.eyebrow, th.title, th.moderation_note, th.pinned, th.locked,
          th.cause_id, th.territory_id,
          (SELECT COUNT(*) FROM posts p WHERE p.thread_id = th.id AND p.status = 'visible') AS replies,
          (SELECT COUNT(DISTINCT p.member_id) FROM posts p
            WHERE p.thread_id = th.id AND p.status = 'visible') AS participants
        FROM threads th
        WHERE ${where}
        ORDER BY th.pinned DESC, th.id DESC LIMIT 50
      `)
      .all(...params);
    res.json({ threads });
  });

  router.get("/threads/:id", (req, res) => {
    const thread = db
      .prepare("SELECT * FROM threads WHERE id = ? AND status != 'hidden'")
      .get(req.params.id);
    if (!thread) return res.status(404).json({ error: "Conversación no encontrada." });
    const posts = db
      .prepare(`
        SELECT p.id, p.body, p.created_at, p.member_id,
          m.name AS member_name, t.name AS territory_name
        FROM posts p
        JOIN members m ON m.id = p.member_id
        LEFT JOIN territories t ON t.id = m.territory_id
        WHERE p.thread_id = ? AND p.status = 'visible'
        ORDER BY p.id ASC LIMIT 300
      `)
      .all(thread.id);
    res.json({
      thread: {
        id: thread.id,
        eyebrow: thread.eyebrow,
        title: thread.title,
        moderationNote: thread.moderation_note,
        locked: Boolean(thread.locked),
        pinned: Boolean(thread.pinned),
      },
      posts: posts.map((post) => ({
        id: post.id,
        body: post.body,
        createdAt: `${post.created_at.replace(" ", "T")}Z`,
        memberName: post.member_name || "Miembro",
        territoryName: post.territory_name || "",
        initials: initialsOf(post.member_name),
        color: AVATAR_COLORS[post.member_id % AVATAR_COLORS.length],
        mine: post.member_id === req.member.id,
      })),
    });
  });

  router.post("/threads/:id/posts", (req, res) => {
    const thread = db
      .prepare("SELECT * FROM threads WHERE id = ? AND status = 'open'")
      .get(req.params.id);
    if (!thread) return res.status(404).json({ error: "Conversación no encontrada." });
    if (thread.locked) {
      return res.status(403).json({ error: "Esta conversación está en solo lectura." });
    }
    const body = str(req.body?.body, 2000);
    if (!body) return res.status(400).json({ error: "El mensaje está vacío." });

    const recent = db
      .prepare(`
        SELECT COUNT(*) AS n FROM posts
        WHERE member_id = ? AND created_at > datetime('now', '-30 seconds')
      `)
      .get(req.member.id).n;
    if (recent >= 3) {
      return res.status(429).json({ error: "Muy rápido. Esperá unos segundos y volvé a intentar." });
    }

    const info = db
      .prepare("INSERT INTO posts (thread_id, member_id, body) VALUES (?, ?, ?)")
      .run(thread.id, req.member.id, body);
    res.json({ id: info.lastInsertRowid });
  });

  router.get("/materials", (_req, res) => {
    res.json({
      items: db
        .prepare(
          "SELECT id, title, description, url, kind, created_at FROM materials WHERE status = 'published' AND pending = 0 ORDER BY id DESC",
        )
        .all(),
    });
  });

  router.get("/territory", (req, res) => {
    const territory = req.member.territoryId
      ? db.prepare("SELECT * FROM territories WHERE id = ?").get(req.member.territoryId)
      : null;
    const threads = territory
      ? db
          .prepare(`
            SELECT th.id, th.eyebrow, th.title,
              (SELECT COUNT(*) FROM posts p WHERE p.thread_id = th.id AND p.status = 'visible') AS replies
            FROM threads th WHERE th.territory_id = ? AND th.status = 'open'
            ORDER BY th.id DESC
          `)
          .all(territory.id)
      : [];
    const referentes = territory
      ? db
          .prepare(
            "SELECT name FROM members WHERE territory_id = ? AND role = 'referente' AND status = 'active'",
          )
          .all(territory.id)
      : [];
    res.json({ territory, threads, referentes });
  });

  router.post("/events/:id/rsvp", (req, res) => {
    const event = db
      .prepare("SELECT id FROM events WHERE id = ? AND status = 'published'")
      .get(req.params.id);
    if (!event) return res.status(404).json({ error: "Actividad no encontrada." });
    const response = req.body?.response === "no" ? "no" : "yes";
    db.prepare(`
      INSERT INTO event_rsvps (event_id, member_id, response) VALUES (?, ?, ?)
      ON CONFLICT(event_id, member_id) DO UPDATE SET response = excluded.response
    `).run(event.id, req.member.id, response);
    audit(db, req.member.id, "rsvp", "event", event.id, response);
    res.json({ ok: true, response });
  });

  return router;
}

function initialsOf(name) {
  const parts = String(name || "M").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "M";
}
