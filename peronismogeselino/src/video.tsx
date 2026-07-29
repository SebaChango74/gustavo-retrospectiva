/**
 * Video de YouTube en noticias y causas. Si hay video, reemplaza a la imagen.
 *
 * En las tarjetas va la miniatura del video con el triángulo de reproducir:
 * incrustar reproductores en una grilla es pesado y lento. El reproductor de
 * verdad va en la nota o la causa abierta, con youtube-nocookie: no deja
 * rastro de seguimiento hasta que la persona aprieta play.
 */

export function youtubeId(url?: string | null): string | null {
  const texto = (url || "").trim();
  const marca = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(
    texto,
  );
  return marca ? marca[1] : null;
}

/** Miniatura para tarjetas: la imagen del video más el triángulo de play. */
export function VideoMiniatura({ video, alt = "" }: { video: string; alt?: string }) {
  const id = youtubeId(video);
  if (!id) return null;
  return (
    <div className="video-miniatura">
      <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt={alt} loading="lazy" />
      <span className="video-play" aria-hidden="true" />
    </div>
  );
}

/** El reproductor, para la nota o la causa abierta. */
export function VideoEmbed({ video, titulo }: { video: string; titulo: string }) {
  const id = youtubeId(video);
  if (!id) return null;
  return (
    <div className="video-embed">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={titulo}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
