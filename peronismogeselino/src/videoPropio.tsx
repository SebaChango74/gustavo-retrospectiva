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

    // Antes de mandar un archivo pesado, comprobamos la sesión con un pedido
    // chico. El servidor valida los permisos antes de leer el cuerpo, así que
    // sin sesión cortaría la subida a la mitad y el navegador solo diría
    // "Failed to fetch", sin explicar nada y habiendo gastado los datos.
    setSubiendo(true);
    try {
      await api.get("/admin/media");
    } catch {
      setSubiendo(false);
      if (input.current) input.current.value = "";
      setError(
        "Tu sesión venció o no tenés permisos para subir. Volvé a entrar al panel y probá de nuevo.",
      );
      return;
    }

    try {
      // Leemos el archivo a memoria antes de enviarlo. Si el teléfono entrega
      // el video a través de un proveedor que después lo suelta (pasa al
      // elegirlo desde ciertas apps), el envío se cortaría a mitad y el
      // navegador solo diría "Failed to fetch". Así el problema se detecta acá
      // y se puede explicar. De paso aseguramos el tipo: algunos archivos
      // llegan sin él y el servidor los rechazaría.
      let datos: ArrayBuffer;
      try {
        datos = await file.arrayBuffer();
      } catch {
        setSubiendo(false);
        if (input.current) input.current.value = "";
        setError(
          "No se pudo leer el video desde el teléfono. Probá elegirlo de nuevo, o guardalo primero en la galería y volvé a intentar.",
        );
        return;
      }
      const tipo = /^video\//.test(file.type) ? file.type : "video/mp4";
      const blob = new Blob([datos], { type: tipo });

      const { url } = await api.upload<{ url: string }>("/admin/media/video", blob);
      onChange(url);
    } catch (e: any) {
      const msg = String(e?.message || "");
      const mb = Math.round((file.size / 1024 / 1024) * 10) / 10;
      const detalle = `(${mb} MB · ${file.type || "sin tipo"})`;
      setError(
        /failed to fetch|network|load failed|conexi/i.test(msg)
          ? `Se cortó la conexión al subir el video ${detalle}. Probá con mejor señal, o con un video más corto. Si sigue, mostrame este mensaje.`
          : `${msg || "No se pudo subir el video."} ${detalle}`,
      );
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
