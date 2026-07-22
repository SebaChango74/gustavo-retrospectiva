// Lógica del módulo PERÓN 365: día canónico argentino y selección diaria
// determinística. Una fecha ya asignada nunca se recalcula.

export const P365_THEMES = [
  "almanaque",
  "postal",
  "cuaderno",
  "revista",
  "calendario",
  "sobremesa",
  "territorio",
];

const DAY_KEY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function todayKey(now = new Date()) {
  return DAY_KEY_FORMAT.format(now);
}

export function isValidDayKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`));
}

// Tema por día de la semana (lunes → almanaque, … domingo → territorio).
export function themeForDay(dayKey) {
  const weekday = new Date(`${dayKey}T12:00:00Z`).getUTCDay(); // 0 = domingo
  const order = [6, 0, 1, 2, 3, 4, 5];
  return P365_THEMES[order[weekday]];
}

// Barajado determinístico por semilla anual: el mazo del año es estable.
function seededOrder(ids, seed) {
  let state = seed >>> 0 || 1;
  const random = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
  const array = [...ids];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function minGapDays(db) {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'peron365_min_gap'").get();
  const n = Number(row?.value);
  return Number.isFinite(n) && n > 0 ? n : 120;
}

/** Devuelve (creándola si hace falta) la asignación del día indicado. */
export function ensureDay(db, dayKey) {
  const existing = db
    .prepare("SELECT * FROM peron365_days WHERE day_key = ?")
    .get(dayKey);
  if (existing) {
    if (existing.status === "scheduled" && dayKey <= todayKey()) {
      db.prepare(
        "UPDATE peron365_days SET status = 'published', published_at = datetime('now') WHERE day_key = ?",
      ).run(dayKey);
      existing.status = "published";
    }
    return existing;
  }

  const quotes = db
    .prepare(`
      SELECT id FROM peron365_quotes
      WHERE verification_status = 'verified' AND active = 1
      ORDER BY id
    `)
    .all()
    .map((row) => row.id);
  if (quotes.length === 0) return null;

  const year = Number(dayKey.slice(0, 4));
  const ordered = seededOrder(quotes, year * 2654435761);

  const gap = minGapDays(db);
  const gapStart = addDays(dayKey, -gap);
  const recentlyUsed = new Set(
    db
      .prepare("SELECT quote_id FROM peron365_days WHERE day_key >= ? AND day_key < ?")
      .all(gapStart, dayKey)
      .map((row) => row.quote_id),
  );

  // Punto de partida estable dentro del mazo anual: día del año módulo mazo.
  const dayOfYear = Math.floor(
    (Date.parse(`${dayKey}T00:00:00Z`) - Date.parse(`${year}-01-01T00:00:00Z`)) / 86400000,
  );
  let chosen = null;
  for (let i = 0; i < ordered.length; i++) {
    const candidate = ordered[(dayOfYear + i) % ordered.length];
    if (!recentlyUsed.has(candidate)) {
      chosen = candidate;
      break;
    }
  }
  chosen ??= ordered[dayOfYear % ordered.length];

  db.prepare(`
    INSERT INTO peron365_days (day_key, quote_id, theme, status, published_at)
    VALUES (?, ?, ?, 'published', datetime('now'))
    ON CONFLICT(day_key) DO NOTHING
  `).run(dayKey, chosen, themeForDay(dayKey));
  return db.prepare("SELECT * FROM peron365_days WHERE day_key = ?").get(dayKey);
}

export function addDays(dayKey, delta) {
  const date = new Date(`${dayKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

export function publicDay(db, dayRow, member) {
  if (!dayRow) return null;
  const quote = db
    .prepare("SELECT * FROM peron365_quotes WHERE id = ?")
    .get(dayRow.quote_id);
  if (!quote) return null;
  let saved = false;
  if (member) {
    saved = Boolean(
      db
        .prepare("SELECT 1 FROM peron365_saves WHERE member_id = ? AND day_key = ?")
        .get(member.id, dayRow.day_key),
    );
  }
  return {
    dayKey: dayRow.day_key,
    theme: dayRow.theme,
    isToday: dayRow.day_key === todayKey(),
    saved,
    quote: {
      id: quote.id,
      text: quote.text,
      shortText: quote.short_text || quote.text,
      author: quote.author,
      sourceTitle: quote.source_title,
      sourceType: quote.source_type,
      sourceDate: quote.source_date,
      sourceUrl: quote.source_url,
      context: quote.historical_context,
      topic: quote.topic,
    },
  };
}
