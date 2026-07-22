import { api } from "../api";
import { renderPeron365Card, type P365Day, P365_URL } from "./render";

export function permalinkFor(dayKey: string): string {
  return `${window.location.origin}/peronismogeselino/peron365/${dayKey}`;
}

export async function downloadPlate(day: P365Day, format: "feed" | "story") {
  const canvas = await renderPeron365Card(day, format);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `peron365-${day.dayKey}${format === "story" ? "-historia" : ""}.png`;
  link.click();
}

/** Comparte la placa como archivo; si no se puede, la descarga. Devuelve una
 *  nota para mostrar cuando cae al plan alternativo. */
export async function sharePlate(day: P365Day, format: "feed" | "story"): Promise<string> {
  const canvas = await renderPeron365Card(day, format);
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  api.post(`/peron365/days/${day.dayKey}/share-event`).catch(() => {});
  const text = `La frase de hoy en Perón 365:\n“${day.quote.text}”\n\n${permalinkFor(day.dayKey)}`;
  if (blob) {
    const file = new File([blob], `peron365-${day.dayKey}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text, title: "Perón 365" });
        return "";
      } catch {
        return "";
      }
    }
  }
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `peron365-${day.dayKey}.png`;
  link.click();
  try {
    await navigator.clipboard?.writeText(text);
    return "Placa descargada y texto copiado: pegalo en WhatsApp o Instagram.";
  } catch {
    return "Placa descargada: subila a WhatsApp o Instagram.";
  }
}

export function whatsappLink(day: P365Day): string {
  const text = `La frase de hoy en Perón 365:\n“${day.quote.text}”\n\n${permalinkFor(day.dayKey)} · ${P365_URL}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
