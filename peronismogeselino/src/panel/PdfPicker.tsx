import { useRef, useState } from "react";
import { api } from "../api";

/**
 * Adjuntar un PDF (una guía, un folleto) a una nota o una causa. Se sube tal
 * cual —no se puede achicar sin perder páginas— con un tope de 25 MB.
 */
export function PdfPicker({
  value,
  name,
  onChange,
}: {
  value: string;
  name: string;
  onChange: (url: string, nombre: string) => void;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const subir = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError("");
    if (file.type !== "application/pdf") {
      setError("Tiene que ser un archivo PDF.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("El PDF supera los 25 MB. Probá comprimirlo antes de subirlo.");
      return;
    }
    setSubiendo(true);
    try {
      const { url } = await api.upload<{ url: string }>("/admin/media/pdf", file);
      onChange(url, file.name);
    } catch (e: any) {
      setError(e?.message || "No se pudo subir el PDF.");
    } finally {
      setSubiendo(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="panel-field wide pdf-picker">
      <span>PDF para descargar (opcional)</span>

      {value ? (
        <div className="pdf-actual">
          <span className="pdf-icono" aria-hidden="true">
            PDF
          </span>
          <div className="pdf-datos">
            <strong>{name || "Documento.pdf"}</strong>
            <a href={value} target="_blank" rel="noreferrer">
              Ver el archivo
            </a>
          </div>
          <button type="button" className="pdf-quitar" onClick={() => onChange("", "")}>
            Quitar
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="pdf-subir"
          onClick={() => input.current?.click()}
          disabled={subiendo}
        >
          {subiendo ? "Subiendo…" : "+ Subir un PDF"}
        </button>
      )}

      <input ref={input} type="file" accept="application/pdf" hidden onChange={(e) => subir(e.target.files)} />
      {error && <small className="img-picker-error">{error}</small>}
      <small>Quien lea la nota va a poder descargarlo. Hasta 25 MB.</small>
    </div>
  );
}
