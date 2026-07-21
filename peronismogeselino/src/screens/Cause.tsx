import { useNavigate } from "react-router-dom";
import { Arrow, ShareIcon } from "../ui";

const IMG = "/peronismogeselino/images";

export default function Cause() {
  const navigate = useNavigate();
  const go = (path: string) => navigate(path);

  return (
    <div className="inner-page cause-page">
      <div className="inner-hero cause-inner-hero tech-grid">
        <div className="breadcrumb">
          <button onClick={() => go("/")}>Inicio</button>
          <span>/</span>
          <span>Causas vivas</span>
        </div>
        <div className="cause-status">
          <span className="live-dot red" /> CAUSA ACTIVA · ACTUALIZADA EL 14 JUL 2026
        </div>
        <h1>DEFENDER OBRAS, RECURSOS Y DERECHOS DE VILLA GESELL</h1>
        <p>El seguimiento completo del pedido presentado por Gustavo Barrera ante Nación.</p>
        <div className="inner-hero-actions">
          <button className="button button-cream">
            COMPARTIR CAUSA <ShareIcon />
          </button>
          <button className="button button-outline-light" onClick={() => go("/comunidad")}>
            CONVERSAR EN LA COMUNIDAD
          </button>
        </div>
      </div>

      <div className="cause-layout section">
        <article className="cause-main">
          <div className="cause-lead-image">
            <img
              src={`${IMG}/gestion-obras.jpg`}
              alt="Gustavo Barrera recorriendo una obra junto a trabajadores"
            />
          </div>
          <section className="brief-box">
            <span className="eyebrow">EN 30 SEGUNDOS</span>
            <h2>¿QUÉ ESTÁ PASANDO?</h2>
            <p>
              El intendente presentó una nota formal ante el jefe de Gabinete de Ministros de la
              Nación para solicitar una audiencia y llevar los reclamos prioritarios de Villa
              Gesell.
            </p>
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
              <div className="timeline-item done">
                <time>09 JUL</time>
                <div>
                  <strong>Los reclamos de los geselinos</strong>
                  <p>
                    Se reúnen las prioridades vinculadas a gas, cloacas, obra pública y actividad
                    turística.
                  </p>
                </div>
              </div>
              <div className="timeline-item done">
                <time>14 JUL</time>
                <div>
                  <strong>Presentación formal ante Nación</strong>
                  <p>Gustavo Barrera entrega el pedido de audiencia al jefe de Gabinete.</p>
                </div>
              </div>
              <div className="timeline-item current">
                <time>AHORA</time>
                <div>
                  <strong>Esperando respuesta</strong>
                  <p>El municipio mantiene abierto el seguimiento institucional.</p>
                </div>
              </div>
              <div className="timeline-item">
                <time>PRÓXIMO</time>
                <div>
                  <strong>Audiencia y respuesta pública</strong>
                  <p>El resultado y los documentos se incorporarán a esta causa.</p>
                </div>
              </div>
            </div>
          </section>
        </article>

        <aside className="cause-sidebar">
          <div className="side-card status-card">
            <span className="eyebrow">ESTADO ACTUAL</span>
            <strong>EN GESTIÓN</strong>
            <div className="cause-progress">
              <span style={{ width: "72%" }} />
            </div>
            <p>Pedido presentado. En espera de confirmación de audiencia.</p>
          </div>
          <div className="side-card data-card">
            <span className="eyebrow">DATO CLAVE</span>
            <strong>11.000+</strong>
            <p>hogares geselinos alcanzados por el beneficio de Zona Fría.</p>
          </div>
          <div className="side-card next-card">
            <span className="eyebrow">QUÉ SIGUE</span>
            <ol>
              <li>Confirmación de audiencia</li>
              <li>Presentación de documentos</li>
              <li>Respuesta del Gobierno nacional</li>
            </ol>
          </div>
          <button className="side-community" onClick={() => go("/comunidad")}>
            <span>12 conversaciones activas</span>
            <strong>DEBATIR ESTA CAUSA</strong>
            <Arrow />
          </button>
        </aside>
      </div>
    </div>
  );
}
