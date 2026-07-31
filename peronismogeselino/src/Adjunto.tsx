/**
 * Tarjeta de descarga de un PDF adjunto a una nota o una causa. El atributo
 * download hace que el navegador lo baje en vez de abrirlo, con un nombre
 * prolijo.
 */
export function Adjunto({ url, nombre }: { url?: string; nombre?: string }) {
  if (!url) return null;
  const limpio = (nombre || "documento.pdf").replace(/[^\w.\- áéíóúñ]/gi, "").trim() || "documento.pdf";
  return (
    <a className="adjunto" href={url} download={limpio}>
      <span className="adjunto-icono" aria-hidden="true">
        PDF
      </span>
      <span className="adjunto-texto">
        <strong>{nombre || "Descargar el documento"}</strong>
        <small>Tocá para descargar</small>
      </span>
      <span className="adjunto-flecha" aria-hidden="true">
        ↓
      </span>
    </a>
  );
}
