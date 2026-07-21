import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Arrow, LockIcon } from "../ui";

const IMG = "/peronismogeselino/images";

const initialMessages = [
  {
    initials: "MR",
    name: "Marta R.",
    territory: "Zona Sur",
    text: "En mi cuadra hay varios adultos mayores preocupados porque no entienden cuánto puede aumentar la factura. Podríamos preparar una explicación sencilla para compartir.",
    time: "10:32",
    color: "sky",
  },
  {
    initials: "DM",
    name: "Diego M.",
    territory: "Mar Azul",
    text: "Acá tenemos situaciones diferentes entre familias, comercios y alojamientos. Propongo separarlas para que el relevamiento sea más claro.",
    time: "10:47",
    color: "red",
  },
  {
    initials: "LP",
    name: "Laura P.",
    territory: "Monte Rincón",
    text: "Podemos organizar un registro por barrio sin pedir nombres ni información privada: cantidad de hogares y principal dificultad.",
    time: "11:06",
    color: "gold",
  },
];

export default function Community() {
  const navigate = useNavigate();
  const go = (path: string) => navigate(path);
  const [loggedIn, setLoggedIn] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");

  const postMessage = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages([
      ...messages,
      {
        initials: "SI",
        name: "Seba I.",
        territory: "Zona Centro",
        text,
        time: "ahora",
        color: "navy",
      },
    ]);
    setDraft("");
  };

  if (!loggedIn) {
    return (
      <div className="community-login">
        <div className="community-login-image">
          <img src={`${IMG}/gustavo-abrazo.jpg`} alt="Encuentro de Gustavo Barrera con la comunidad" />
          <div className="image-quote">
            “Cuanto más unidos estemos, más fuerte se escucha Villa Gesell.”
          </div>
        </div>
        <div className="community-login-panel tech-grid">
          <span className="eyebrow light">ESPACIO PRIVADO · HASTA 500 MIEMBROS</span>
          <h1>BIENVENIDO A LA COMUNIDAD.</h1>
          <p>Ingresá con la cuenta de Google que recibió la invitación por WhatsApp.</p>
          <button className="google-button" onClick={() => setLoggedIn(true)}>
            <span className="google-g">G</span>
            Continuar con Google
          </button>
          <div className="invitation-note">
            <LockIcon />
            <span>
              Google confirma tu identidad. El portal verifica que tu correo figure entre las
              invitaciones.
            </span>
          </div>
          <div className="login-links">
            <button>¿No recibiste tu invitación?</button>
            <button>Normas de convivencia</button>
          </div>
          <small>Ingreso simulado. La autenticación real llega en la etapa 3.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="community-dashboard">
      <section className="community-welcome">
        <div>
          <span className="eyebrow light">LA COMUNIDAD · ZONA CENTRO</span>
          <h1>HOLA, SEBA.</h1>
          <p>Hay 3 conversaciones nuevas y una actividad próxima.</p>
        </div>
        <button className="profile-chip" onClick={() => setLoggedIn(false)}>
          <span>SI</span>
          <span>
            Seba I.<small>Cerrar demo</small>
          </span>
        </button>
      </section>

      <nav className="community-tabs" aria-label="Secciones de la comunidad">
        <button className="active">La Plaza</button>
        <button>Causas</button>
        <button>Territorio</button>
        <button>Mesa de ideas</button>
        <button>Agenda</button>
        <button>Materiales</button>
      </nav>

      <div className="community-grid section">
        <div className="community-feed">
          <article className="pinned-announcement">
            <div className="pin-icon">!</div>
            <div>
              <span>AVISO DE CONDUCCIÓN · FIJADO</span>
              <h2>PENSAR 2027</h2>
              <p>
                Encuentro para trabajar comunicación digital, compromiso partidario y organización
                territorial.
              </p>
            </div>
            <div className="announcement-date">
              <strong>10</strong>
              <span>AGO · 18:30</span>
              <button onClick={() => go("/agenda")}>
                VER ACTIVIDAD <Arrow />
              </button>
            </div>
          </article>

          <article className="thread-card">
            <header className="thread-header">
              <div>
                <span className="eyebrow">CAUSA VIVA · ZONA FRÍA</span>
                <h2>Cuanto más unidos estemos, menos frío vamos a pasar</h2>
              </div>
              <div className="thread-meta">
                <span>12 participantes</span>
                <span>8 respuestas</span>
              </div>
            </header>
            <div className="moderation-message">
              <strong>MODERACIÓN</strong>
              <p>
                Abrimos esta conversación para conocer qué está pasando en cada barrio y organizar
                propuestas concretas. No publiques facturas ni datos personales.
              </p>
            </div>
            <div className="messages">
              {messages.map((message, index) => (
                <div className="message" key={`${message.name}-${index}`}>
                  <div className={`avatar ${message.color}`}>{message.initials}</div>
                  <div className="message-body">
                    <div>
                      <strong>{message.name}</strong>
                      <span>
                        {message.territory} · {message.time}
                      </span>
                    </div>
                    <p>{message.text}</p>
                    <button>Responder</button>
                  </div>
                </div>
              ))}
            </div>
            <form className="reply-box" onSubmit={postMessage}>
              <div className="avatar navy">SI</div>
              <label>
                <span className="sr-only">Escribir una respuesta</span>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Sumá una propuesta o contá qué está pasando en tu barrio…"
                  rows={2}
                />
              </label>
              <button type="submit" aria-label="Publicar respuesta">
                <Arrow />
              </button>
            </form>
          </article>
        </div>

        <aside className="community-sidebar">
          <section className="community-side-card map-card">
            <span className="eyebrow">TU TERRITORIO</span>
            <div className="territory-map">
              <span className="map-pin">●</span>
              <strong>ZONA CENTRO</strong>
              <small>Villa Gesell</small>
            </div>
            <button>
              VER CONVERSACIONES DEL BARRIO <Arrow />
            </button>
          </section>
          <section className="community-side-card mini-agenda">
            <span className="eyebrow">PRÓXIMA ACTIVIDAD</span>
            <div>
              <strong>10 AGO</strong>
              <span>18:30</span>
            </div>
            <h3>Pensar 2027</h3>
            <p>Lugar visible para miembros confirmados.</p>
            <div className="mini-map-wrap">
              <iframe
                title="Ubicación de Pensar 2027"
                src="https://www.google.com/maps?q=Villa+Gesell,+Buenos+Aires,+Argentina&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              className="mini-map-link"
              href="https://www.google.com/maps/search/?api=1&query=Villa+Gesell%2C+Buenos+Aires%2C+Argentina"
              target="_blank"
              rel="noreferrer"
            >
              ABRIR EN GOOGLE MAPS ↗
            </a>
            <button className="button button-cobalt">CONFIRMAR ASISTENCIA</button>
          </section>
          <section className="community-side-card community-stats">
            <span>
              <strong>184</strong> miembros activos
            </span>
            <span>
              <strong>23</strong> territorios
            </span>
            <span>
              <strong>6</strong> propuestas abiertas
            </span>
          </section>
        </aside>
      </div>
    </div>
  );
}
