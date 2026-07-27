import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  cancelarInstalacion,
  escucharInstalador,
  hayInstalador,
  instalacionPedida,
  instalar,
  pedirInstalacion,
  plataforma,
  yaInstalada,
} from "./install";
import { InstalarHoja } from "./InstalarHoja";

const RECORDADO = "pg-aviso-instalar";
/** Si alguien lo cierra, no se lo volvemos a poner por dos semanas. */
const DIAS_SILENCIO = 14;

function silenciado(): boolean {
  try {
    return Date.now() < Number(window.localStorage.getItem(RECORDADO) || 0);
  } catch {
    return false;
  }
}

function silenciar() {
  try {
    window.localStorage.setItem(RECORDADO, String(Date.now() + DIAS_SILENCIO * 86400_000));
  } catch {
    /* modo privado: se muestra igual la próxima vez */
  }
}

/**
 * Franja para bajar la app, sobre el portal.
 *
 * No manda a ninguna página: el «cómo instalar» se abre acá encima. Antes era
 * una pantalla aparte y terminaba siendo un círculo — la persona la cerraba
 * para ver el portal y el portal se la volvía a ofrecer.
 */
export function AvisoInstalar() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [visible, setVisible] = useState(false);

  // Quien llega desde el enlace corto de descarga viene a eso: se le abre
  // directo, sin esperas. La intención se guarda fuera del estado de React
  // porque limpiar la dirección remonta el componente.
  const [hoja, setHoja] = useState(() => {
    if (params.get("instalar") === "1" && !yaInstalada()) pedirInstalacion();
    return instalacionPedida();
  });

  const cerrarHoja = () => {
    cancelarInstalacion();
    setHoja(false);
  };

  useEffect(() => {
    if (params.get("instalar") !== "1") return;
    // Se saca de la dirección para que recargar no la vuelva a abrir.
    const limpio = new URLSearchParams(params);
    limpio.delete("instalar");
    setParams(limpio, { replace: true });
  }, [params, setParams]);

  useEffect(() => {
    if (yaInstalada() || silenciado()) return;

    // En la primera visita también aparece el emergente de Perón 365. Dos
    // cosas pidiendo atención a la vez es una sola cosa ignorada, y encima se
    // tapan. La franja espera a que la pantalla esté libre.
    const libre = () => !document.querySelector('[role="dialog"]');
    let reloj = 0;
    const revisar = () => {
      if (libre()) setVisible(true);
      else reloj = window.setTimeout(revisar, 700);
    };
    reloj = window.setTimeout(revisar, 2600);

    const dejar = escucharInstalador(() => {
      if (yaInstalada()) {
        setVisible(false);
        cancelarInstalacion();
        setHoja(false);
      }
    });
    return () => {
      window.clearTimeout(reloj);
      dejar();
    };
  }, []);

  const enPanel = location.pathname.startsWith("/panel");

  return (
    <>
      {hoja && !enPanel && <InstalarHoja onCerrar={cerrarHoja} />}

      {visible && !enPanel && !hoja && (
        <aside className="aviso-instalar" role="complementary" aria-label="Instalar la aplicación">
          <img src="/peronismogeselino/icon-192.png" alt="" aria-hidden="true" />
          <div className="aviso-instalar-texto">
            <strong>Peronismo Geselino</strong>
            <span>
              {plataforma() === "escritorio"
                ? "Tenela también en el teléfono."
                : "Tenela con su ícono."}
            </span>
          </div>
          <button
            className="aviso-instalar-si"
            onClick={async () => {
              // Si el navegador puede instalar, se instala acá mismo. Si no,
              // se abre el cómo, encima del portal.
              if (hayInstalador()) {
                setVisible(false);
                if (await instalar()) return;
                setVisible(true);
                return;
              }
              pedirInstalacion();
              setHoja(true);
            }}
          >
            INSTALAR
          </button>
          <button
            className="aviso-instalar-no"
            aria-label="Ahora no"
            onClick={() => {
              silenciar();
              setVisible(false);
            }}
          >
            ✕
          </button>
        </aside>
      )}
    </>
  );
}
