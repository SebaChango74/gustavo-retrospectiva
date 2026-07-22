import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type HomePayload } from "../api";
import { Arrow, LockIcon, PeronometroLogo, SectionHeading, dayOf, monthOf, dateLabel, timeOf } from "../ui";

const IMG = "/peronismogeselino/images";

const FALLBACK: HomePayload = {
  news: [
    {
      slug: "barrera-llevo-a-nacion-los-reclamos",
      tag: "Villa Gesell",
      title: "Barrera llevó a Nación los reclamos de Villa Gesell",
      summary:
        "Un pedido formal para defender obras, recursos y derechos que pertenecen a los geselinos.",
      image: `${IMG}/gestion-obras.jpg`,
      featured: 1,
      published_at: "2026-07-14T12:00:00.000Z",
    },
  ],
  cause: {
    slug: "defender-lo-que-le-corresponde-a-villa-gesell",
    title: "DEFENDER LO QUE LE CORRESPONDE A VILLA GESELL",
    summary:
      "Obras, recursos y derechos no son promesas: forman parte de una historia que se puede seguir, documentar y defender.",
    status_label: "EN GESTIÓN",
    progress: 72,
    progress_from: "Pedido presentado",
    progress_next: "Próximo paso: audiencia",
  },
  events: [],
  stats: { territorios: "23", causasActivas: "2", municipios: "135" },
};

export default function Home() {
  const navigate = useNavigate();
  const go = (path: string) => navigate(path);
  const [data, setData] = useState<HomePayload>(FALLBACK);

  useEffect(() => {
    api
      .get<HomePayload>("/public/home")
      .then(setData)
      .catch(() => {});
  }, []);

  const featured = data.news[0];

  return (
    <>
      <section className="hero">
        <div className="hero-copy tech-grid">
          <div className="hero-portal-logo" aria-label="Peronismo Geselino">
            <span className="hero-logo-mark">
              PG
              <i />
            </span>
            <span className="hero-logo-words">
              <b>PERONISMO</b>
              <b>GESELINO</b>
              <small>VILLA GESELL · BUENOS AIRES</small>
            </span>
          </div>
          <div className="hero-kicker">
            <span className="live-dot" /> DESDE VILLA GESELL
          </div>
          <h1>
            UNA NOTICIA DURA UN DÍA.
            <br />
            <em>UNA CAUSA SIGUE VIVA.</em>
          </h1>
          <p>Información, memoria y organización desde Villa Gesell para toda la Provincia.</p>
          <div className="hero-actions">
            <button className="button button-cream" onClick={() => go("/causas")}>
              VER CAUSAS VIVAS <Arrow />
            </button>
            <button className="text-action" onClick={() => go("/#noticias")}>
              Ver las noticias de hoy
            </button>
          </div>
          <div className="hero-stats" aria-label="Datos del portal">
            <div>
              <strong>{data.stats.territorios}</strong>
              <span>territorios</span>
            </div>
            <div>
              <strong>{data.stats.causasActivas}</strong>
              <span>causas activas</span>
            </div>
            <div>
              <strong>{data.stats.municipios}</strong>
              <span>municipios</span>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <img
            src={`${IMG}/hero-gustavo-v2.png`}
            alt="Gustavo Barrera saludando en un encuentro de Villa Gesell"
          />
          <div className="photo-caption">Gustavo · Villa Gesell</div>
        </div>
      </section>

      {featured && (
        <section className="pulse-strip" aria-label="El pulso de hoy">
          <div className="pulse-label">
            <span className="live-dot red" /> EL PULSO DE HOY{" "}
            <time>{timeOf(featured.published_at)}</time>
          </div>
          <button onClick={() => go(`/noticias/${featured.slug}`)}>
            <span className="pulse-tag">AHORA</span>
            <strong>{featured.title}</strong>
            <Arrow />
          </button>
        </section>
      )}

      <section className="section news-section" id="noticias">
        <SectionHeading eyebrow="AHORA" title="LO QUE ESTÁ PASANDO" />
        <div className="news-grid">
          {data.news.map((item, index) => (
            <article className={item.featured ? "news-card featured" : "news-card"} key={item.slug}>
              <button onClick={() => go(`/noticias/${item.slug}`)} aria-label={`Abrir ${item.title}`}>
                <div className="news-image">{item.image && <img src={item.image} alt="" />}</div>
                <div className="news-body">
                  <div className="meta">
                    <span>{item.tag}</span>
                    <time>{dateLabel(item.published_at)}</time>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <span className="read-more">
                    LEER MÁS <Arrow />
                  </span>
                </div>
              </button>
            </article>
          ))}
        </div>
      </section>

      {data.cause && (
        <section className="cause-teaser">
          <div className="cause-photo">
            <img src={`${IMG}/gustavo-abrazo.jpg`} alt="Gustavo Barrera abrazando a una vecina" />
          </div>
          <div className="cause-copy">
            <span className="eyebrow light">CAUSA VIVA · EN CURSO</span>
            <h2>DEFENDER LO QUE LE CORRESPONDE A VILLA GESELL</h2>
            <p>
              Obras, recursos y derechos no son promesas: forman parte de una historia que se puede
              seguir, documentar y defender.
            </p>
            <div className="cause-progress">
              <span style={{ width: `${data.cause.progress}%` }} />
            </div>
            <div className="progress-legend">
              <span>{data.cause.progress_from}</span>
              <strong>{data.cause.progress_next}</strong>
            </div>
            <button className="button button-sky" onClick={() => go(`/causas/${data.cause!.slug}`)}>
              SEGUIR ESTA CAUSA <Arrow />
            </button>
          </div>
        </section>
      )}

      <section className="section agenda-games" id="agenda">
        <div className="agenda-column">
          <SectionHeading eyebrow="PRÓXIMAMENTE" title="AGENDA" />
          {data.events.map((event) => (
            <article
              key={event.id}
              className={
                event.visibility === "members" ? "event-card members-event" : "event-card public-event"
              }
            >
              <div className="event-date">
                <strong>{dayOf(event.startsAt)}</strong>
                <span>{monthOf(event.startsAt)}</span>
              </div>
              <div className="event-content">
                <span className="event-type">{event.eventType}</span>
                <h3>{event.title}</h3>
                <p>
                  {event.visibility === "members" && !event.address
                    ? "Encuentro interno · ubicación disponible para miembros."
                    : event.summary}
                </p>
              </div>
              <button
                onClick={() => go("/agenda")}
                aria-label={
                  event.visibility === "members" ? "Ver ubicación para miembros" : "Ver actividad"
                }
              >
                {event.visibility === "members" ? <LockIcon /> : <Arrow />}
              </button>
            </article>
          ))}
          {data.events.length === 0 && (
            <article className="event-card public-event">
              <div className="event-content" style={{ gridColumn: "1 / -1" }}>
                <span className="event-type">AGENDA</span>
                <h3>Próximas actividades</h3>
                <p>Las nuevas actividades se publican desde el panel.</p>
              </div>
            </article>
          )}
        </div>

        <div className="games-column" id="juegos">
          <SectionHeading eyebrow="JUGAR Y APRENDER" title="NUEVO DESAFÍO" />
          <div className="peronometro-card">
            <div className="peronometro-card-image">
              <img
                src={`${IMG}/peronometro-hero.jpg`}
                alt="Juan Domingo Perón, collage editorial"
              />
              <PeronometroLogo compact />
            </div>
            <div className="peronometro-card-body">
              <div className="game-facts">
                <span>50 preguntas</span>
                <span>10 segundos</span>
                <span>Placa final</span>
              </div>
              <h3>¿Qué tan peronista sos?</h3>
              <p>Historia, ideas y memoria. Respondé, descubrí tu porcentaje y desafiá a tus amigos.</p>
              <button className="button button-navy" onClick={() => go("/juegos")}>
                CONOCER EL JUEGO <Arrow />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="community-promo">
        <div className="community-promo-image">
          <img
            src={`${IMG}/gustavo-ninez.jpg`}
            alt="Gustavo conversando con un niño en una actividad comunitaria"
          />
        </div>
        <div className="community-promo-copy">
          <span className="eyebrow">ESPACIO PRIVADO · CON INVITACIÓN</span>
          <h2>LA COMUNIDAD SE CONSTRUYE HABLANDO.</h2>
          <p>
            Debates, propuestas, territorio y organización en un espacio cuidado para el peronismo
            geselino.
          </p>
          <button className="button button-cobalt" onClick={() => go("/comunidad")}>
            CONOCER LA COMUNIDAD <Arrow />
          </button>
        </div>
      </section>
    </>
  );
}
