import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useSession } from "../session";
import { Arrow } from "../ui";
import { photoForTheme, longDate, shortDateParts, type P365Day } from "../peron365/render";
import { downloadPlate, sharePlate } from "../peron365/share";

type DayPayload = P365Day & {
  isToday: boolean;
  saved: boolean;
  quote: P365Day["quote"] & { sourceUrl: string; context: string };
};

export default function Peron365() {
  const params = useParams();
  if (params.date === "archivo") return <Archivo />;
  return <DayView />;
}

function DayView() {
  const navigate = useNavigate();
  const params = useParams();
  const { member } = useSession();
  const [day, setDay] = useState<DayPayload | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDay(null);
    setNotFound(false);
    setShowContext(false);
    const path = params.date ? `/peron365/days/${params.date}` : "/peron365/today";
    api
      .get<{ day: DayPayload }>(path)
      .then((data) => {
        setDay(data.day);
        setSaved(data.day.saved);
      })
      .catch(() => setNotFound(true));
  }, [params.date]);

  const share = useCallback(async () => {
    if (!day) return;
    setNote(await sharePlate(day, "feed"));
  }, [day]);

  const toggleSave = async () => {
    if (!day) return;
    if (!member) {
      setNote("Guardar frases es para miembros de la comunidad.");
      return;
    }
    try {
      const result = await api.post<{ saved: boolean }>(`/peron365/days/${day.dayKey}/save`);
      setSaved(result.saved);
      setNote(result.saved ? "Frase guardada en tu colección." : "Frase quitada de tu colección.");
    } catch (error: any) {
      setNote(error.message);
    }
  };

  const converse = async () => {
    if (!day) return;
    try {
      await api.post(`/peron365/days/${day.dayKey}/thread`);
      navigate("/comunidad");
    } catch (error: any) {
      setNote(error.message);
    }
  };

  if (notFound) {
    return (
      <div className="p365-page">
        <div className="p365-header">
          <button className="game-back" onClick={() => navigate("/")}>
            ← VOLVER
          </button>
          <div className="p365-brand">
            <span className="p365-logo">
              PERÓN <i>365</i>
            </span>
            <small>UNA IDEA POR DÍA</small>
          </div>
          <span className="p365-orb" aria-hidden="true" />
        </div>
        <div className="p365-card" style={{ textAlign: "center", padding: 60 }}>
          <p style={{ color: "#5c564c", fontSize: 15 }}>
            No hay frase para esa fecha. El almanaque empezó hace poco.
          </p>
          <button className="p365-share" onClick={() => navigate("/peron365")}>
            VER LA FRASE DE HOY
          </button>
        </div>
      </div>
    );
  }

  if (!day) return <div className="p365-page" style={{ minHeight: "70vh" }} />;

  const parts = shortDateParts(day.dayKey);

  return (
    <div className="p365-page">
      <div className="p365-header">
        <button className="game-back" onClick={() => navigate("/")}>
          ← VOLVER
        </button>
        <div className="p365-brand">
          <span className="p365-logo">
            PERÓN <i>365</i>
          </span>
          <small>UNA IDEA POR DÍA</small>
        </div>
        <span className="p365-orb" aria-hidden="true" />
      </div>

      <article className="p365-card">
        <div className="p365-card-bar" aria-hidden="true" />
        <header className="p365-card-head">
          <span className="p365-eyebrow">{day.isToday ? "LA FRASE DE HOY" : "FRASE DEL DÍA"}</span>
          <time>{longDate(day.dayKey)}</time>
        </header>

        <div className="p365-photo">
          <img src={photoForTheme(day.theme)} alt="Juan Domingo Perón sonriendo" />
          <div className="p365-date" aria-hidden="true">
            <strong>{parts.day}</strong>
            <span>{parts.monthYear}</span>
          </div>
        </div>

        <blockquote className="p365-quote">
          <span aria-hidden="true">“</span>
          {day.quote.text}
        </blockquote>

        <div className="p365-divider" aria-hidden="true" />

        <div className="p365-source">
          <strong>{day.quote.author.toUpperCase()}</strong>
          <p>{day.quote.sourceTitle}</p>
          {day.quote.sourceDate && <p>{day.quote.sourceDate}</p>}
        </div>

        <button className="p365-share" onClick={share}>
          COMPARTIR LA FRASE
        </button>
        <div className="p365-actions">
          <button className={saved ? "p365-outline active" : "p365-outline"} onClick={toggleSave}>
            {saved ? "GUARDADA ✓" : "GUARDAR"}
          </button>
          <button className="p365-outline" onClick={() => setShowContext(!showContext)}>
            VER CONTEXTO
          </button>
        </div>

        {showContext && (
          <div className="p365-context">
            <p>{day.quote.context || "El contexto histórico se carga desde el panel."}</p>
            {day.quote.sourceUrl && (
              <a href={day.quote.sourceUrl} target="_blank" rel="noreferrer">
                VER FUENTE DOCUMENTAL ↗
              </a>
            )}
          </div>
        )}

        {note && <p className="p365-note-msg">{note}</p>}
        <p className="p365-verified">Esta frase fue verificada y conserva su fuente histórica.</p>
        <button className="p365-mini-link" onClick={() => downloadPlate(day, "story")}>
          Descargar versión para historias (9:16)
        </button>
      </article>

      <button className="p365-community" onClick={converse}>
        <div>
          <span>COMUNIDAD</span>
          <strong>¿Qué significa esta idea hoy en Villa Gesell?</strong>
        </div>
        <Arrow />
      </button>

      <div className="p365-footer-nav">
        <button onClick={() => navigate(`/peron365/${addDays(day.dayKey, -1)}`)}>
          ← Día anterior
        </button>
        <button onClick={() => navigate("/peron365/archivo")}>Archivo</button>
        {!day.isToday && (
          <button onClick={() => navigate("/peron365")}>La frase de hoy →</button>
        )}
      </div>
    </div>
  );
}

function Archivo() {
  const navigate = useNavigate();
  const [days, setDays] = useState<
    { dayKey: string; shortText: string; sourceTitle: string }[]
  >([]);

  useEffect(() => {
    api
      .get<{ days: { dayKey: string; shortText: string; sourceTitle: string }[] }>(
        "/peron365/archive",
      )
      .then((data) => setDays(data.days))
      .catch(() => {});
  }, []);

  return (
    <div className="p365-page">
      <div className="p365-header">
        <button className="game-back" onClick={() => navigate("/peron365")}>
          ← VOLVER
        </button>
        <div className="p365-brand">
          <span className="p365-logo">
            PERÓN <i>365</i>
          </span>
          <small>ARCHIVO · UNA IDEA POR DÍA</small>
        </div>
        <span className="p365-orb" aria-hidden="true" />
      </div>

      <div className="p365-archive">
        {days.map((item) => {
          const parts = shortDateParts(item.dayKey);
          return (
            <button
              key={item.dayKey}
              className="p365-archive-item"
              onClick={() => navigate(`/peron365/${item.dayKey}`)}
            >
              <div className="p365-date small">
                <strong>{parts.day}</strong>
                <span>{parts.monthYear}</span>
              </div>
              <div>
                <blockquote>“{item.shortText}”</blockquote>
                <small>{item.sourceTitle}</small>
              </div>
              <Arrow />
            </button>
          );
        })}
        {days.length === 0 && (
          <p style={{ color: "rgba(255,255,255,.6)", padding: 30 }}>
            El archivo se construye día a día.
          </p>
        )}
      </div>
    </div>
  );
}

function addDays(dayKey: string, delta: number): string {
  const date = new Date(`${dayKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}
