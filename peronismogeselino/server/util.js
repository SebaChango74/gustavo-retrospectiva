export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseJson(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function str(value, max = 5000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function intIn(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function audit(db, actorId, action, entity, entityId, detail = "") {
  db.prepare(
    "INSERT INTO audit_log (actor_id, action, entity, entity_id, detail) VALUES (?, ?, ?, ?, ?)",
  ).run(actorId ?? null, action, entity, entityId ?? null, String(detail).slice(0, 500));
}

/**
 * Reconoce un enlace de YouTube en cualquiera de sus formas (watch, youtu.be,
 * shorts, live, embed) y devuelve el identificador del video, o null si no es
 * de YouTube. Solo se aceptan videos de ahí: es lo que pidió la mesa y evita
 * incrustar cualquier cosa.
 */
export function youtubeId(url) {
  const texto = String(url ?? "").trim();
  if (!texto) return null;
  let u;
  try {
    u = new URL(texto.startsWith("http") ? texto : `https://${texto}`);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  let id = "";
  if (host === "youtu.be") {
    id = u.pathname.slice(1).split("/")[0];
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const partes = u.pathname.split("/").filter(Boolean);
    if (u.pathname === "/watch") id = u.searchParams.get("v") ?? "";
    else if (["shorts", "embed", "live", "v"].includes(partes[0])) id = partes[1] ?? "";
  } else {
    return null;
  }
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

/**
 * Guarda el video en su forma canónica, venga como venga el enlace.
 * Devuelve { error } si el texto no es un video de YouTube.
 */
export function normalizarVideo(url) {
  const texto = String(url ?? "").trim();
  if (!texto) return { valor: "" };
  const id = youtubeId(texto);
  if (!id) {
    return { error: "El video tiene que ser un enlace de YouTube (youtube.com o youtu.be)." };
  }
  return { valor: `https://www.youtube.com/watch?v=${id}` };
}

/**
 * La hora de Villa Gesell, en el mismo formato naive que guardan los campos
 * de fecha del panel ("2026-12-01T18:00"). Las fechas se comparan siempre en
 * hora local: contra el datetime('now') de SQLite, que es UTC, todo vencería
 * tres horas antes.
 */
export function ahoraLocal() {
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  return partes.replace(" ", "T");
}

/** Convierte una fila de evento a su versión pública: una actividad de
 *  miembros nunca expone dirección, coordenadas ni enlace de Maps. */
export function publicEvent(row, isMember) {
  const base = {
    id: row.id,
    title: row.title,
    summary: row.summary,
    eventType: row.event_type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    visibility: row.visibility,
    status: row.status,
    // La foto no revela dónde es: va siempre, también en las de miembros.
    image: row.image ?? "",
  };
  if (row.visibility === "public" || isMember) {
    return {
      ...base,
      placeName: row.place_name,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      googleMapsUrl: row.google_maps_url,
    };
  }
  return base;
}

/** Genera la URL de embed de Google Maps (iframe sin clave ni costo) a partir
 *  de coordenadas o dirección. */
export function mapsEmbedUrl(event) {
  if (event.latitude != null && event.longitude != null) {
    return `https://www.google.com/maps?q=${event.latitude},${event.longitude}&output=embed`;
  }
  const query = [event.address, event.place_name ?? event.placeName].filter(Boolean)[0];
  if (!query) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}
