/**
 * Normalización de números de WhatsApp argentinos.
 *
 * La gente escribe su número de mil maneras: "2255 45-6789", "02255 15 456789",
 * "+54 9 2255 456789", "1122334455". Todas tienen que llegar al mismo dato
 * guardado, porque el número es la identidad de la persona en la app.
 *
 * Formato interno: "54" + 10 dígitos (código de área + abonado, sin 0 ni 15).
 */

const CODIGO_PAIS = "54";

/** Largos posibles de código de área en Argentina: 2 (11), 3 y 4 dígitos. */
const LARGOS_AREA = [2, 3, 4];

function soloDigitos(texto) {
  return String(texto ?? "").replace(/\D+/g, "");
}

/**
 * Devuelve el número normalizado ("5492255456789") o "" si no es válido.
 * No inventa: si no logra dejar 10 dígitos de área + abonado, rechaza.
 */
export function normalizarWhatsapp(entrada) {
  let d = soloDigitos(entrada);
  if (!d) return "";

  // Prefijo internacional escrito como 00.
  if (d.startsWith("00")) d = d.slice(2);
  // Código de país. Solo si sobra largo: ningún código de área empieza en 54.
  if (d.length >= 12 && d.startsWith(CODIGO_PAIS)) d = d.slice(2);
  // El 9 que Argentina usa para móviles en formato internacional.
  if (d.length === 11 && d.startsWith("9")) d = d.slice(1);
  // El 0 de larga distancia nacional. Ningún código de área empieza en 0.
  if (d.startsWith("0")) d = d.slice(1);

  // El 15 de celular, que va después del código de área.
  if (d.length === 12) {
    for (const largo of LARGOS_AREA) {
      if (d.slice(largo, largo + 2) === "15") {
        const sin15 = d.slice(0, largo) + d.slice(largo + 2);
        if (sin15.length === 10) return CODIGO_PAIS + sin15;
      }
    }
  }

  if (d.length !== 10) return "";
  // Un número que arranca en 0 no es un código de área válido.
  if (d.startsWith("0")) return "";
  return CODIGO_PAIS + d;
}

/** Cómo se le muestra a la persona: "+54 2255 456789". */
export function mostrarWhatsapp(normalizado) {
  const d = soloDigitos(normalizado);
  if (d.length !== 12) return normalizado || "";
  const nacional = d.slice(2);
  // El área de CABA/GBA tiene 2 dígitos; el resto que mostramos como 4 es la
  // forma habitual en la costa (2255, 2254...).
  const largo = nacional.startsWith("11") ? 2 : 4;
  return `+54 ${nacional.slice(0, largo)} ${nacional.slice(largo)}`;
}

/** Enlace para escribirle por WhatsApp desde el panel. */
export function enlaceWhatsapp(normalizado) {
  const d = soloDigitos(normalizado);
  if (d.length !== 12) return "";
  // wa.me pide el 9 de móvil argentino.
  return `https://wa.me/549${d.slice(2)}`;
}
