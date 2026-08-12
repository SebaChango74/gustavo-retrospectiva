import { useEffect, useState } from "react";
import { Foto } from "../foto";
import { Adjunto } from "../Adjunto";
import { VideoEmbed } from "../video";
import { useNavigate, useParams } from "react-router-dom";
import { api, type NewsItem } from "../api";
import { Arrow, ShareIcon, dateLabel } from "../ui";
import { CuerpoRico } from "../richtext";
import { Publicacion } from "../embeds";

export default function News() {
  const navigate = useNavigate();
  const params = useParams();
  const go = (path: string) => navigate(path);
  const [item, setItem] = useState<NewsItem | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setItem(null);
    setNotFound(false);
    api
      .get<{ item: NewsItem }>(`/public/news/${params.slug}`)
      .then((data) => setItem(data.item))
      .catch(() => setNotFound(true));
  }, [params.slug]);

  const share = async () => {
    if (!item) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, url });
      } catch {
        // cancelado
      }
    } else {
      await navigator.clipboard?.writeText(url);
      window.alert("Enlace copiado para compartir.");
    }
  };

  if (notFound) {
    return (
      <div className="inner-page">
        <div className="inner-hero tech-grid">
          <div className="breadcrumb">
            <button onClick={() => go("/")}>Inicio</button>
            <span>/</span>
            <span>Noticias</span>
          </div>
          <h1>NOTICIA NO ENCONTRADA</h1>
          <p>Puede que haya sido despublicada desde el panel.</p>
          <div className="inner-hero-actions">
            <button className="button button-cream" onClick={() => go("/#noticias")}>
              VER LAS NOTICIAS <Arrow />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return <div className="inner-page" style={{ minHeight: "60vh" }} />;
  }

  const bodyText = item.body || item.summary || "";

  return (
    <div className="inner-page news-page">
      <div className="inner-hero tech-grid">
        <div className="breadcrumb">
          <button onClick={() => go("/")}>Inicio</button>
          <span>/</span>
          <span>Noticias</span>
        </div>
        <div className="cause-status">
          <span className="live-dot" /> {item.tag.toUpperCase()} ·{" "}
          {dateLabel(item.published_at).toUpperCase()}
        </div>
        <h1>{item.title.toUpperCase()}</h1>
        <p>{item.summary}</p>
        <div className="inner-hero-actions">
          <button className="button button-cream" onClick={share}>
            COMPARTIR NOTICIA <ShareIcon />
          </button>
        </div>
      </div>

      <div className="section news-article">
        {item.video ? (
          <VideoEmbed video={item.video} titulo={item.title} />
        ) : item.image ? (
          <div className="cause-lead-image">
            <Foto valor={item.image} />
          </div>
        ) : null}
        {item.embed ? <Publicacion url={item.embed} titulo={item.title} /> : null}
        <CuerpoRico texto={bodyText} className="news-article-body" />
        <Adjunto url={item.attachment} nombre={item.attachment_name} />
        <button className="text-action dark" onClick={() => go("/#noticias")}>
          ← Volver a las noticias
        </button>
      </div>
    </div>
  );
}
