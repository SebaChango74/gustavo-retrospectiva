import { useNavigate } from "react-router-dom";
import { Arrow, PeronometroLogo, ShareIcon } from "../ui";

const IMG = "/peronismogeselino/images";

export default function Game() {
  const navigate = useNavigate();
  const go = (path: string) => navigate(path);

  return (
    <div className="inner-page peronometro-page">
      <section className="peronometro-hero">
        <div className="peronometro-collage" aria-hidden="true">
          <div className="collage-word">JUSTA</div>
          <div className="collage-number">50</div>
          <div className="collage-date">
            17
            <br />
            OCT
          </div>
          <div className="collage-stripes" />
        </div>
        <img src={`${IMG}/peronometro-peron.png`} alt="Juan Domingo Perón" />
        <div className="peronometro-hero-copy">
          <button className="game-back" onClick={() => go("/")}>
            ← VOLVER
          </button>
          <span className="game-edition">CULTURA EN JUEGO · EDICIÓN 01</span>
          <PeronometroLogo />
          <h1>¿QUÉ TAN PERONISTA SOS?</h1>
          <p>Una carrera contra el reloj por la historia, las ideas y la memoria.</p>
          <div className="game-hero-actions">
            <button className="button button-game">
              PRÓXIMAMENTE: JUGAR <Arrow />
            </button>
            <span>PROTOTIPO DE CONCEPTO</span>
          </div>
        </div>
      </section>

      <section className="game-metrics" aria-label="Características del juego">
        <div>
          <strong>50</strong>
          <span>PREGUNTAS</span>
        </div>
        <div>
          <strong>10s</strong>
          <span>POR RESPUESTA</span>
        </div>
        <div>
          <strong>%</strong>
          <span>RESULTADO FINAL</span>
        </div>
        <div>
          <strong>↗</strong>
          <span>PLACA PARA COMPARTIR</span>
        </div>
      </section>

      <section className="game-explainer section">
        <div className="game-flow-copy">
          <span className="eyebrow">MECÁNICA</span>
          <h2>RÁPIDO, CLARO Y COMPARTIBLE.</h2>
          <p>
            Las 50 preguntas recorren biografía, gobiernos, derechos sociales, fechas históricas y
            cultura popular. Las respuestas no contestadas dentro de los 10 segundos cuentan como
            incorrectas.
          </p>
          <ol>
            <li>
              <strong>01</strong> Elegí una respuesta.
            </li>
            <li>
              <strong>02</strong> Mirá cómo avanza tu porcentaje.
            </li>
            <li>
              <strong>03</strong> Compartí la placa y desafiá a otra persona.
            </li>
          </ol>
        </div>
        <div className="question-demo">
          <div className="question-demo-top">
            <span>PREGUNTA 18 / 50</span>
            <strong>08</strong>
          </div>
          <div className="timer-line">
            <span style={{ width: "80%" }} />
          </div>
          <h3>¿En qué año Perón fue elegido presidente por primera vez?</h3>
          <div className="answer-grid">
            <button>1943</button>
            <button>1946</button>
            <button>1951</button>
            <button>1955</button>
          </div>
          <small>Ejemplo visual. El juego completo se habilita en la sección Peronómetro.</small>
        </div>
      </section>

      <section className="share-result">
        <div className="share-plate">
          <span>MI RESULTADO</span>
          <PeronometroLogo compact />
          <strong>78%</strong>
          <h3>CORAZÓN JUSTICIALISTA</h3>
          <p>¿Podés superarme?</p>
          <div>peronismogeselino · desafío 01</div>
        </div>
        <div className="share-copy">
          <span className="eyebrow light">EL FINAL ES EL COMIENZO</span>
          <h2>UNA PLACA QUE INVITA A JUGAR.</h2>
          <p>
            El resultado se genera en formato vertical para WhatsApp e Instagram, sin pedir datos
            personales ni consumir inteligencia artificial.
          </p>
          <button className="button button-sky">
            COMPARTIR RESULTADO <ShareIcon />
          </button>
        </div>
      </section>
    </div>
  );
}
