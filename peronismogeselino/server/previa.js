import { youtubeId } from "./util.js";

/**
 * Vista previa del enlace, nota por nota.
 *
 * WhatsApp, Facebook y compañía no ejecutan la aplicación: leen las
 * etiquetas del HTML que entrega el servidor. Como toda ruta entregaba el
 * mismo HTML, compartir una nota mostraba siempre la placa genérica de la
 * app. Acá el servidor reescribe esas etiquetas con el título, el resumen y
 * la imagen de lo que se está compartiendo.
 */

function escapar(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** La dirección absoluta de la imagen, sin el encuadre (#e=…). */
function imagenAbsoluta(valor, origen) {
  const limpio = String(valor ?? "").split("#")[0];
  if (!limpio) return "";
  if (limpio.startsWith("http")) return limpio;
  return `${origen}${limpio.startsWith("/") ? "" : "/"}${limpio}`;
}

/**
 * Qué se está compartiendo, según la ruta. Devuelve null para el resto de
 * las páginas, que conservan la vista previa genérica.
 */
function contenidoDe(db, ruta) {
  const noticia = /^\/(?:peronismogeselino\/)?noticias\/([a-z0-9-]+)\/?$/.exec(ruta);
  if (noticia) {
    const fila = db
      .prepare(
        "SELECT title, summary, image, video FROM news WHERE slug = ? AND status = 'published' AND pending = 0",
      )
      .get(noticia[1]);
    if (!fila) return null;
    return { titulo: fila.title, descripcion: fila.summary, imagen: fila.image, video: fila.video };
  }

  const causa = /^\/(?:peronismogeselino\/)?causas\/([a-z0-9-]+)\/?$/.exec(ruta);
  if (causa) {
    const fila = db
      .prepare(
        "SELECT title, summary, lead_image, video FROM causes WHERE slug = ? AND status = 'published' AND pending = 0",
      )
      .get(causa[1]);
    if (!fila) return null;
    return { titulo: fila.title, descripcion: fila.summary, imagen: fila.lead_image, video: fila.video };
  }

  // Actividad puntual de la agenda: /agenda/123 muestra su foto y título.
  const evento = /^\/(?:peronismogeselino\/)?agenda\/(\d+)\/?$/.exec(ruta);
  if (evento) {
    const fila = db
      .prepare(
        "SELECT title, summary, image FROM events WHERE id = ? AND status = 'published' AND pending = 0",
      )
      .get(Number(evento[1]));
    if (!fila) return null;
    return { titulo: fila.title, descripcion: fila.summary, imagen: fila.image };
  }

  return null;
}

/**
 * Reescribe la vista previa de la plantilla para esta ruta. Si la ruta no es
 * una nota ni una causa, devuelve la plantilla tal cual.
 */
export function conVistaPrevia(db, plantilla, ruta, origen) {
  const dato = contenidoDe(db, ruta);
  if (!dato) return plantilla;

  const titulo = escapar(dato.titulo);
  const descripcion = escapar(dato.descripcion || "Peronismo Geselino · Villa Gesell");
  // Con video, la miniatura del video; si no, la foto de la nota; si no hay
  // ninguna, queda la placa genérica de la app.
  const id = youtubeId(dato.video);
  const imagen = id
    ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    : imagenAbsoluta(dato.imagen, origen) || `${origen}/peronismogeselino/images/og.jpg`;
  const url = `${origen}${ruta}`;

  return plantilla
    .replace(/<title>[^<]*<\/title>/, `<title>${titulo} — Peronismo Geselino</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${titulo}$2`)
    .replace(/(<meta property="og:description"\s+content=")[^"]*(")/, `$1${descripcion}$2`)
    .replace(/(<meta\s+property="og:description"[^>]*content=")[^"]*(")/, `$1${descripcion}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${escapar(url)}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${escapar(imagen)}$2`)
    .replace(/(<meta property="og:image:alt" content=")[^"]*(")/, `$1${titulo}$2`)
    // El ancho y alto declarados son los de la placa genérica; para una foto
    // de nota no se conocen y mentirlos deforma la tarjeta.
    .replace(/\s*<meta property="og:image:width" content="[^"]*" \/>/, "")
    .replace(/\s*<meta property="og:image:height" content="[^"]*" \/>/, "");
}
