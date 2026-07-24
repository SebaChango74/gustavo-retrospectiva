import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { Arrow } from "../ui";
import { longDate, shortDateParts, type P365Day } from "./render";
import { sharePlate } from "./share";

const SEEN_KEY = "pg_peron365_visto";

type TodayPayload = {
  day: P365Day & { isToday: boolean; quote: P365Day["quote"] & { sourceUrl: string } };
  modalEnabled: boolean;
};

/** Tarjeta de portada + emergente diario (una sola vez por día y dispositivo). */
export function Peron365Home() {
  const navigate = useNavigate();
  const [data, setData] = useState<TodayPayload | null>(null);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<TodayPayload>("/peron365/today")
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        const seen = localStorage.getItem(SEEN_KEY);
        if (payload.modalEnabled && seen !== payload.day.dayKey) {
          timerRef.current = window.setTimeout(() => {
            setOpen(true);
            localStorage.setItem(SEEN_KEY, payload.day.dayKey);
            api.post(`/peron365/days/${payload.day.dayKey}/open-event`).catch(() => {});
          }, 1800);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") setOpen(false);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [open]);

  const share = useCallback(async () => {
    if (!data) return;
    setNote(await sharePlate(data.day, "feed"));
  }, [data]);

  if (!data) return null;

  const { day } = data;
  const parts = shortDateParts(day.dayKey);

  return (
    <>
      <section className="p365-strip" aria-label="Perón 365, una idea por día">
        <button className="p365-strip-card" onClick={() => navigate("/peron365")}>
          <div className="p365-date small">
            <strong>{parts.day}</strong>
            <span>{parts.monthYear}</span>
          </div>
          <div className="p365-strip-copy">
            <span>
              PERÓN <i>365</i> · UNA IDEA POR DÍA
            </span>
            <blockquote>“{day.quote.shortText}”</blockquote>
          </div>
          <Arrow />
        </button>
      </section>

      {open && (
        <div className="p365-overlay" onClick={() => setOpen(false)}>
          <div
            className="p365-modal"
            role="dialog"
            aria-modal="true"
            aria-label="La frase de hoy de Perón 365"
            tabIndex={-1}
            ref={dialogRef}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="p365-close" onClick={() => setOpen(false)} aria-label="Cerrar">
              ✕
            </button>
            <div className="p365-modal-head">
              <span className="p365-logo">
                PERÓN <i>365</i>
              </span>
              <small>UNA IDEA POR DÍA</small>
            </div>
            <time>{longDate(day.dayKey)}</time>
            <blockquote>
              <span aria-hidden="true">“</span>
              {day.quote.text}
            </blockquote>
            <div className="p365-modal-source">
              <strong>{day.quote.author.toUpperCase()}</strong>
              <p>
                {day.quote.sourceTitle}
                {day.quote.sourceDate ? ` · ${day.quote.sourceDate}` : ""}
              </p>
            </div>
            <button className="p365-share" onClick={share}>
              COMPARTIR LA FRASE DE HOY
            </button>
            <div className="p365-actions">
              <button
                className="p365-outline"
                onClick={() => {
                  setOpen(false);
                  navigate("/peron365");
                }}
              >
                VER CONTEXTO
              </button>
              <button className="p365-outline" onClick={() => setOpen(false)}>
                CERRAR
              </button>
            </div>
            {note && <p className="p365-note-msg">{note}</p>}
          </div>
        </div>
      )}
    </>
  );
}
