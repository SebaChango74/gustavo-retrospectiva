// Utilidades de imagen compartidas por el selector de una foto y el de galería.
// Achican la foto en el teléfono antes de subir (una foto de cámara pesa varios
// megas y no hace falta) y, si el navegador sabe, ubican la cara para encuadrar.

const LADO_MAX = 1600;
const CALIDAD = 0.82;
/** WhatsApp no muestra vistas previas de imágenes más pesadas que esto. */
const TOPE_PREVIA_BYTES = 600 * 1024;

/** ¿La imagen tiene algún píxel no del todo opaco? Se muestrea en una grilla
 *  chica: alcanza para distinguir un logo con fondo transparente de una foto. */
function tieneTransparencia(ctx: CanvasRenderingContext2D, ancho: number, alto: number): boolean {
  const pasos = 32;
  for (let i = 0; i <= pasos; i++) {
    for (let j = 0; j <= pasos; j++) {
      const x = Math.min(ancho - 1, Math.round((i / pasos) * ancho));
      const y = Math.min(alto - 1, Math.round((j / pasos) * alto));
      if (ctx.getImageData(x, y, 1, 1).data[3] < 250) return true;
    }
  }
  return false;
}

/** Achica y comprime la foto. Si algo falla, devuelve el original: el servidor
 *  igual valida que sea imagen. Vale más una foto pesada que ninguna. */
export async function achicarImagen(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);
    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    // Una foto guardada como PNG pesa varios megas y no la muestran en las
    // vistas previas de WhatsApp. Solo se mantiene PNG si de verdad tiene
    // partes transparentes (un logo, una placa); una foto va siempre a JPG.
    const tipo =
      file.type === "image/png" && tieneTransparencia(ctx, ancho, alto) ? "image/png" : "image/jpeg";
    bitmap.close?.();

    const salida = async (calidad: number) =>
      new Promise<Blob | null>((r) => lienzo.toBlob(r, tipo, calidad));

    let blob = await salida(CALIDAD);
    if (tipo === "image/jpeg") {
      for (const calidad of [0.72, 0.6, 0.5]) {
        if (blob && blob.size <= TOPE_PREVIA_BYTES) break;
        blob = await salida(calidad);
      }
    }
    return blob && blob.size > 0 ? blob : file;
  } catch {
    return file;
  }
}

/**
 * Busca la cara más grande de la foto, si el navegador sabe hacerlo (Chrome en
 * Android sabe; otros no). Devuelve el centro de la cara en porcentajes, o null.
 */
export async function buscarCara(blob: Blob): Promise<{ x: number; y: number } | null> {
  const Detector = (window as any).FaceDetector;
  if (!Detector) return null;
  try {
    const bitmap = await createImageBitmap(blob);
    const caras = await new Detector({ fastMode: true }).detect(bitmap);
    if (!caras.length) return null;
    const caja = caras
      .map((c: any) => c.boundingBox)
      .sort((a: any, b: any) => b.width * b.height - a.width * a.height)[0];
    const punto = {
      x: Math.round(((caja.x + caja.width / 2) / bitmap.width) * 100),
      y: Math.round(((caja.y + caja.height / 2) / bitmap.height) * 100),
    };
    bitmap.close?.();
    return punto;
  } catch {
    return null;
  }
}
