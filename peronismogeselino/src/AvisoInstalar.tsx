import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { escucharInstalador, hayInstalador, plataforma, yaInstalada } from "./install";

const RECORDADO = "pg-aviso-instalar";
/** Si alguien lo cierra, no se lo volvemos a poner por dos semanas. */
const DIAS_SILENCIO = 14;

function silenciado(): boolean {
  try {
    const hasta = Number(window.localStorage.getItem(RECORDADO) || 0);
    return Date.now() < hasta;
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
 * Franja para bajar la app. Aparece sola en el portal público, una vez, y se
 * puede cerrar. Sin esto la página de instalación existe pero no la encuentra
 * nadie: hay que ofrecerla, no esconderla.
 */
export function AvisoInstalar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);

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
    // Un respiro antes de aparecer: que la persona vea el portal primero.
    reloj = window.setTimeout(revisar, 2600);

    const dejar = escucharInstalador(() => {
      if (yaInstalada()) setVisible(false);
    });
    return () => {
      window.clearTimeout(reloj);
      dejar();
    };
  }, []);

  // En la propia página de instalación sobra.
  if (!visible || location.pathname === "/instalar") return null;

  const donde = plataforma();
  const texto =
    donde === "escritorio" ? "Tenela también en el teléfono." : "Tenela con su ícono.";

  return (
    <aside className="aviso-instalar" role="complementary" aria-label="Instalar la aplicación">
      <img src="/peronismogeselino/icon-192.png" alt="" aria-hidden="true" />
      <div className="aviso-instalar-texto">
        <strong>Peronismo Geselino</strong>
        <span>{texto}</span>
      </div>
      <button
        className="aviso-instalar-si"
        onClick={() => {
          setVisible(false);
          navigate("/instalar");
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
  );
}
