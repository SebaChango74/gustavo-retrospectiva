import { useRef, useState } from "react";
import { api } from "./api";

/**
 * Video propio, subido al servidor y reproducido dentro de la app, sin pasar
 * por YouTube. El navegador lo pide por tramos (Range), así que se puede
 * adelantar y retroceder sin descargarlo entero.
 */
export function VideoPropio({ src, titulo }: { src?: string | null; titulo?: string }) {
  if (!src) return null;
  return (
    <div className="video-propio">
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload"
        title={titulo || "Video"}
      />
    </div>
  );
}

/** Peso máximo aceptado por el servidor. */
const TOPE_BYTES = 50 * 1024 * 1024;

/**
 * Selector de video para el panel: sube el archivo y deja verlo antes de
 * guardar. No se puede comprimir en el teléfono como las fotos, así que acá
 * solo se controla el peso y se avisa con claridad si se pasa.
 */
export function VideoPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const subir = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError("");
    if (file.size > TOPE_BYTES) {
      const mb = Math.round(file.size / 1024 / 1024);
      setError(
        `El video pesa ${mb} MB y el máximo es 50 MB. Recortalo o grabá uno más corto (hasta un minuto aproximadamente).`,
      );
      if (input.current) input.current.value = "";
      return;
    }
    setSubiendo(true);
    try {
      const { url } = await api.upload<{ url: string }>("/admin/media/video", file);
      onChange(url);
    } catch (e: any) {
      setError(e?.message || "No se pudo subir el video.");
    } finally {
      setSubiendo(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="panel-field wide">
      <span>Video propio (se reproduce en la app)</span>

      {value ? (
        <div className="video-elegido">
          <video src={value} controls playsInline preload="metadata" />
          <button type="button" className="panel-link-btn" onClick={() => onChange("")}>
            ✕ Quitar video
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="panel-add-row"
          onClick={() => input.current?.click()}
          disabled={subiendo}
        >
          {subiendo ? "Subiendo video…" : "+ Subir video"}
        </button>
      )}

      <input
        ref={input}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        hidden
        onChange={(e) => subir(e.target.files)}
      />

      {error && <small className="img-picker-error">{error}</small>}
      <small>
        Hasta 50 MB (alrededor de un minuto de celular). Formatos: MP4, WebM o MOV; el MP4 es el
        que se ve bien en todos los teléfonos. Si cargás un video propio, reemplaza a la imagen.
      </small>
    </div>
  );
}
