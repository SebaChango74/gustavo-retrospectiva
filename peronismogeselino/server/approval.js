import { needsApproval } from "./auth.js";

/** Tablas de contenido que pasan por aprobación, con su nombre visible. */
export const APPROVABLE = {
  news: "noticia",
  causes: "causa",
  events: "actividad",
  announcements: "anuncio",
  materials: "material",
};

/**
 * Un editor no publica directo: su contenido queda **pendiente** y no sale al
 * portal hasta que un admin lo aprueba. Un admin publica sin intermediarios.
 */
export function markPending(db, table, id, member) {
  if (!needsApproval(member)) return false;
  db.prepare(`UPDATE ${table} SET pending = 1, submitted_by = ? WHERE id = ?`).run(
    member.id,
    id,
  );
  return true;
}

/** Lo que espera aprobación, de todas las secciones, para la bandeja del panel. */
export function pendingItems(db) {
  const items = [];
  for (const [table, label] of Object.entries(APPROVABLE)) {
    const titleCol = "title";
    const rows = db
      .prepare(`
        SELECT c.id, c.${titleCol} AS title, c.status, m.name AS author_name,
          m.email AS author_email
        FROM ${table} c
        LEFT JOIN members m ON m.id = c.submitted_by
        WHERE c.pending = 1
        ORDER BY c.id DESC
      `)
      .all();
    for (const row of rows) {
      items.push({
        table,
        label,
        id: row.id,
        title: row.title,
        status: row.status,
        author: row.author_name || row.author_email || "un editor",
      });
    }
  }
  return items;
}

export function approveItem(db, table, id) {
  if (!APPROVABLE[table]) return false;
  const row = db.prepare(`SELECT id FROM ${table} WHERE id = ? AND pending = 1`).get(id);
  if (!row) return false;
  db.prepare(`UPDATE ${table} SET pending = 0 WHERE id = ?`).run(id);
  return true;
}

/** Rechazar: vuelve a borrador y deja de estar pendiente. */
export function rejectItem(db, table, id) {
  if (!APPROVABLE[table]) return false;
  const row = db.prepare(`SELECT id FROM ${table} WHERE id = ? AND pending = 1`).get(id);
  if (!row) return false;
  db.prepare(`UPDATE ${table} SET pending = 0, status = 'draft' WHERE id = ?`).run(id);
  return true;
}

/** Condición SQL para que el portal público ignore lo pendiente. */
export const NOT_PENDING = "AND pending = 0";
