import { useEffect, useRef, useState } from "react";
import { youtubeId } from "./video";

// Publicaciones incrustadas en el cuerpo (YouTube, Instagram, Twitter/X).
//
// Usamos SOLO el iframe oficial de cada plataforma, sin cargar sus scripts de
// terceros: así la política de seguridad sigue permitiendo únicamente scripts
// propios. Lo único que se habilita es enmarcar (frame-src) esos dominios
// conocidos, igual que ya se hacía con YouTube.

export type Embed =
  | { kind: "youtube"; src: string }
  | { kind: "instagram"; src: string }
  | { kind: "twitter"; src: string };

/** Reconoce una URL de publicación y devuelve el iframe a usar, o null. */
export function detectarEmbed(url?: string | null): Embed | null {
  const u = String(url ?? "").trim();
  if (!u) return null;

  const yt = youtubeId(u);
  if (yt) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${yt}` };

  const ig = /instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i.exec(u);
  if (ig) return { kind: "instagram", src: `https://www.instagram.com/${ig[1].toLowerCase()}/${ig[2]}/embed` };

  const tw = /(?:twitter|x)\.com\/[^/]+\/status(?:es)?\/(\d+)/i.exec(u);
  if (tw) return { kind: "twitter", src: `https://platform.twitter.com/embed/Tweet.html?id=${tw[1]}&theme=light` };

  return null;
}

/** ¿La línea es solo una URL que sabemos incrustar? */
export function esLineaEmbed(linea: string): Embed | null {
  const t = linea.trim();
  if (/\s/.test(t)) return null; // debe ser una sola URL en su renglón
  return detectarEmbed(t);
}

// Busca recursivamente un "height" numérico razonable dentro del mensaje que
// postea el iframe (Instagram y Twitter avisan su alto real para no cortar el
// contenido). Como el formato cambia entre plataformas, lo buscamos genérico.
function buscarAltura(dato: any, prof = 0): number | null {
  if (!dato || prof > 4) return null;
  if (typeof dato === "number") return null;
  if (typeof dato === "object") {
    if (typeof dato.height === "number" && dato.height > 150 && dato.height < 4000) {
      return dato.height;
    }
    for (const clave of Object.keys(dato)) {
      const r = buscarAltura(dato[clave], prof + 1);
      if (r) return r;
    }
  }
  return null;
}

export function Publicacion({ url, titulo }: { url: string; titulo?: string }) {
  const info = detectarEmbed(url);
  const ref = useRef<HTMLIFrameElement>(null);
  const [alto, setAlto] = useState(info?.kind === "instagram" ? 700 : 560);

  useEffect(() => {
    if (!info || info.kind === "youtube") return;
    const origenOk = info.kind === "instagram" ? "instagram.com" : "twitter.com";
    function onMensaje(e: MessageEvent) {
      if (!e.origin.includes(origenOk)) return;
      // Enrutar el mensaje al iframe que lo emitió (puede haber varios).
      if (ref.current && e.source !== ref.current.contentWindow) return;
      let data: any = e.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      const h = buscarAltura(data);
      if (h) setAlto(Math.ceil(h));
    }
    window.addEventListener("message", onMensaje);
    return () => window.removeEventListener("message", onMensaje);
  }, [info?.kind, info?.src]);

  if (!info) return null;

  if (info.kind === "youtube") {
    return (
      <div className="embed embed-youtube">
        <iframe
          src={info.src}
          title={titulo || "Video de YouTube"}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <div className={`embed embed-${info.kind}`}>
      <iframe
        ref={ref}
        src={info.src}
        title={titulo || (info.kind === "instagram" ? "Publicación de Instagram" : "Publicación de X")}
        loading="lazy"
        style={{ height: alto }}
        scrolling="no"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
