import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { conEncuadre, fotoPosicion, fotoSrc } from "../foto";
import { achicarImagen, buscarCara } from "../imagenes";

/** Las fotos que ya vinieron cargadas con el sitio. */
const INCLUIDAS = [
  "/peronismogeselino/images/hero-gustavo-v2.png",
  "/peronismogeselino/images/gestion-obras.jpg",
  "/peronismogeselino/images/comunidad-grupo.jpg",
  "/peronismogeselino/images/gustavo-infancias.jpg",
  "/peronismogeselino/images/gustavo-abrazo.jpg",
  "/peronismogeselino/images/gustavo-ninez.jpg",
  "/peronismogeselino/images/hero-mar.jpg",
  "/peronismogeselino/images/peronometro-peron.png",
];

/**
 * Elegir una foto: la galería de las que ya están, más un botón para subir
 * una nueva desde el teléfono. Reemplaza al viejo desplegable, que solo
 * dejaba elegir entre las ocho de fábrica.
 */
export function ImagePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [subidas, setSubidas] = useState<{ url: string; nombre: string }[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const cargar = () => {
    api
      .get<{ items: { url: string; nombre: string }[] }>("/admin/media")
      .then((d) => setSubidas(d.items))
      .catch(() => {});
  };
  useEffect(cargar, []);

  const subir = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError("");
    setSubiendo(true);
    try {
      for (const file of Array.from(files)) {
        const blob = await achicarImagen(file);
        const { url } = await api.upload<{ url: string }>("/admin/media", blob);
        // Si el navegador encuentra una cara, el recorte apunta ahí solo.
        // Si no, queda el encuadre a mano de acá abajo.
        const cara = await buscarCara(blob);
        onChange(cara ? conEncuadre(url, cara.x, cara.y) : url);
      }
      cargar();
    } catch (e: any) {
      setError(e?.message || "No se pudo subir la foto.");
    } finally {
      setSubiendo(false);
      if (input.current) input.current.value = "";
    }
  };

  const galeria = [...subidas.map((s) => s.url), ...INCLUIDAS];

  return (
    <div className="panel-field wide img-picker">
      <span>Imagen</span>

      <div className="img-picker-grid">
        <button
          type="button"
          className={`img-opcion img-ninguna${value ? "" : " sel"}`}
          onClick={() => onChange("")}
        >
          Sin imagen
        </button>

        {galeria.map((url) => (
          <button
            type="button"
            key={url}
            className={`img-opcion${fotoSrc(value) === url ? " sel" : ""}`}
            onClick={() => onChange(url)}
            title={url.split("/").pop()}
          >
            <img src={url} alt="" loading="lazy" />
          </button>
        ))}

        <button
          type="button"
          className="img-opcion img-subir"
          onClick={() => input.current?.click()}
          disabled={subiendo}
        >
          {subiendo ? "Subiendo…" : "+ Subir foto"}
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
      <small>Sacá una foto o elegí una del teléfono. Se achica sola antes de subir.</small>

      {value && <Encuadre value={value} onChange={onChange} />}
    </div>
  );
}

/**
 * El encuadre: se toca la parte importante de la foto (la cara) y las
 * tarjetas recortan alrededor de ese punto. A la derecha se ve el resultado
 * en vivo, con la misma forma que la tarjeta del portal.
 */
function Encuadre({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const elegir = (e: React.MouseEvent<HTMLImageElement>) => {
    const caja = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - caja.left) / caja.width) * 100;
    const y = ((e.clientY - caja.top) / caja.height) * 100;
    onChange(conEncuadre(value, x, y));
  };

  const posicion = fotoPosicion(value);
  const [px, py] = posicion.split(" ").map((v) => parseFloat(v));

  return (
    <div className="encuadre">
      <span className="encuadre-titulo">Encuadre</span>
      <div className="encuadre-cuerpo">
        <div className="encuadre-completa">
          <img src={fotoSrc(value)} alt="" onClick={elegir} />
          <span
            className="encuadre-punto"
            style={{ left: `${px}%`, top: `${py}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="encuadre-muestra">
          <img src={fotoSrc(value)} alt="" style={{ objectPosition: posicion }} />
          <small>Así se ve en la tarjeta</small>
        </div>
      </div>
      <small>Tocá la cara (o lo importante) en la foto grande: el recorte la sigue.</small>
    </div>
  );
}
