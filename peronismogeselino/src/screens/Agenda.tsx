import { useNavigate } from "react-router-dom";
import { Arrow, LockIcon, ShareIcon } from "../ui";

export default function Agenda() {
  const navigate = useNavigate();
  const go = (path: string) => navigate(path);

  return (
    <div className="inner-page agenda-page">
      <section className="inner-hero agenda-hero tech-grid">
        <div className="breadcrumb">
          <button onClick={() => go("/")}>Inicio</button>
          <span>/</span>
          <span>Agenda</span>
        </div>
        <span className="eyebrow light">PRÓXIMAS ACTIVIDADES</span>
        <h1>AGENDA GESELINA</h1>
        <p>Información clara para saber cuándo, dónde y cómo participar.</p>
      </section>

      <section className="agenda-detail section">
        <article className="agenda-feature">
          <div className="agenda-feature-head">
            <div className="agenda-big-date">
              <strong>10</strong>
              <span>AGO</span>
            </div>
            <div>
              <span className="event-type">ACTIVIDAD DE LA COMUNIDAD · 18:30</span>
              <h2>PENSAR 2027</h2>
              <p>
                Reunión del PJ geselino para trabajar estrategias de comunicación digital,
                compromiso partidario y puesta en marcha del Plan 2027.
              </p>
            </div>
          </div>
          <div className="map-shell">
            <iframe
              title="Mapa de la actividad Pensar 2027 en Villa Gesell"
              src="https://www.google.com/maps?q=Villa+Gesell,+Buenos+Aires,+Argentina&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="map-actions">
            <div>
              <strong>UBICACIÓN DE EJEMPLO</strong>
              <span>
                La dirección precisa se administra desde el panel y solo se muestra a miembros.
              </span>
            </div>
            <a
              className="button button-cobalt"
              href="https://www.google.com/maps/search/?api=1&query=Villa+Gesell%2C+Buenos+Aires%2C+Argentina"
              target="_blank"
              rel="noreferrer"
            >
              ABRIR EN GOOGLE MAPS <ShareIcon />
            </a>
          </div>
        </article>

        <aside className="agenda-side">
          <span className="eyebrow">TAMBIÉN EN AGENDA</span>
          <div className="agenda-side-event">
            <strong>15 AGO</strong>
            <span>ENTREVISTA · TELEVISIÓN</span>
            <h3>Gustavo en Telefe</h3>
            <p>El impacto de la quita del beneficio de Zona Fría.</p>
          </div>
          <div className="agenda-panel-note">
            <LockIcon />
            <div>
              <strong>Agenda pública + privada</strong>
              <p>
                El panel define fecha, horario, dirección, enlace de Maps y quién puede ver cada
                actividad.
              </p>
            </div>
          </div>
          <button className="button button-navy" onClick={() => go("/comunidad")}>
            INGRESAR A LA COMUNIDAD <Arrow />
          </button>
        </aside>
      </section>
    </div>
  );
}
