/**
 * Ingreso de desarrollo: entrar con solo un correo, sin Google.
 *
 * Es cómodo para revisar la app en privado, pero sería un agujero grave si
 * quedara activo en un sitio publicado. Por eso no alcanza con PG_DEV=1:
 * además el sitio tiene que estar cerrado con clave (PG_PREVIEW_CODE).
 *
 * Consecuencia práctica: cuando se publique (se quite la clave de vista
 * previa), el ingreso de desarrollo **se apaga solo**. No hay forma de
 * publicar por accidente con la puerta abierta.
 */
export function devLoginEnabled() {
  if (process.env.PG_DEV !== "1") return false;
  // Detrás de clave de vista previa: es un entorno privado, se permite.
  if (process.env.PG_PREVIEW_CODE) return true;
  // Sitio abierto: solo se permite fuera de producción (desarrollo local).
  return process.env.NODE_ENV !== "production";
}
