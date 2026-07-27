/**
 * Instalación de la app en el teléfono.
 *
 * El navegador avisa una sola vez, muy temprano, que la app se puede
 * instalar. Si no se guarda ese aviso en ese momento, se pierde y ya no hay
 * forma de mostrar el botón de instalar. Por eso este módulo se importa
 * desde el arranque y no desde la pantalla.
 */

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let guardado: PromptEvent | null = null;
const oyentes = new Set<() => void>();

function avisar() {
  for (const oyente of oyentes) oyente();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    guardado = event as PromptEvent;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    guardado = null;
    avisar();
  });
}

export function hayInstalador(): boolean {
  return guardado !== null;
}

export function escucharInstalador(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

/** Abre el diálogo nativo. Devuelve true si la persona aceptó. */
export async function instalar(): Promise<boolean> {
  if (!guardado) return false;
  const evento = guardado;
  guardado = null;
  avisar();
  await evento.prompt();
  const { outcome } = await evento.userChoice;
  return outcome === "accepted";
}

/** Ya está instalada y abierta como aplicación. */
export function yaInstalada(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return (window.navigator as any).standalone === true;
}

export type Plataforma = "ios" | "android" | "escritorio";

export function plataforma(): Plataforma {
  if (typeof navigator === "undefined") return "escritorio";
  const ua = navigator.userAgent;
  // El iPad moderno se presenta como Mac; lo delata el soporte táctil.
  const esIOS =
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document);
  if (esIOS) return "ios";
  if (/Android/.test(ua)) return "android";
  return "escritorio";
}

/**
 * Los navegadores dentro de otras apps (Instagram, Facebook, el de WhatsApp)
 * no pueden instalar nada. Hay que decirlo, porque si no la persona toca el
 * botón, no pasa nada y abandona.
 */
export function navegadorIncrustado(): boolean {
  if (typeof navigator === "undefined") return false;
  return /FBAN|FBAV|Instagram|Line\/|MicroMessenger|\bGSA\b/.test(navigator.userAgent);
}
