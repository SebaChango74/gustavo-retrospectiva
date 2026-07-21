import { useNavigate } from "react-router-dom";
import { Arrow, LockIcon, PeronometroLogo, SectionHeading } from "../ui";

const IMG = "/peronismogeselino/images";

const news = [
  {
    tag: "Villa Gesell",
    date: "14 JUL 2026",
    title: "Barrera llevó a Nación los reclamos de Villa Gesell",
    summary:
      "Un pedido formal para defender obras, recursos y derechos que pertenecen a los geselinos.",
    image: `${IMG}/gestion-obras.jpg`,
    featured: true,
  },
  {
    tag: "Provincia",
    date: "20 JUL 2026",
    title: "Más de 220 familias avanzaron en la regularización de sus hogares",
    summary:
      "La Provincia entregó escrituras y boletos de compraventa para ampliar el acceso al hábitat.",
    image: `${IMG}/comunidad-grupo.jpg`,
  },
  {
    tag: "Comunidad",
    date: "15 JUL 2026",
    title: "Peatonal de las Infancias: convocatoria a instituciones geselinas",
    summary:
      "Una propuesta abierta para construir una jornada cultural, educativa y comunitaria.",
    image: `${IMG}/gustavo-infancias.jpg`,
  },
];

export default function Home() {
  const navigate = useNavigate();
  const go = (path: string) => navigate(path);

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
              <strong>23</strong>
              <span>territorios</span>
            </div>
            <div>
              <strong>2</strong>
              <span>causas activas</span>
            </div>
            <div>
              <strong>135</strong>
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

      <section className="pulse-strip" aria-label="El pulso de hoy">
        <div className="pulse-label">
          <span className="live-dot red" /> EL PULSO DE HOY <time>12:46</time>
        </div>
        <button onClick={() => go("/causas")}>
          <span className="pulse-tag">AHORA</span>
          <strong>Barrera llevó a Nación los reclamos de Villa Gesell</strong>
          <Arrow />
        </button>
      </section>

      <section className="section news-section" id="noticias">
        <SectionHeading eyebrow="AHORA" title="LO QUE ESTÁ PASANDO" action="Ver todas las noticias" />
        <div className="news-grid">
          {news.map((item, index) => (
            <article className={item.featured ? "news-card featured" : "news-card"} key={item.title}>
              <button onClick={() => index === 0 && go("/causas")} aria-label={`Abrir ${item.title}`}>
                <div className="news-image">
                  <img src={item.image} alt="" />
                </div>
                <div className="news-body">
                  <div className="meta">
                    <span>{item.tag}</span>
                    <time>{item.date}</time>
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
            <span style={{ width: "72%" }} />
          </div>
          <div className="progress-legend">
            <span>Pedido presentado</span>
            <strong>Próximo paso: audiencia</strong>
          </div>
          <button className="button button-sky" onClick={() => go("/causas")}>
            SEGUIR ESTA CAUSA <Arrow />
          </button>
        </div>
      </section>

      <section className="section agenda-games" id="agenda">
        <div className="agenda-column">
          <SectionHeading eyebrow="PRÓXIMAMENTE" title="AGENDA" />
          <article className="event-card public-event">
            <div className="event-date">
              <strong>15</strong>
              <span>AGO</span>
            </div>
            <div className="event-content">
              <span className="event-type">ENTREVISTA · TELEVISIÓN</span>
              <h3>Gustavo en Telefe</h3>
              <p>Las consecuencias de la quita del beneficio de Zona Fría.</p>
            </div>
            <button onClick={() => go("/agenda")} aria-label="Ver actividad">
              <Arrow />
            </button>
          </article>
          <article className="event-card members-event">
            <div className="event-date">
              <strong>10</strong>
              <span>AGO</span>
            </div>
            <div className="event-content">
              <span className="event-type">ACTIVIDAD DE LA COMUNIDAD</span>
              <h3>Pensar 2027</h3>
              <p>Encuentro interno · ubicación disponible para miembros.</p>
            </div>
            <button onClick={() => go("/agenda")} aria-label="Ver ubicación para miembros">
              <LockIcon />
            </button>
          </article>
        </div>

        <div className="games-column" id="juegos">
          <SectionHeading eyebrow="JUGAR Y APRENDER" title="NUEVO DESAFÍO" />
          <div className="peronometro-card">
            <div className="peronometro-card-image">
              <img
                src={`${IMG}/peronometro-peron.png`}
                alt="Retrato editorial de Juan Domingo Perón"
              />
              <div className="pop-tile tile-date">17 OCT</div>
              <div className="pop-tile tile-score">%</div>
              <div className="pop-tile tile-time">10s</div>
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
