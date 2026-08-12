import { Fragment, type ReactNode } from "react";
import { esLineaEmbed, Publicacion } from "./embeds";

// Convierte texto plano en párrafos con enlaces. Admite dos formas:
//   - Enlace con texto:   [Ministerio de Salud](https://...)
//   - Enlace pelado:      https://...  ó  www...
// Por seguridad SOLO se permiten http(s) y mailto; cualquier otra cosa se
// muestra como texto tal cual. Todos los enlaces salen con rel de seguridad y
// abren en otra pestaña. React escapa el texto, así que no hay riesgo de HTML
// inyectado.

function urlSegura(bruta: string): string | null {
  const u = bruta.trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (/^mailto:/i.test(u)) return u;
  if (/^www\./i.test(u)) return "https://" + u;
  return null;
}

// [texto](url)  |  url pelada (http/https/www)
const TOKEN =
  /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)|(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

// Puntuación que suele quedar pegada al final de una URL pelada y no es parte.
const COLA = /[.,;:!?)\]}'"]+$/;

function enlacesDe(texto: string): ReactNode[] {
  const nodos: ReactNode[] = [];
  let ultimo = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  let k = 0;
  while ((m = TOKEN.exec(texto))) {
    if (m.index > ultimo) nodos.push(texto.slice(ultimo, m.index));
    const [coincidencia, etiqueta, urlEtiqueta, urlPelada] = m;
    if (etiqueta && urlEtiqueta) {
      const href = urlSegura(urlEtiqueta);
      if (href) {
        nodos.push(
          <a key={k++} href={href} target="_blank" rel="noopener noreferrer">
            {etiqueta}
          </a>,
        );
      } else {
        nodos.push(coincidencia); // esquema no permitido: se deja literal
      }
    } else if (urlPelada) {
      let visible = urlPelada;
      let cola = "";
      const mc = visible.match(COLA);
      if (mc) {
        cola = visible.slice(visible.length - mc[0].length);
        visible = visible.slice(0, visible.length - mc[0].length);
      }
      const href = urlSegura(visible);
      if (href) {
        nodos.push(
          <a key={k++} href={href} target="_blank" rel="noopener noreferrer">
            {visible}
          </a>,
        );
        if (cola) nodos.push(cola);
      } else {
        nodos.push(coincidencia);
      }
    }
    ultimo = m.index + coincidencia.length;
  }
  if (ultimo < texto.length) nodos.push(texto.slice(ultimo));
  return nodos;
}

// Un solo párrafo (o línea) con sus enlaces resueltos.
export function TextoConEnlaces({ children }: { children: string }): ReactNode {
  return <Fragment>{enlacesDe(children ?? "")}</Fragment>;
}

// Cuerpo completo: separa en párrafos por saltos de línea. Un renglón que sea
// solo una URL de YouTube, Instagram o Twitter/X se muestra como publicación
// incrustada; el resto, como párrafo de texto con enlaces.
export function CuerpoRico({ texto, className }: { texto: string; className?: string }) {
  const lineas = (texto ?? "")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className={className}>
      {lineas.map((linea, i) => {
        const embed = esLineaEmbed(linea);
        if (embed) return <Publicacion key={i} url={linea} />;
        return (
          <p key={i}>
            <TextoConEnlaces>{linea}</TextoConEnlaces>
          </p>
        );
      })}
    </div>
  );
}
