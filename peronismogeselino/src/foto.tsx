/**
 * Encuadre de las fotos.
 *
 * Las tarjetas recortan la foto para llenar su espacio, y recortar por el
 * centro corta cabezas: en una foto de acto o de entrevista las caras están
 * en el tercio de arriba. El punto importante de cada foto se guarda pegado
 * a su dirección («…/foto.jpg#e=48,22», en porcentajes), así no hace falta
 * ninguna columna nueva y el dato viaja con la imagen a todos lados.
 */

/** La dirección real del archivo, sin el encuadre. */
export function fotoSrc(valor?: string | null): string {
  return (valor || "").split("#")[0];
}

/**
 * Dónde apunta el recorte. Sin encuadre elegido, apunta un poco arriba del
 * centro: es donde suelen estar las caras, y corta piernas antes que frentes.
 */
export function fotoPosicion(valor?: string | null): string {
  const marca = /#e=(\d{1,3}),(\d{1,3})/.exec(valor || "");
  if (!marca) return "50% 35%";
  return `${Math.min(100, Number(marca[1]))}% ${Math.min(100, Number(marca[2]))}%`;
}

export function conEncuadre(valor: string, x: number, y: number): string {
  const limpio = fotoSrc(valor);
  const px = Math.round(Math.min(100, Math.max(0, x)));
  const py = Math.round(Math.min(100, Math.max(0, y)));
  return `${limpio}#e=${px},${py}`;
}

/** Imagen de contenido: respeta el encuadre elegido en el panel. */
export function Foto({
  valor,
  alt = "",
  className,
}: {
  valor?: string | null;
  alt?: string;
  className?: string;
}) {
  const src = fotoSrc(valor);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ objectPosition: fotoPosicion(valor) }}
      loading="lazy"
    />
  );
}
