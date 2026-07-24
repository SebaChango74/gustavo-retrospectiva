import { useNavigate } from "react-router-dom";
import { Arrow, PeronometroLogo } from "../ui";

export default function Presentacion() {
  const navigate = useNavigate();

  return (
    <div className="inner-page guide-page">
      <section className="inner-hero tech-grid">
        <div className="breadcrumb">
          <span>Peronismo Geselino</span>
          <span>/</span>
          <span>Guía del portal</span>
        </div>
        <span className="eyebrow light">PRESENTACIÓN</span>
        <h1>QUÉ ES PERONISMO GESELINO</h1>
        <p>
          No es una página más: es la plataforma propia del peronismo de Villa Gesell.
          Información, memoria, juego y organización — todo en un mismo lugar, administrado por
          nosotros. Este es un recorrido por lo que hace y lo que viene.
        </p>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">HOY, FUNCIONANDO</span>
            <h2>LO QUE YA TIENE</h2>
          </div>
        </div>
        <div className="guide-grid">
          <article className="guide-card">
            <span className="guide-icon">▤</span>
            <h3>NOTICIAS</h3>
            <p>
              Lo que está pasando, con foto, etiqueta y destacadas. Cada noticia abre su propia
              página y se comparte con un toque.
            </p>
          </article>
          <article className="guide-card">
            <span className="guide-icon">●</span>
            <h3>CAUSAS VIVAS</h3>
            <p>
              La marca del portal: cada causa con su ficha, su dato clave, su barra de avance y su
              línea de tiempo. La información no se pierde a las pocas horas como en las redes;
              queda abierta con su historia completa —qué se pidió, qué se logró, qué falta— y la
              gente acompaña la causa.
            </p>
          </article>
          <article className="guide-card">
            <span className="guide-icon">◆</span>
            <h3>AGENDA + MAPA</h3>
            <p>
              Actividades públicas para todos e internas solo para la comunidad: la ubicación de un
              encuentro interno nunca se muestra afuera. Con Google Maps, agregar al calendario y
              compartir.
            </p>
          </article>
          <article className="guide-card dark">
            <PeronometroLogo compact />
            <h3>PERONÓMETRO</h3>
            <p>
              50 preguntas sobre Perón, 10 segundos cada una. Porcentaje final, rango y una placa
              lista para desafiar por WhatsApp. La puerta de entrada para los que todavía no
              militan.
            </p>
          </article>
          <article className="guide-card p365">
            <span className="guide-icon p365-icon">
              365<i />
            </span>
            <h3>PERÓN 365</h3>
            <p>
              Una idea por día: una frase documentada de Perón, con su fuente histórica, que
              aparece cada mañana y se convierte en una placa lista para compartir. Cada frase tiene
              su enlace permanente y su archivo.
            </p>
          </article>
          <article className="guide-card">
            <span className="guide-icon">✦</span>
            <h3>LA COMUNIDAD</h3>
            <p>
              Espacio privado con invitación e ingreso con Google: foro por causas y por barrio,
              anuncios de conducción, materiales y territorios. Hasta 500 miembros.
            </p>
          </article>
        </div>
      </section>

      <section className="guide-how">
        <div className="section guide-how-inner">
          <span className="eyebrow light">SIN PROGRAMADORES</span>
          <h2>PUBLICAR ES ASÍ DE SIMPLE</h2>
          <p className="guide-how-lead">
            Todo el contenido se administra desde un panel de control con roles (administración,
            edición, moderación y referentes territoriales). Cargar algo es llenar un formulario.
          </p>
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

      <section className="guide-cta">
        <span className="eyebrow light">FIN DEL RECORRIDO</span>
        <h2>AHORA SÍ, ENTRÁ A CONOCERLO.</h2>
        <p>Recorré el portal completo, jugá al Peronómetro y mirá la frase del día.</p>
        <button className="button button-game guide-cta-button" onClick={() => navigate("/")}>
          INGRESAR A LA APP <Arrow />
        </button>
      </section>
    </div>
  );
}
