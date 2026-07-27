import crypto from "node:crypto";

/**
 * Segundo factor: el código de seis dígitos que cambia cada treinta segundos.
 *
 * Es el estándar TOTP (RFC 6238), el mismo que usan Google Authenticator,
 * Authy o el llavero del iPhone. Se calcula en el teléfono y en el servidor
 * por separado, sin que viaje nada entre los dos: no hace falta ningún
 * servicio externo ni pagar nada, y funciona sin señal.
 */

const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PASO_SEGUNDOS = 30;
const DIGITOS = 6;
/** Se aceptan el código anterior y el siguiente: los relojes no van iguales. */
const VENTANA = 1;

function base32Codificar(buffer) {
  let bits = 0;
  let valor = 0;
  let salida = "";
  for (const byte of buffer) {
    valor = (valor << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      salida += ALFABETO[(valor >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) salida += ALFABETO[(valor << (5 - bits)) & 31];
  return salida;
}

function base32Decodificar(texto) {
  const limpio = String(texto).toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let valor = 0;
  const bytes = [];
  for (const caracter of limpio) {
    valor = (valor << 5) | ALFABETO.indexOf(caracter);
    bits += 5;
    if (bits >= 8) {
      bytes.push((valor >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** Secreto nuevo: 20 bytes, lo que recomienda el estándar. */
export function generarSecreto() {
  return base32Codificar(crypto.randomBytes(20));
}

function codigoEn(secreto, contador) {
  const clave = base32Decodificar(secreto);
  const bloque = Buffer.alloc(8);
  bloque.writeBigUInt64BE(BigInt(contador));
  const hmac = crypto.createHmac("sha1", clave).update(bloque).digest();
  const desplazamiento = hmac[hmac.length - 1] & 0x0f;
  const numero =
    ((hmac[desplazamiento] & 0x7f) << 24) |
    (hmac[desplazamiento + 1] << 16) |
    (hmac[desplazamiento + 2] << 8) |
    hmac[desplazamiento + 3];
  return String(numero % 10 ** DIGITOS).padStart(DIGITOS, "0");
}

/** Solo para pruebas y para mostrar el código actual al activarlo. */
export function codigoActual(secreto, ahora = Date.now()) {
  return codigoEn(secreto, Math.floor(ahora / 1000 / PASO_SEGUNDOS));
}

/** Comparación en tiempo constante, contra la ventana de tolerancia. */
export function codigoValido(secreto, codigo, ahora = Date.now()) {
  const limpio = String(codigo ?? "").replace(/\D/g, "");
  if (limpio.length !== DIGITOS) return false;
  const contador = Math.floor(ahora / 1000 / PASO_SEGUNDOS);
  let vale = false;
  for (let d = -VENTANA; d <= VENTANA; d += 1) {
    const esperado = codigoEn(secreto, contador + d);
    // Sin cortar el bucle: que el tiempo de respuesta no delate cuál acertó.
    if (crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(limpio))) vale = true;
  }
  return vale;
}

/**
 * La dirección que entiende cualquier aplicación de códigos. En el teléfono
 * se toca y la app la importa sola; en la computadora se copia el secreto.
 */
export function direccionOtpauth(secreto, quien) {
  const etiqueta = encodeURIComponent(`Peronismo Geselino:${quien}`);
  const emisor = encodeURIComponent("Peronismo Geselino");
  return `otpauth://totp/${etiqueta}?secret=${secreto}&issuer=${emisor}&digits=${DIGITOS}&period=${PASO_SEGUNDOS}`;
}

/** El secreto, en grupos de cuatro, para poder dictarlo o tipearlo sin error. */
export function secretoLegible(secreto) {
  return (secreto.match(/.{1,4}/g) ?? []).join(" ");
}

// ─── Códigos de recuperación ────────────────────────────────────────────────
// Si se pierde el teléfono, sin estos códigos no hay forma de volver a entrar.

const CANTIDAD_RESPALDO = 8;

export function generarCodigosRespaldo() {
  const codigos = [];
  for (let i = 0; i < CANTIDAD_RESPALDO; i += 1) {
    const crudo = base32Codificar(crypto.randomBytes(7)).slice(0, 10);
    codigos.push(`${crudo.slice(0, 5)}-${crudo.slice(5)}`);
  }
  return codigos;
}

/** Son cadenas al azar de mucha entropía: alcanza con SHA-256, igual que las
 *  llaves de sesión. No son contraseñas elegidas por una persona. */
export function huellaRespaldo(codigo) {
  return crypto
    .createHash("sha256")
    .update(String(codigo).toUpperCase().replace(/[^A-Z0-9]/g, ""))
    .digest("hex");
}
