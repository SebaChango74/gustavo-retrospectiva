import { useRef, useState } from "react";
import { api } from "../api";
import { fotoSrc } from "../foto";
import { achicarImagen } from "../imagenes";

/**
 * Galería de fotos para una noticia: se suben varias imágenes, se reordenan y
 * se borran. Cada foto se achica en el teléfono antes de subir (mismo criterio
 * que el selector de una sola foto). El valor es la lista de direcciones.
 */
export function GalleryPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const fotos = Array.isArray(value) ? value : [];
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const subir = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError("");
    setSubiendo(true);
    const nuevas: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const blob = await achicarImagen(file);
        const { url } = await api.upload<{ url: string }>("/admin/media", blob);
        nuevas.push(url);
      }
      onChange([...fotos, ...nuevas]);
    } catch (e: any) {
      setError(e?.message || "No se pudo subir alguna foto.");
    } finally {
      setSubiendo(false);
      if (input.current) input.current.value = "";
    }
  };

  const quitar = (i: number) => onChange(fotos.filter((_, k) => k !== i));
  const mover = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= fotos.length) return;
    const copia = [...fotos];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    onChange(copia);
  };

  return (
    <div className="panel-field wide galeria-picker">
      <span>Galería de fotos</span>

      <div className="galeria-grid">
        {fotos.map((url, i) => (
          <div className="galeria-item" key={`${url}-${i}`}>
            <img src={fotoSrc(url)} alt="" loading="lazy" />
            <div className="galeria-orden">
              <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} title="Mover antes">
                ◀
              </button>
              <span>{i + 1}</span>
              <button
                type="button"
                onClick={() => mover(i, 1)}
                disabled={i === fotos.length - 1}
                title="Mover después"
              >
                ▶
              </button>
            </div>
            <button type="button" className="galeria-quitar" onClick={() => quitar(i)} title="Quitar">
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          className="galeria-item galeria-subir"
          onClick={() => input.current?.click()}
          disabled={subiendo}
        >
          {subiendo ? "Subiendo…" : "+ Agregar fotos"}
        </button>
      </div>

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => subir(e.target.files)}
      />

      {error && <small className="img-picker-error">{error}</small>}
      <small>Se pueden subir varias juntas. Se achican solas antes de subir. Arrastrá con ◀ ▶ para ordenar.</small>
    </div>
  );
}
