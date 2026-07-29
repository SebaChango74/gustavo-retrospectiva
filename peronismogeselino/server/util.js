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
