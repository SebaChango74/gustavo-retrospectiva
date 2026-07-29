import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Fotos que suben los colaboradores.
 *
 * Van al volumen persistente, junto a la base: si fueran a la carpeta del
 * programa, cada despliegue las borraría.
 */
const DATA_DIR = process.env.PG_DATA_DIR || path.join(__dirname, "..", "data");
export const SUBIDAS_DIR = path.join(DATA_DIR, "subidas");

/** La ruta pública desde la que se sirven. */
export const SUBIDAS_URL = "/peronismogeselino/subidas";

export const LIMITE_BYTES = 8 * 1024 * 1024;

/**
 * El tipo se decide por el contenido, no por lo que diga el navegador: un
 * archivo puede anunciarse como imagen y ser cualquier otra cosa. Nada de
 * SVG, que es capaz de ejecutar código.
 */
const FIRMAS = [
  { ext: "jpg", tipo: "image/jpeg", prueba: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: "png",
    tipo: "image/png",
    prueba: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d &&
      b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    ext: "webp",
    tipo: "image/webp",
    prueba: (b) =>
      b.length > 12 && b.subarray(0, 4).toString("latin1") === "RIFF" &&
      b.subarray(8, 12).toString("latin1") === "WEBP",
  },
];

export function reconocerImagen(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  return FIRMAS.find((f) => f.prueba(buffer)) ?? null;
}

export function asegurarCarpeta() {
  fs.mkdirSync(SUBIDAS_DIR, { recursive: true });
}

/** Nombre propio, derivado del contenido: subir dos veces lo mismo no duplica. */
export function guardarImagen(buffer, ext) {
  asegurarCarpeta();
  const huella = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 16);
  const nombre = `${huella}.${ext}`;
  const destino = path.join(SUBIDAS_DIR, nombre);
  if (!fs.existsSync(destino)) fs.writeFileSync(destino, buffer);
  return { nombre, url: `${SUBIDAS_URL}/${nombre}` };
}

export function listarImagenes() {
  asegurarCarpeta();
  return fs
    .readdirSync(SUBIDAS_DIR)
    .filter((n) => /\.(jpg|png|webp)$/i.test(n))
    .map((nombre) => {
      const datos = fs.statSync(path.join(SUBIDAS_DIR, nombre));
      return { nombre, url: `${SUBIDAS_URL}/${nombre}`, bytes: datos.size, subida: datos.mtime.toISOString() };
    })
    .sort((a, b) => b.subida.localeCompare(a.subida));
}

/** Borra una imagen. El nombre se valida para no salir de la carpeta. */
export function borrarImagen(nombre) {
  if (!/^[a-f0-9]{16}\.(jpg|png|webp)$/i.test(String(nombre))) return false;
  const destino = path.join(SUBIDAS_DIR, nombre);
  if (!fs.existsSync(destino)) return false;
  fs.unlinkSync(destino);
  return true;
}

/** Dónde se está usando una foto: borrarla a ciegas rompe lo publicado.
 *  El valor guardado puede llevar el encuadre pegado («…jpg#e=48,22»),
 *  así que se compara también contra esa forma. */
export function dondeSeUsa(db, url) {
  const usos = [];
  const buscar = [
    ["news", "title", "image", "noticia"],
    ["causes", "title", "lead_image", "causa"],
    ["events", "title", "image", "actividad"],
  ];
  for (const [tabla, titulo, columna, etiqueta] of buscar) {
    const filas = db
      .prepare(
        `SELECT ${titulo} AS t FROM ${tabla} WHERE ${columna} = ? OR ${columna} LIKE ? || '#%'`,
      )
      .all(url, url);
    for (const fila of filas) usos.push(`${etiqueta}: ${fila.t}`);
  }
  return usos;
}
