import { useEffect, useState } from "react";
import { api } from "../api";
import { LockIcon } from "../ui";

type Paso = { titulo: string; texto: string };
type Modulo = {
  nombre: string;
  marca?: string;
  soloBuilder?: boolean;
  texto: string;
  detalle?: string;
};
type Parte = { nombre: string; texto: string };
type Aviso = { titulo: string; texto: string };
type Tabla = { columnas: string[]; filas: string[][] };

type Seccion = {
  tag: string;
  titulo: string;
  intro?: string;
  pasos?: Paso[];
  modulos?: Modulo[];
  partes?: Parte[];
  lista?: string[];
  tabla?: Tabla;
  aviso?: Aviso;
};

/**
 * Guía de uso para colaboradores. Está bajo candado: hace falta un WhatsApp
 * con acceso al panel y la contraseña compartida. El contenido lo entrega el
 * servidor, no viene dentro de la aplicación: si viniera, el candado sería
 * decorativo y cualquiera podría leerla sin abrirlo.
 */
export default function Guia() {
  const [secciones, setSecciones] = useState<Seccion[] | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .get<{ secciones: Seccion[] }>("/public/guia")
      .then((d) => setSecciones(d.secciones))
      .catch(() => setSecciones(null))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <div className="guia-cargando">Abriendo…</div>;
  if (!secciones) return <Candado onAbrir={setSecciones} />;

  return (
    <article className="guia">
      <header className="guia-portada">
        <span className="eyebrow light">Guía de uso · Peronismo Geselino</span>
        <h1>CÓMO SE USA.</h1>
        <p>
          Qué es cada parte, quién puede qué y cómo se maneja el portal. Escrita para quienes
          trabajan adentro.
        </p>
      </header>

      <nav className="guia-indice" aria-label="Contenido de la guía">
        {secciones.map((s, i) => (
          <a key={s.titulo} href={`#s${i}`}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            {s.titulo}
          </a>
        ))}
      </nav>

      {secciones.map((s, i) => (
        <section className="guia-seccion" id={`s${i}`} key={s.titulo}>
          <div className="guia-seccion-head">
            <span className="guia-tag">{s.tag}</span>
            <h2>{s.titulo}</h2>
            {s.intro && <p>{s.intro}</p>}
          </div>

          {s.pasos && (
            <ol className="guia-pasos">
              {s.pasos.map((p, n) => (
                <li key={p.titulo}>
                  <span className="guia-num">{n + 1}</span>
                  <div>
                    <b>{p.titulo}</b>
                    <small>{p.texto}</small>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {s.tabla && (
            <div className="guia-tabla-wrap">
              <table className="guia-tabla">
                <thead>
                  <tr>
                    {s.tabla.columnas.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.tabla.filas.map((fila) => (
                    <tr key={fila[0]}>
                      {fila.map((celda, n) => (
                        <td key={n}>{n === 0 ? <strong>{celda}</strong> : celda}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {s.modulos && (
            <div className="guia-modulos">
              {s.modulos.map((m) => (
                <div className="guia-modulo" key={m.nombre}>
                  <div className="guia-modulo-head">
                    <span className="guia-modulo-nombre">{m.nombre}</span>
                    {m.marca && (
                      <span className={`guia-marca${m.soloBuilder ? " limitada" : ""}`}>
                        {m.marca}
                      </span>
                    )}
                  </div>
                  <p>{m.texto}</p>
                  {m.detalle && <p className="guia-detalle">{m.detalle}</p>}
                </div>
              ))}
            </div>
          )}

          {s.partes && (
            <div className="guia-partes">
              {s.partes.map((p) => (
                <div key={p.nombre}>
                  <h3>{p.nombre}</h3>
                  <p>{p.texto}</p>
                </div>
              ))}
            </div>
          )}

          {s.lista && (
            <ul className="guia-lista">
              {s.lista.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}

          {s.aviso && (
            <div className="guia-aviso">
              <b>{s.aviso.titulo}</b>
              <p>{s.aviso.texto}</p>
            </div>
          )}
        </section>
      ))}

      <footer className="guia-pie">
        <p>
          Si algo de acá no coincide con lo que ves en pantalla, avisá: la guía se corrige, no se
          adivina.
        </p>
      </footer>
    </article>
  );
}

function Candado({ onAbrir }: { onAbrir: (secciones: Seccion[]) => void }) {
  const [whatsapp, setWhatsapp] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const abrir = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const d = await api.post<{ secciones: Seccion[] }>("/public/guia/abrir", {
        whatsapp,
        clave,
      });
      onAbrir(d.secciones);
    } catch (err: any) {
      setError(err.message || "No pudimos abrir la guía.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="guia-candado">
      <div className="guia-candado-caja">
        <LockIcon />
        <span className="eyebrow light">Guía de uso</span>
        <h1>ESTA PARTE ES PARA ADENTRO.</h1>
        <p>
          La guía explica cómo se maneja el portal. Para abrirla hace falta un WhatsApp con acceso
          al panel y la contraseña que te pasaron.
        </p>

        <form onSubmit={abrir} className="ingreso">
          <label className="ingreso-campo">
            <span>WhatsApp</span>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="2255 456789"
              autoComplete="tel"
              inputMode="tel"
              required
            />
          </label>
          <label className="ingreso-campo">
            <span>Contraseña</span>
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button className="button button-cobalt" type="submit" disabled={enviando}>
            {enviando ? "ABRIENDO…" : "ABRIR LA GUÍA"}
          </button>
        </form>

        {error && <div className="panel-error">{error}</div>}
      </div>
    </div>
  );
}
