import { useEffect, useRef } from "react";
import { hayInstalador, instalar, navegadorIncrustado, plataforma } from "./install";

/**
 * Cómo instalar, encima del portal.
 *
 * No es una página aparte a propósito. Una pantalla que dice «bajate la app»
 * y abajo ofrece «mejor entrá al portal» son dos salidas peleándose: la
 * persona ya está en el portal, así que lo único que falta es el cómo.
 */
export function InstalarHoja({ onCerrar }: { onCerrar: () => void }) {
  const caja = useRef<HTMLDivElement>(null);
  const donde = plataforma();
  const incrustado = navegadorIncrustado();

  useEffect(() => {
    caja.current?.focus();
    const teclado = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", teclado);
    return () => document.removeEventListener("keydown", teclado);
  }, [onCerrar]);

  const pasos = incrustado
    ? INCRUSTADO
    : donde === "ios"
      ? IPHONE
      : donde === "android"
        ? ANDROID
        : ESCRITORIO;

  return (
    <div className="hoja-fondo" onClick={onCerrar}>
      <div
        className="hoja"
        role="dialog"
        aria-modal="true"
        aria-label="Cómo instalar la aplicación"
        tabIndex={-1}
        ref={caja}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="hoja-cerrar" onClick={onCerrar} aria-label="Cerrar">
          ✕
        </button>

        <div className="hoja-head">
          <img src="/peronismogeselino/icon-192.png" alt="" aria-hidden="true" />
          <div>
            <strong>Peronismo Geselino</strong>
            <span>Queda con su ícono, como cualquier app.</span>
          </div>
        </div>

        {hayInstalador() && !incrustado ? (
          <button
            className="button button-cobalt grande"
            onClick={async () => {
              const aceptada = await instalar();
              if (aceptada) onCerrar();
            }}
          >
            INSTALAR AHORA
          </button>
        ) : (
          <ol className="hoja-pasos">
            {pasos.map((paso, i) => (
              <li key={paso.titulo} className={paso.aviso ? "hoja-aviso" : ""}>
                {!paso.aviso && <span className="hoja-num">{i + 1}</span>}
                <div>
                  <b>{paso.titulo}</b>
                  <small>{paso.texto}</small>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

type Paso = { titulo: string; texto: string; aviso?: boolean };

const IPHONE: Paso[] = [
  {
    titulo: "Tocá el botón de compartir",
    texto: "El cuadradito con la flecha para arriba, abajo de todo en Safari.",
  },
  {
    titulo: "Buscá «Agregar a inicio»",
    texto: "Está más abajo en la lista. Puede decir «Agregar a pantalla de inicio».",
  },
  { titulo: "Agregar", texto: "Listo: el ícono queda en la pantalla del teléfono." },
  {
    titulo: "Tiene que ser Safari",
    texto: "En el iPhone, Chrome no puede instalar aplicaciones. Es una limitación de Apple.",
    aviso: true,
  },
];

const ANDROID: Paso[] = [
  { titulo: "Tocá los tres puntitos", texto: "Arriba a la derecha, en Chrome." },
  {
    titulo: "Elegí «Instalar aplicación»",
    texto: "También puede decir «Agregar a pantalla principal».",
  },
  { titulo: "Instalar", texto: "El ícono queda en la pantalla del teléfono." },
];

const ESCRITORIO: Paso[] = [
  {
    titulo: "Mirá la barra de direcciones",
    texto: "A la derecha aparece un ícono de instalar, una pantallita con una flecha.",
  },
  {
    titulo: "Instalar",
    texto: "Queda como programa, con su propia ventana. Funciona en Chrome y en Edge.",
  },
];

const INCRUSTADO: Paso[] = [
  {
    titulo: "Abrila en el navegador del teléfono",
    texto:
      "Estás viéndola dentro de otra aplicación y desde acá no se puede instalar. Tocá los tres puntitos y elegí «Abrir en Chrome» o «Abrir en Safari».",
    aviso: true,
  },
];
