import { useEffect, useState } from "react";
import { api } from "../api";

type Estado = { activo: boolean; respaldosSinUsar: number; disponible: boolean };

/**
 * Segundo factor de la cuenta propia. El WhatsApp y la clave son dos cosas
 * que se pueden perder juntas (un teléfono robado y desbloqueado las tiene
 * las dos). El código de seis dígitos que cambia cada treinta segundos no.
 */
export function Seguridad() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [secreto, setSecreto] = useState("");
  const [direccion, setDireccion] = useState("");
  const [codigo, setCodigo] = useState("");
  const [respaldos, setRespaldos] = useState<string[] | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cargar = () => {
    api
      .get<Estado>("/admin/segundo-factor")
      .then(setEstado)
      .catch((e) => setError(e.message));
  };
  useEffect(cargar, []);

  const preparar = async () => {
    setError("");
    setOk("");
    setOcupado(true);
    try {
      const d = await api.post<{ secreto: string; direccion: string }>(
        "/admin/segundo-factor/preparar",
      );
      setSecreto(d.secreto);
      setDireccion(d.direccion);
      setRespaldos(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const activar = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setOcupado(true);
    try {
      const d = await api.post<{ codigos: string[] }>("/admin/segundo-factor/activar", { codigo });
      setRespaldos(d.codigos);
      setSecreto("");
      setDireccion("");
      setCodigo("");
      setOk("Segundo factor activado. De ahora en más te va a pedir el código al entrar.");
      cargar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const desactivar = async () => {
    const clave = window.prompt("Para desactivar el segundo factor, escribí tu clave:");
    if (!clave) return;
    setError("");
    setOk("");
    try {
      await api.post("/admin/segundo-factor/desactivar", { clave });
      setOk("Segundo factor desactivado. Tu cuenta vuelve a entrar solo con la clave.");
      setRespaldos(null);
      cargar();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (!estado) return <section className="panel-module">Cargando…</section>;

  return (
    <section className="panel-module">
      <header className="panel-module-head">
        <div>
          <h2>Seguridad de tu cuenta</h2>
          <p>
            Un teléfono robado y desbloqueado tiene tu WhatsApp y, si la anotaste, tu clave. El
            código de seis dígitos que cambia cada treinta segundos no se puede robar así.
          </p>
        </div>
      </header>

      {error && <div className="panel-error">{error}</div>}
      {ok && <div className="panel-ok">{ok}</div>}

      {!estado.disponible ? (
        <div className="approvals-empty">
          <strong>No disponible</strong>
          <p>El segundo factor es para las cuentas de administración.</p>
        </div>
      ) : estado.activo ? (
        <div className="seg-activo">
          <div className="seg-estado">
            <span className="seg-punto" aria-hidden="true" />
            <div>
              <strong>Activado</strong>
              <small>
                Te quedan {estado.respaldosSinUsar} códigos de recuperación sin usar.
              </small>
            </div>
          </div>
          <div className="seg-acciones">
            <button className="button button-outline" onClick={preparar}>
              REHACER
            </button>
            <button className="button button-outline peligro" onClick={desactivar}>
              DESACTIVAR
            </button>
          </div>
          <p className="seg-nota">
            «Rehacer» sirve si cambiaste de teléfono: genera un secreto nuevo y códigos de
            recuperación nuevos. Hasta que confirmes con un código, sigue valiendo el actual.
          </p>
        </div>
      ) : !secreto ? (
        <div className="seg-arranque">
          <p>
            Vas a necesitar una aplicación de códigos en el teléfono. Sirve cualquiera:{" "}
            <strong>Google Authenticator</strong>, <strong>Authy</strong>, <strong>2FAS</strong> o
            el propio llavero del iPhone. Son gratis y funcionan sin señal.
          </p>
          <button className="button button-cobalt" onClick={preparar} disabled={ocupado}>
            ACTIVAR EL SEGUNDO FACTOR
          </button>
        </div>
      ) : null}

      {secreto && (
        <div className="seg-alta">
          <ol className="seg-pasos">
            <li>
              <span className="seg-num">1</span>
              <div>
                <b>Cargalo en la aplicación de códigos</b>
                <small>
                  Desde el teléfono, tocá el enlace y se importa solo. Desde la computadora, elegí
                  «Ingresar clave de configuración» y copiá el secreto.
                </small>
                <a className="seg-enlace" href={direccion}>
                  Abrir en la aplicación de códigos
                </a>
                <code className="seg-secreto">{secreto}</code>
              </div>
            </li>
            <li>
              <span className="seg-num">2</span>
              <div>
                <b>Confirmá con el código que te muestra</b>
                <small>
                  Seis dígitos. Si está por cambiar, esperá al siguiente y usá ese.
                </small>
                <form className="seg-confirmar" onSubmit={activar}>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="000000"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                  />
                  <button className="button button-cobalt" type="submit" disabled={ocupado}>
                    CONFIRMAR
                  </button>
                </form>
              </div>
            </li>
          </ol>
        </div>
      )}

      {respaldos && (
        <div className="seg-respaldos">
          <b>Códigos de recuperación</b>
          <p>
            Si perdés el teléfono, estos códigos son la única forma de volver a entrar. Cada uno
            sirve una sola vez. <strong>Guardalos ahora en un lugar seguro: no se muestran de
            nuevo.</strong>
          </p>
          <ul>
            {respaldos.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <button
            className="button button-outline"
            onClick={() => navigator.clipboard?.writeText(respaldos.join("\n"))}
          >
            COPIAR TODOS
          </button>
        </div>
      )}
    </section>
  );
}
