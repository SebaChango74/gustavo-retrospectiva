import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  escucharInstalador,
  hayInstalador,
  instalar,
  marcarInstalarVista,
  navegadorIncrustado,
  plataforma,
  yaInstalada,
} from "../install";

const IMG = "/peronismogeselino/images";

/**
 * Pantalla de instalación. La idea es que nadie tenga que "entrar a una web":
 * se toca un botón y el teléfono instala la app, con su ícono y su pantalla
 * completa. En Android eso es literal; en iPhone hay que mostrar los tres
 * pasos porque Safari no permite hacerlo por botón.
 */
export default function Instalar() {
  const navigate = useNavigate();
  const [listo, setListo] = useState(hayInstalador());
  const [instalada, setInstalada] = useState(yaInstalada());
  const [instalando, setInstalando] = useState(false);
  const [rechazada, setRechazada] = useState(false);

  const donde = plataforma();
  const incrustado = navegadorIncrustado();

  // Quien llega hasta acá ya recibió el ofrecimiento: la franja del portal no
  // tiene que volver a hacérselo durante esta visita.
  useEffect(marcarInstalarVista, []);

  useEffect(() => escucharInstalador(() => {
    setListo(hayInstalador());
    setInstalada(yaInstalada());
  }), []);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const alCambiar = () => setInstalada(yaInstalada());
    media.addEventListener("change", alCambiar);
    return () => media.removeEventListener("change", alCambiar);
  }, []);

  const tocar = async () => {
    setInstalando(true);
    setRechazada(false);
    const aceptada = await instalar();
    setInstalando(false);
    if (!aceptada) setRechazada(true);
  };

  return (
    <div className="instalar">
      <section className="instalar-hero">
        <div className="instalar-hero-copy">
          <span className="eyebrow light">PERONISMO GESELINO</span>
          <h1>LLEVALA EN EL TELÉFONO.</h1>
          <p>
            Se instala en diez segundos y queda con su ícono en la pantalla, como
            cualquier otra aplicación. No ocupa lugar y no pasa por ninguna tienda.
          </p>

          {instalada ? (
            <div className="instalar-hecho">
              <strong>Ya la tenés instalada</strong>
              <p>Buscá el ícono de Peronismo Geselino en la pantalla del teléfono.</p>
              <button className="button button-cobalt" onClick={() => navigate("/")}>
                ABRIR LA APP
              </button>
            </div>
          ) : incrustado ? (
            <PasosIncrustado />
          ) : donde === "ios" ? (
            <PasosIphone />
          ) : listo ? (
            <div className="instalar-accion">
              <button className="button button-cobalt grande" onClick={tocar} disabled={instalando}>
                {instalando ? "INSTALANDO…" : "INSTALAR LA APP"}
              </button>
              {rechazada && (
                <p className="instalar-reintento">
                  No se completó la instalación. Podés volver a tocar el botón cuando quieras.
                </p>
              )}
            </div>
          ) : donde === "android" ? (
            <PasosAndroid />
          ) : (
            <PasosEscritorio />
          )}
        </div>

        <div className="instalar-hero-figura" aria-hidden="true">
          <div className="instalar-telefono">
            <div className="instalar-pantalla">
              <img src={`${IMG}/hero-gustavo-v2.png`} alt="" />
              <div className="instalar-icono">
                <img src="/peronismogeselino/icon-192.png" alt="" />
                <span>P. Geselino</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="instalar-ventajas">
        <article>
          <h2>PANTALLA COMPLETA</h2>
          <p>Abre sin barra de navegador. Se ve y se usa como una aplicación.</p>
        </article>
        <article>
          <h2>SIN SEÑAL TAMBIÉN</h2>
          <p>
            Lo que ya viste queda disponible. La comunidad y el panel siempre piden
            conexión: donde se decide, no mostramos datos viejos.
          </p>
        </article>
        <article>
          <h2>SIN TIENDA</h2>
          <p>No hay descarga ni actualizaciones que aprobar. Siempre está la última versión.</p>
        </article>
      </section>

      <section className="instalar-cierre">
        <p>¿Preferís mirarla antes de instalarla?</p>
        <button className="button button-outline" onClick={() => navigate("/")}>
          VER EL PORTAL
        </button>
      </section>
    </div>
  );
}

function PasosIphone() {
  return (
    <ol className="instalar-pasos">
      <li>
        <span className="instalar-num">1</span>
        <div>
          <b>Tocá el botón de compartir</b>
          <small>El cuadradito con la flecha para arriba, abajo de todo en Safari.</small>
        </div>
      </li>
      <li>
        <span className="instalar-num">2</span>
        <div>
          <b>Buscá «Agregar a inicio»</b>
          <small>Está más abajo en la lista. Puede decir «Agregar a pantalla de inicio».</small>
        </div>
      </li>
      <li>
        <span className="instalar-num">3</span>
        <div>
          <b>Agregar</b>
          <small>Listo: el ícono queda en la pantalla del teléfono.</small>
        </div>
      </li>
      <li className="instalar-aviso">
        <div>
          <b>Tiene que ser Safari</b>
          <small>En el iPhone, Chrome no puede instalar aplicaciones. Es una limitación de Apple.</small>
        </div>
      </li>
    </ol>
  );
}

function PasosAndroid() {
  return (
    <ol className="instalar-pasos">
      <li>
        <span className="instalar-num">1</span>
        <div>
          <b>Tocá los tres puntitos</b>
          <small>Arriba a la derecha, en Chrome.</small>
        </div>
      </li>
      <li>
        <span className="instalar-num">2</span>
        <div>
          <b>Elegí «Instalar aplicación»</b>
          <small>También puede decir «Agregar a pantalla principal».</small>
        </div>
      </li>
      <li>
        <span className="instalar-num">3</span>
        <div>
          <b>Instalar</b>
          <small>El ícono queda en la pantalla del teléfono.</small>
        </div>
      </li>
    </ol>
  );
}

function PasosEscritorio() {
  return (
    <ol className="instalar-pasos">
      <li>
        <span className="instalar-num">1</span>
        <div>
          <b>Mirá la barra de direcciones</b>
          <small>A la derecha aparece un ícono de instalar, una pantallita con una flecha.</small>
        </div>
      </li>
      <li>
        <span className="instalar-num">2</span>
        <div>
          <b>Instalar</b>
          <small>Queda como programa, con su propia ventana. Funciona en Chrome y en Edge.</small>
        </div>
      </li>
    </ol>
  );
}

function PasosIncrustado() {
  return (
    <ol className="instalar-pasos">
      <li className="instalar-aviso">
        <div>
          <b>Abrila en el navegador del teléfono</b>
          <small>
            Estás viéndola dentro de otra aplicación y desde acá no se puede instalar. Tocá los tres
            puntitos y elegí «Abrir en Chrome» o «Abrir en Safari». Después volvé a esta página.
          </small>
        </div>
      </li>
    </ol>
  );
}
