import { useNavigate } from "react-router-dom";
import { Arrow, LockIcon, PeronometroLogo } from "../ui";

const IMG = "/peronismogeselino/images";

export default function Presentacion() {
  const navigate = useNavigate();
  const go = (path: string) => navigate(path);

  return (
    <div className="inner-page guide-page">
      <section className="inner-hero tech-grid">
        <div className="breadcrumb">
          <button onClick={() => go("/")}>Inicio</button>
          <span>/</span>
          <span>Guía del portal</span>
        </div>
        <span className="eyebrow light">PRESENTACIÓN</span>
        <h1>QUÉ ES PERONISMO GESELINO</h1>
        <p>
          No es una página más: es la plataforma propia del peronismo de Villa Gesell.
          Información, memoria, juego y organización — todo en un mismo lugar, administrado por
          nosotros.
        </p>
      </section>

      <section className="section guide-idea">
        <div className="guide-idea-copy">
          <span className="eyebrow">LA IDEA EN UNA FRASE</span>
          <h2>UNA NOTICIA DURA UN DÍA. UNA CAUSA SIGUE VIVA.</h2>
          <p>
            En las redes todo se pierde a las pocas horas. Acá, cada tema importante queda abierto
            con su historia completa: qué se pidió, qué se logró, qué falta. La gente no lee una
            noticia suelta — acompaña una causa.
          </p>
        </div>
        <div className="guide-idea-photo">
          <img src={`${IMG}/gustavo-abrazo.jpg`} alt="Gustavo Barrera abrazando a una vecina" />
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">HOY, FUNCIONANDO</span>
            <h2>LO QUE YA TIENE</h2>
          </div>
        </div>
        <div className="guide-grid">
          <button className="guide-card" onClick={() => go("/")}>
            <span className="guide-icon">▤</span>
            <h3>NOTICIAS</h3>
            <p>
              Lo que está pasando, con foto, etiqueta y destacadas. Se cargan desde el panel y
              aparecen al instante.
            </p>
            <span className="read-more">VER <Arrow /></span>
          </button>
          <button className="guide-card" onClick={() => go("/causas")}>
            <span className="guide-icon">●</span>
            <h3>CAUSAS VIVAS</h3>
            <p>
              La marca del portal: cada causa con su ficha, su dato clave, su barra de avance y su
              línea de tiempo. Memoria que no se borra.
            </p>
            <span className="read-more">VER <Arrow /></span>
          </button>
          <button className="guide-card" onClick={() => go("/agenda")}>
            <span className="guide-icon">◆</span>
            <h3>AGENDA + MAPA</h3>
            <p>
              Actividades públicas para todos e internas solo para la comunidad: la ubicación de un
              encuentro interno nunca se muestra afuera. Con Google Maps, calendario y compartir.
            </p>
            <span className="read-more">VER <Arrow /></span>
          </button>
          <button className="guide-card dark" onClick={() => go("/juegos")}>
            <PeronometroLogo compact />
            <h3>PERONÓMETRO</h3>
            <p>
              50 preguntas sobre Perón, 10 segundos cada una. Porcentaje final, rango y una placa
              lista para desafiar por WhatsApp. La puerta de entrada para los que todavía no
              militan.
            </p>
            <span className="read-more">JUGAR <Arrow /></span>
          </button>
          <button className="guide-card" onClick={() => go("/comunidad")}>
            <span className="guide-icon">✦</span>
            <h3>LA COMUNIDAD</h3>
            <p>
              Espacio privado con invitación e ingreso con Google: foro por causas y por barrio,
              anuncios de conducción, materiales y territorios. Hasta 500 miembros.
            </p>
            <span className="read-more">CONOCER <Arrow /></span>
          </button>
          <button className="guide-card" onClick={() => go("/panel")}>
            <span className="guide-icon">⚙</span>
            <h3>PANEL DE CONTROL</h3>
            <p>
              Todo lo anterior se administra sin programadores: cargar contenido es llenar un
              formulario. Roles de administración, edición, moderación y referentes territoriales.
            </p>
            <span className="read-more">ENTRAR <Arrow /></span>
          </button>
        </div>
      </section>

      <section className="guide-how">
        <div className="section guide-how-inner">
          <span className="eyebrow light">ASÍ SE CARGA</span>
          <h2>PUBLICAR ES ASÍ DE SIMPLE</h2>
          <ol className="guide-steps">
            <li>
              <strong>01</strong>
              <div>
                <b>Entrar al panel</b>
                <p>Con tu cuenta autorizada. Cada persona ve solo los módulos de su rol.</p>
              </div>
            </li>
            <li>
              <strong>02</strong>
              <div>
                <b>+ Nuevo y completar</b>
                <p>Título, texto, foto, fecha… un formulario simple por cada tipo de contenido.</p>
              </div>
            </li>
            <li>
              <strong>03</strong>
              <div>
                <b>Publicar cuando esté listo</b>
                <p>
                  Todo tiene estado borrador o publicado: se puede preparar contenido con tiempo y
                  mostrarlo recién cuando se decida.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LO QUE VIENE</span>
            <h2>ESTO RECIÉN EMPIEZA</h2>
          </div>
        </div>
        <div className="guide-roadmap">
          <div className="guide-roadmap-item">
            <span className="guide-tag now">AL APROBAR</span>
            <h3>Salida oficial</h3>
            <p>
              Dirección definitiva dentro del entorno de gustavobarrera.com, ingreso real con
              Google, lista de invitados cargada, dirección real en el mapa y revisión final de las
              50 preguntas.
            </p>
          </div>
          <div className="guide-roadmap-item">
            <span className="guide-tag">PRÓXIMA ETAPA</span>
            <h3>Encuestas</h3>
            <p>
              Consultas a la comunidad y al vecindario: opiniones por barrio, prioridades y
              temperatura de cada tema, con resultados en el panel.
            </p>
          </div>
          <div className="guide-roadmap-item">
            <span className="guide-tag">PRÓXIMA ETAPA</span>
            <h3>Organización electoral</h3>
            <p>
              Herramientas para el trabajo territorial y la organización de fiscales y referentes,
              con máxima protección de los datos personales.
            </p>
          </div>
          <div className="guide-roadmap-item">
            <span className="guide-tag">SIEMPRE</span>
            <h3>Crecer sin mezclarse</h3>
            <p>
              La app vive separada de la web personal de Gustavo: cada una evoluciona a su ritmo,
              sin pisarse, compartiendo solo la puerta de entrada.
            </p>
          </div>
        </div>
      </section>

      <section className="guide-note">
        <LockIcon />
        <p>
          Estás viendo una <b>versión de prueba privada</b>. Nada de esto está publicado: la clave
          de ingreso existe para poder revisar tranquilos. La decisión de cuándo y cómo sale es de
          la conducción.
        </p>
        <button className="button button-cream" onClick={() => go("/")}>
          RECORRER EL PORTAL <Arrow />
        </button>
      </section>
    </div>
  );
}
