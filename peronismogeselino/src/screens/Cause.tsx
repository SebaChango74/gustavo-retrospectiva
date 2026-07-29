import { useEffect, useState } from "react";
import { Foto } from "../foto";
import { VideoEmbed } from "../video";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { Arrow, ShareIcon, dateLabel } from "../ui";

type CauseDetail = {
  cause: {
    slug: string;
    title: string;
    summary: string;
    statusLabel: string;
    progress: number;
    progressFrom: string;
    progressNext: string;
    leadImage: string;
  video?: string;
    briefTitle: string;
    briefBody: string;
    bullets: string[];
    keyFactValue: string;
    keyFactLabel: string;
    nextSteps: string[];
    updatedAt: string;
  };
  timeline: { date_label: string; title: string; body: string; state: string }[];
};

export default function Cause() {
  const navigate = useNavigate();
  const params = useParams();
  const go = (path: string) => navigate(path);
  const [detail, setDetail] = useState<CauseDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let slug = params.slug;
        if (!slug) {
          const list = await api.get<{ causes: { slug: string }[] }>("/public/causes");
          slug = list.causes[0]?.slug;
        }
        if (!slug) {
          setNotFound(true);
          return;
        }
        const data = await api.get<CauseDetail>(`/public/causes/${slug}`);
        if (!cancelled) setDetail(data);
      } catch {
        if (!cancelled) setNotFound(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  const share = async () => {
    const url = window.location.href;
    const title = detail?.cause.title ?? "Causa viva · Peronismo Geselino";
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // cancelado por la persona
      }
    } else {
      await navigator.clipboard?.writeText(url);
      window.alert("Enlace copiado para compartir.");
    }
  };

  if (notFound) {
    return (
      <div className="inner-page cause-page">
        <div className="inner-hero cause-inner-hero tech-grid">
          <div className="breadcrumb">
            <button onClick={() => go("/")}>Inicio</button>
            <span>/</span>
            <span>Causas vivas</span>
          </div>
          <h1>PRONTO HABRÁ CAUSAS PARA SEGUIR</h1>
          <p>Las causas vivas se publican desde el panel de control.</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return <div className="inner-page cause-page" style={{ minHeight: "60vh" }} />;
  }

  const { cause, timeline } = detail;

  return (
    <div className="inner-page cause-page">
      <div className="inner-hero cause-inner-hero tech-grid">
        <div className="breadcrumb">
          <button onClick={() => go("/")}>Inicio</button>
          <span>/</span>
          <span>Causas vivas</span>
        </div>
        <div className="cause-status">
          <span className="live-dot red" /> CAUSA ACTIVA · ACTUALIZADA EL{" "}
          {dateLabel(cause.updatedAt).toUpperCase()}
        </div>
        <h1>{cause.title}</h1>
        <p>{cause.summary}</p>
        <div className="inner-hero-actions">
          <button className="button button-cream" onClick={share}>
            COMPARTIR CAUSA <ShareIcon />
          </button>
          <button className="button button-outline-light" onClick={() => go("/comunidad")}>
            CONVERSAR EN LA COMUNIDAD
          </button>
        </div>
      </div>

      <div className="cause-layout section">
        <article className="cause-main">
          {cause.video ? (
            <VideoEmbed video={cause.video} titulo={cause.title} />
          ) : cause.leadImage ? (
            <div className="cause-lead-image">
              <Foto valor={cause.leadImage} />
            </div>
          ) : null}
          <section className="brief-box">
            <span className="eyebrow">EN 30 SEGUNDOS</span>
            <h2>{cause.briefTitle}</h2>
            <p>{cause.briefBody}</p>
            {cause.bullets.length > 0 && (
              <ul>
                {cause.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>

          {timeline.length > 0 && (
            <section className="timeline-section">
              <span className="eyebrow">MEMORIA Y SEGUIMIENTO</span>
              <h2>LÍNEA DE TIEMPO</h2>
              <div className="timeline">
                {timeline.map((item, index) => (
                  <div className={`timeline-item ${item.state === "done" ? "done" : item.state === "current" ? "current" : ""}`} key={index}>
                    <time>{item.date_label}</time>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="cause-sidebar">
          <div className="side-card status-card">
            <span className="eyebrow">ESTADO ACTUAL</span>
            <strong>{cause.statusLabel}</strong>
            <div className="cause-progress">
              <span style={{ width: `${cause.progress}%` }} />
            </div>
            <p>{cause.progressFrom}. {cause.progressNext}.</p>
          </div>
          {cause.keyFactValue && (
            <div className="side-card data-card">
              <span className="eyebrow">DATO CLAVE</span>
              <strong>{cause.keyFactValue}</strong>
              <p>{cause.keyFactLabel}</p>
            </div>
          )}
          {cause.nextSteps.length > 0 && (
            <div className="side-card next-card">
              <span className="eyebrow">QUÉ SIGUE</span>
              <ol>
                {cause.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          <button className="side-community" onClick={() => go("/comunidad")}>
            <span>La conversación sigue adentro</span>
            <strong>DEBATIR ESTA CAUSA</strong>
            <Arrow />
          </button>
        </aside>
      </div>
    </div>
  );
}
