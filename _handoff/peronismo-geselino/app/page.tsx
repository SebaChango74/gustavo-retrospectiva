"use client";

import { FormEvent, useState } from "react";

type View = "home" | "cause" | "community" | "agenda" | "game";

const news = [
  {
    tag: "Villa Gesell",
    date: "14 JUL 2026",
    title:
      "Barrera llevó a Nación los reclamos de Villa Gesell",
    summary:
      "Un pedido formal para defender obras, recursos y derechos que pertenecen a los geselinos.",
    image: "/images/gestion-obras.jpg",
    featured: true,
  },
  {
    tag: "Provincia",
    date: "20 JUL 2026",
    title:
      "Más de 220 familias avanzaron en la regularización de sus hogares",
    summary:
      "La Provincia entregó escrituras y boletos de compraventa para ampliar el acceso al hábitat.",
    image: "/images/comunidad-grupo.jpg",
  },
  {
    tag: "Comunidad",
    date: "15 JUL 2026",
    title:
      "Peatonal de las Infancias: convocatoria a instituciones geselinas",
    summary:
      "Una propuesta abierta para construir una jornada cultural, educativa y comunitaria.",
    image: "/images/gustavo-infancias.jpg",
  },
];

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

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");

  const go = (next: View) => {
    setView(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToSection = (id: string) => {
    setView("home");
    setMenuOpen(false);
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 30);
  };

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

  return (
    <div className="site-shell">
      <Header
        view={view}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        go={go}
        goToSection={goToSection}
      />

      <main>
        {view === "home" && (
          <PublicHome go={go} goToSection={goToSection} />
        )}
        {view === "cause" && <CauseView go={go} />}
        {view === "agenda" && <AgendaView go={go} />}
        {view === "game" && <GameView go={go} />}
        {view === "community" && (
          <CommunityView
            go={go}
            loggedIn={loggedIn}
            setLoggedIn={setLoggedIn}
            messages={messages}
            draft={draft}
            setDraft={setDraft}
            postMessage={postMessage}
          />
        )}
      </main>

      <MobileDock view={view} go={go} goToSection={goToSection} />
      <Footer go={go} />
    </div>
  );
}

function Header({
  view,
  menuOpen,
  setMenuOpen,
  go,
  goToSection,
}: {
  view: View;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  go: (view: View) => void;
  goToSection: (id: string) => void;
}) {
  return (
    <header className="site-header">
      <button className="brand" onClick={() => go("home")} aria-label="Ir al inicio">
        <span className="brand-title">PERONISMO GESELINO</span>
        <span className="brand-subtitle">Villa Gesell · Buenos Aires</span>
      </button>

      <div className="pj-seal" aria-label="Partido Justicialista Provincia de Buenos Aires">
        <img src="/images/pj-bonaerense.png" alt="PJ Bonaerense" />
      </div>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-expanded={menuOpen}
        aria-label="Abrir navegación"
      >
        <span />
        <span />
      </button>

      <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Navegación principal">
        <button className={view === "home" ? "active" : ""} onClick={() => go("home")}>Ahora</button>
        <button className={view === "cause" ? "active" : ""} onClick={() => go("cause")}>Causas vivas</button>
        <button className={view === "agenda" ? "active" : ""} onClick={() => go("agenda")}>Agenda</button>
        <button className={view === "game" ? "active" : ""} onClick={() => go("game")}>Juegos</button>
      </nav>

      <button className="community-button" onClick={() => go("community")}>
        <span>LA COMUNIDAD</span>
        <Arrow />
      </button>
    </header>
  );
}

function PublicHome({
  go,
  goToSection,
}: {
  go: (view: View) => void;
  goToSection: (id: string) => void;
}) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy tech-grid">
          <div className="hero-portal-logo" aria-label="Peronismo Geselino">
            <span className="hero-logo-mark">PG<i /></span>
            <span className="hero-logo-words"><b>PERONISMO</b><b>GESELINO</b><small>VILLA GESELL · BUENOS AIRES</small></span>
          </div>
          <div className="hero-kicker"><span className="live-dot" /> DESDE VILLA GESELL</div>
          <h1>UNA NOTICIA DURA UN DÍA.<br /><em>UNA CAUSA SIGUE VIVA.</em></h1>
          <p>Información, memoria y organización desde Villa Gesell para toda la Provincia.</p>
          <div className="hero-actions">
            <button className="button button-cream" onClick={() => go("cause")}>
              VER CAUSAS VIVAS <Arrow />
            </button>
            <button className="text-action" onClick={() => goToSection("noticias")}>
              Ver las noticias de hoy
            </button>
          </div>
          <div className="hero-stats" aria-label="Datos del portal">
            <div><strong>23</strong><span>territorios</span></div>
            <div><strong>2</strong><span>causas activas</span></div>
            <div><strong>135</strong><span>municipios</span></div>
          </div>
        </div>
        <div className="hero-image">
          <img src="/images/hero-gustavo-v2.png" alt="Gustavo Barrera saludando en un encuentro de Villa Gesell" />
          <div className="photo-caption">Gustavo · Villa Gesell</div>
        </div>
      </section>

      <section className="pulse-strip" aria-label="El pulso de hoy">
        <div className="pulse-label"><span className="live-dot red" /> EL PULSO DE HOY <time>12:46</time></div>
        <button onClick={() => go("cause")}>
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
              <button onClick={() => index === 0 && go("cause")} aria-label={`Abrir ${item.title}`}>
                <div className="news-image"><img src={item.image} alt="" /></div>
                <div className="news-body">
                  <div className="meta"><span>{item.tag}</span><time>{item.date}</time></div>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <span className="read-more">LEER MÁS <Arrow /></span>
                </div>
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="cause-teaser">
        <div className="cause-photo"><img src="/images/gustavo-abrazo.jpg" alt="Gustavo Barrera abrazando a una vecina" /></div>
        <div className="cause-copy">
          <span className="eyebrow light">CAUSA VIVA · EN CURSO</span>
          <h2>DEFENDER LO QUE LE CORRESPONDE A VILLA GESELL</h2>
          <p>Obras, recursos y derechos no son promesas: forman parte de una historia que se puede seguir, documentar y defender.</p>
          <div className="cause-progress"><span style={{ width: "72%" }} /></div>
          <div className="progress-legend"><span>Pedido presentado</span><strong>Próximo paso: audiencia</strong></div>
          <button className="button button-sky" onClick={() => go("cause")}>SEGUIR ESTA CAUSA <Arrow /></button>
        </div>
      </section>

      <section className="section agenda-games" id="agenda">
        <div className="agenda-column">
          <SectionHeading eyebrow="PRÓXIMAMENTE" title="AGENDA" />
          <article className="event-card public-event">
            <div className="event-date"><strong>15</strong><span>AGO</span></div>
            <div className="event-content">
              <span className="event-type">ENTREVISTA · TELEVISIÓN</span>
              <h3>Gustavo en Telefe</h3>
              <p>Las consecuencias de la quita del beneficio de Zona Fría.</p>
            </div>
            <button onClick={() => go("agenda")} aria-label="Ver actividad"><Arrow /></button>
          </article>
          <article className="event-card members-event">
            <div className="event-date"><strong>10</strong><span>AGO</span></div>
            <div className="event-content">
              <span className="event-type">ACTIVIDAD DE LA COMUNIDAD</span>
              <h3>Pensar 2027</h3>
              <p>Encuentro interno · ubicación disponible para miembros.</p>
            </div>
            <button onClick={() => go("agenda")} aria-label="Ver ubicación para miembros"><LockIcon /></button>
          </article>
        </div>

        <div className="games-column" id="juegos">
          <SectionHeading eyebrow="JUGAR Y APRENDER" title="NUEVO DESAFÍO" />
          <div className="peronometro-card">
            <div className="peronometro-card-image">
              <img src="/images/peronometro-peron.png" alt="Retrato editorial de Juan Domingo Perón" />
              <div className="pop-tile tile-date">17 OCT</div>
              <div className="pop-tile tile-score">%</div>
              <div className="pop-tile tile-time">10s</div>
              <PeronometroLogo compact />
            </div>
            <div className="peronometro-card-body">
              <div className="game-facts"><span>50 preguntas</span><span>10 segundos</span><span>Placa final</span></div>
              <h3>¿Qué tan peronista sos?</h3>
              <p>Historia, ideas y memoria. Respondé, descubrí tu porcentaje y desafiá a tus amigos.</p>
              <button className="button button-navy" onClick={() => go("game")}>CONOCER EL JUEGO <Arrow /></button>
            </div>
          </div>
        </div>
      </section>

      <section className="community-promo">
        <div className="community-promo-image"><img src="/images/gustavo-ninez.jpg" alt="Gustavo conversando con un niño en una actividad comunitaria" /></div>
        <div className="community-promo-copy">
          <span className="eyebrow">ESPACIO PRIVADO · CON INVITACIÓN</span>
          <h2>LA COMUNIDAD SE CONSTRUYE HABLANDO.</h2>
          <p>Debates, propuestas, territorio y organización en un espacio cuidado para el peronismo geselino.</p>
          <button className="button button-cobalt" onClick={() => go("community")}>CONOCER LA COMUNIDAD <Arrow /></button>
        </div>
      </section>
    </>
  );
}

function AgendaView({ go }: { go: (view: View) => void }) {
  return (
    <div className="inner-page agenda-page">
      <section className="inner-hero agenda-hero tech-grid">
        <div className="breadcrumb"><button onClick={() => go("home")}>Inicio</button><span>/</span><span>Agenda</span></div>
        <span className="eyebrow light">PRÓXIMAS ACTIVIDADES</span>
        <h1>AGENDA GESELINA</h1>
        <p>Información clara para saber cuándo, dónde y cómo participar.</p>
      </section>

      <section className="agenda-detail section">
        <article className="agenda-feature">
          <div className="agenda-feature-head">
            <div className="agenda-big-date"><strong>10</strong><span>AGO</span></div>
            <div><span className="event-type">ACTIVIDAD DE LA COMUNIDAD · 18:30</span><h2>PENSAR 2027</h2><p>Reunión del PJ geselino para trabajar estrategias de comunicación digital, compromiso partidario y puesta en marcha del Plan 2027.</p></div>
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
            <div><strong>UBICACIÓN DE EJEMPLO</strong><span>La dirección precisa se administra desde el panel y solo se muestra a miembros.</span></div>
            <a className="button button-cobalt" href="https://www.google.com/maps/search/?api=1&query=Villa+Gesell%2C+Buenos+Aires%2C+Argentina" target="_blank" rel="noreferrer">ABRIR EN GOOGLE MAPS <ShareIcon /></a>
          </div>
        </article>

        <aside className="agenda-side">
          <span className="eyebrow">TAMBIÉN EN AGENDA</span>
          <div className="agenda-side-event"><strong>15 AGO</strong><span>ENTREVISTA · TELEVISIÓN</span><h3>Gustavo en Telefe</h3><p>El impacto de la quita del beneficio de Zona Fría.</p></div>
          <div className="agenda-panel-note"><LockIcon /><div><strong>Agenda pública + privada</strong><p>El panel define fecha, horario, dirección, enlace de Maps y quién puede ver cada actividad.</p></div></div>
          <button className="button button-navy" onClick={() => go("community")}>INGRESAR A LA COMUNIDAD <Arrow /></button>
        </aside>
      </section>
    </div>
  );
}

function GameView({ go }: { go: (view: View) => void }) {
  return (
    <div className="inner-page peronometro-page">
      <section className="peronometro-hero">
        <div className="peronometro-collage" aria-hidden="true">
          <div className="collage-word">JUSTA</div><div className="collage-number">50</div><div className="collage-date">17<br />OCT</div><div className="collage-stripes" />
        </div>
        <img src="/images/peronometro-peron.png" alt="Juan Domingo Perón" />
        <div className="peronometro-hero-copy">
          <button className="game-back" onClick={() => go("home")}>← VOLVER</button>
          <span className="game-edition">CULTURA EN JUEGO · EDICIÓN 01</span>
          <PeronometroLogo />
          <h1>¿QUÉ TAN PERONISTA SOS?</h1>
          <p>Una carrera contra el reloj por la historia, las ideas y la memoria.</p>
          <div className="game-hero-actions"><button className="button button-game">PRÓXIMAMENTE: JUGAR <Arrow /></button><span>PROTOTIPO DE CONCEPTO</span></div>
        </div>
      </section>

      <section className="game-metrics" aria-label="Características del juego">
        <div><strong>50</strong><span>PREGUNTAS</span></div><div><strong>10s</strong><span>POR RESPUESTA</span></div><div><strong>%</strong><span>RESULTADO FINAL</span></div><div><strong>↗</strong><span>PLACA PARA COMPARTIR</span></div>
      </section>

      <section className="game-explainer section">
        <div className="game-flow-copy"><span className="eyebrow">MECÁNICA</span><h2>RÁPIDO, CLARO Y COMPARTIBLE.</h2><p>Las 50 preguntas recorren biografía, gobiernos, derechos sociales, fechas históricas y cultura popular. Las respuestas no contestadas dentro de los 10 segundos cuentan como incorrectas.</p><ol><li><strong>01</strong> Elegí una respuesta.</li><li><strong>02</strong> Mirá cómo avanza tu porcentaje.</li><li><strong>03</strong> Compartí la placa y desafiá a otra persona.</li></ol></div>
        <div className="question-demo">
          <div className="question-demo-top"><span>PREGUNTA 18 / 50</span><strong>08</strong></div>
          <div className="timer-line"><span style={{ width: "80%" }} /></div>
          <h3>¿En qué año Perón fue elegido presidente por primera vez?</h3>
          <div className="answer-grid"><button>1943</button><button>1946</button><button>1951</button><button>1955</button></div>
          <small>Ejemplo visual. La versión completa la construirá Claude sobre el banco validado de preguntas.</small>
        </div>
      </section>

      <section className="share-result">
        <div className="share-plate">
          <span>MI RESULTADO</span><PeronometroLogo compact /><strong>78%</strong><h3>CORAZÓN JUSTICIALISTA</h3><p>¿Podés superarme?</p><div>peronismogeselino · desafío 01</div>
        </div>
        <div className="share-copy"><span className="eyebrow light">EL FINAL ES EL COMIENZO</span><h2>UNA PLACA QUE INVITA A JUGAR.</h2><p>El resultado se genera en formato vertical para WhatsApp e Instagram, sin pedir datos personales ni consumir inteligencia artificial.</p><button className="button button-sky">COMPARTIR RESULTADO <ShareIcon /></button></div>
      </section>
    </div>
  );
}

function CauseView({ go }: { go: (view: View) => void }) {
  return (
    <div className="inner-page cause-page">
      <div className="inner-hero cause-inner-hero tech-grid">
        <div className="breadcrumb"><button onClick={() => go("home")}>Inicio</button><span>/</span><span>Causas vivas</span></div>
        <div className="cause-status"><span className="live-dot red" /> CAUSA ACTIVA · ACTUALIZADA EL 14 JUL 2026</div>
        <h1>DEFENDER OBRAS, RECURSOS Y DERECHOS DE VILLA GESELL</h1>
        <p>El seguimiento completo del pedido presentado por Gustavo Barrera ante Nación.</p>
        <div className="inner-hero-actions">
          <button className="button button-cream">COMPARTIR CAUSA <ShareIcon /></button>
          <button className="button button-outline-light" onClick={() => go("community")}>CONVERSAR EN LA COMUNIDAD</button>
        </div>
      </div>

      <div className="cause-layout section">
        <article className="cause-main">
          <div className="cause-lead-image"><img src="/images/gestion-obras.jpg" alt="Gustavo Barrera recorriendo una obra junto a trabajadores" /></div>
          <section className="brief-box">
            <span className="eyebrow">EN 30 SEGUNDOS</span>
            <h2>¿QUÉ ESTÁ PASANDO?</h2>
            <p>El intendente presentó una nota formal ante el jefe de Gabinete de Ministros de la Nación para solicitar una audiencia y llevar los reclamos prioritarios de Villa Gesell.</p>
            <ul>
              <li>Defensa de obras públicas pendientes.</li>
              <li>Recursos necesarios para sostener servicios locales.</li>
              <li>Protección del beneficio de Zona Fría.</li>
            </ul>
          </section>

          <section className="timeline-section">
            <span className="eyebrow">MEMORIA Y SEGUIMIENTO</span>
            <h2>LÍNEA DE TIEMPO</h2>
            <div className="timeline">
              <div className="timeline-item done"><time>09 JUL</time><div><strong>Los reclamos de los geselinos</strong><p>Se reúnen las prioridades vinculadas a gas, cloacas, obra pública y actividad turística.</p></div></div>
              <div className="timeline-item done"><time>14 JUL</time><div><strong>Presentación formal ante Nación</strong><p>Gustavo Barrera entrega el pedido de audiencia al jefe de Gabinete.</p></div></div>
              <div className="timeline-item current"><time>AHORA</time><div><strong>Esperando respuesta</strong><p>El municipio mantiene abierto el seguimiento institucional.</p></div></div>
              <div className="timeline-item"><time>PRÓXIMO</time><div><strong>Audiencia y respuesta pública</strong><p>El resultado y los documentos se incorporarán a esta causa.</p></div></div>
            </div>
          </section>
        </article>

        <aside className="cause-sidebar">
          <div className="side-card status-card">
            <span className="eyebrow">ESTADO ACTUAL</span>
            <strong>EN GESTIÓN</strong>
            <div className="cause-progress"><span style={{ width: "72%" }} /></div>
            <p>Pedido presentado. En espera de confirmación de audiencia.</p>
          </div>
          <div className="side-card data-card">
            <span className="eyebrow">DATO CLAVE</span>
            <strong>11.000+</strong>
            <p>hogares geselinos alcanzados por el beneficio de Zona Fría.</p>
          </div>
          <div className="side-card next-card">
            <span className="eyebrow">QUÉ SIGUE</span>
            <ol><li>Confirmación de audiencia</li><li>Presentación de documentos</li><li>Respuesta del Gobierno nacional</li></ol>
          </div>
          <button className="side-community" onClick={() => go("community")}>
            <span>12 conversaciones activas</span>
            <strong>DEBATIR ESTA CAUSA</strong>
            <Arrow />
          </button>
        </aside>
      </div>
    </div>
  );
}

function CommunityView({
  go,
  loggedIn,
  setLoggedIn,
  messages,
  draft,
  setDraft,
  postMessage,
}: {
  go: (view: View) => void;
  loggedIn: boolean;
  setLoggedIn: (logged: boolean) => void;
  messages: typeof initialMessages;
  draft: string;
  setDraft: (draft: string) => void;
  postMessage: (event: FormEvent) => void;
}) {
  if (!loggedIn) {
    return (
      <div className="community-login">
        <div className="community-login-image">
          <img src="/images/gustavo-abrazo.jpg" alt="Encuentro de Gustavo Barrera con la comunidad" />
          <div className="image-quote">“Cuanto más unidos estemos, más fuerte se escucha Villa Gesell.”</div>
        </div>
        <div className="community-login-panel tech-grid">
          <span className="eyebrow light">ESPACIO PRIVADO · HASTA 500 MIEMBROS</span>
          <h1>BIENVENIDO A LA COMUNIDAD.</h1>
          <p>Ingresá con la cuenta de Google que recibió la invitación por WhatsApp.</p>
          <button className="google-button" onClick={() => setLoggedIn(true)}>
            <span className="google-g">G</span>
            Continuar con Google
          </button>
          <div className="invitation-note"><LockIcon /><span>Google confirma tu identidad. El portal verifica que tu correo figure entre las invitaciones.</span></div>
          <div className="login-links"><button>¿No recibiste tu invitación?</button><button>Normas de convivencia</button></div>
          <small>Ingreso simulado para visualizar el prototipo.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="community-dashboard">
      <section className="community-welcome">
        <div><span className="eyebrow light">LA COMUNIDAD · ZONA CENTRO</span><h1>HOLA, SEBA.</h1><p>Hay 3 conversaciones nuevas y una actividad próxima.</p></div>
        <button className="profile-chip" onClick={() => setLoggedIn(false)}><span>SI</span><span>Seba I.<small>Cerrar demo</small></span></button>
      </section>

      <nav className="community-tabs" aria-label="Secciones de la comunidad">
        <button className="active">La Plaza</button><button>Causas</button><button>Territorio</button><button>Mesa de ideas</button><button>Agenda</button><button>Materiales</button>
      </nav>

      <div className="community-grid section">
        <div className="community-feed">
          <article className="pinned-announcement">
            <div className="pin-icon">!</div>
            <div><span>AVISO DE CONDUCCIÓN · FIJADO</span><h2>PENSAR 2027</h2><p>Encuentro para trabajar comunicación digital, compromiso partidario y organización territorial.</p></div>
            <div className="announcement-date"><strong>10</strong><span>AGO · 18:30</span><button onClick={() => go("agenda")}>VER ACTIVIDAD <Arrow /></button></div>
          </article>

          <article className="thread-card">
            <header className="thread-header">
              <div><span className="eyebrow">CAUSA VIVA · ZONA FRÍA</span><h2>Cuanto más unidos estemos, menos frío vamos a pasar</h2></div>
              <div className="thread-meta"><span>12 participantes</span><span>8 respuestas</span></div>
            </header>
            <div className="moderation-message"><strong>MODERACIÓN</strong><p>Abrimos esta conversación para conocer qué está pasando en cada barrio y organizar propuestas concretas. No publiques facturas ni datos personales.</p></div>
            <div className="messages">
              {messages.map((message, index) => (
                <div className="message" key={`${message.name}-${index}`}>
                  <div className={`avatar ${message.color}`}>{message.initials}</div>
                  <div className="message-body"><div><strong>{message.name}</strong><span>{message.territory} · {message.time}</span></div><p>{message.text}</p><button>Responder</button></div>
                </div>
              ))}
            </div>
            <form className="reply-box" onSubmit={postMessage}>
              <div className="avatar navy">SI</div>
              <label><span className="sr-only">Escribir una respuesta</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Sumá una propuesta o contá qué está pasando en tu barrio…" rows={2} /></label>
              <button type="submit" aria-label="Publicar respuesta"><Arrow /></button>
            </form>
          </article>
        </div>

        <aside className="community-sidebar">
          <section className="community-side-card map-card">
            <span className="eyebrow">TU TERRITORIO</span>
            <div className="territory-map"><span className="map-pin">●</span><strong>ZONA CENTRO</strong><small>Villa Gesell</small></div>
            <button>VER CONVERSACIONES DEL BARRIO <Arrow /></button>
          </section>
          <section className="community-side-card mini-agenda">
            <span className="eyebrow">PRÓXIMA ACTIVIDAD</span>
            <div><strong>10 AGO</strong><span>18:30</span></div><h3>Pensar 2027</h3><p>Lugar visible para miembros confirmados.</p>
            <div className="mini-map-wrap"><iframe title="Ubicación de Pensar 2027" src="https://www.google.com/maps?q=Villa+Gesell,+Buenos+Aires,+Argentina&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
            <a className="mini-map-link" href="https://www.google.com/maps/search/?api=1&query=Villa+Gesell%2C+Buenos+Aires%2C+Argentina" target="_blank" rel="noreferrer">ABRIR EN GOOGLE MAPS ↗</a>
            <button className="button button-cobalt">CONFIRMAR ASISTENCIA</button>
          </section>
          <section className="community-side-card community-stats"><span><strong>184</strong> miembros activos</span><span><strong>23</strong> territorios</span><span><strong>6</strong> propuestas abiertas</span></section>
        </aside>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: string }) {
  return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{action && <button>{action} <Arrow /></button>}</div>;
}

function MobileDock({ view, go, goToSection }: { view: View; go: (view: View) => void; goToSection: (id: string) => void }) {
  return <nav className="mobile-dock" aria-label="Navegación móvil"><button className={view === "home" ? "active" : ""} onClick={() => go("home")}><span>⌂</span>Inicio</button><button onClick={() => goToSection("noticias")}><span>▤</span>Noticias</button><button className={view === "cause" ? "active" : ""} onClick={() => go("cause")}><span>●</span>Causas</button><button className={view === "game" ? "active" : ""} onClick={() => go("game")}><span>◇</span>Juegos</button><button className={view === "community" ? "active" : ""} onClick={() => go("community")}><span>✦</span>Comunidad</button></nav>;
}

function Footer({ go }: { go: (view: View) => void }) {
  return <footer><div className="footer-brand"><strong>PERONISMO GESELINO</strong><span>Información, memoria y organización.</span></div><div className="footer-links"><button onClick={() => go("home")}>Portal público</button><button onClick={() => go("cause")}>Causas vivas</button><button onClick={() => go("agenda")}>Agenda</button><button onClick={() => go("game")}>Peronómetro</button><button onClick={() => go("community")}>La Comunidad</button></div><img src="/images/pj-bonaerense.png" alt="Partido Justicialista Provincia de Buenos Aires" /></footer>;
}

function PeronometroLogo({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "peronometro-logo compact" : "peronometro-logo"} aria-label="Peronómetro"><span className="meter-mark"><i /></span><span className="logo-words"><b>PERONÓ</b><b>METRO</b></span></div>;
}

function Arrow() { return <span className="arrow" aria-hidden="true">→</span>; }
function LockIcon() { return <span aria-hidden="true">◆</span>; }
function ShareIcon() { return <span aria-hidden="true">↗</span>; }
