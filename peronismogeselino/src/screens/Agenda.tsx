import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type EventItem } from "../api";
import { useSession } from "../session";
import { Arrow, LockIcon, ShareIcon, dayOf, monthOf, timeOf } from "../ui";

type EventsPayload = { events: EventItem[]; isMember: boolean };

export default function Agenda() {
  const navigate = useNavigate();
  const go = (path: string) => navigate(path);
  const { member } = useSession();
  const [data, setData] = useState<EventsPayload>({ events: [], isMember: false });
  const [featuredId, setFeaturedId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api
      .get<EventsPayload>("/public/events")
      .then((payload) => {
        setData(payload);
        setFeaturedId((current) => current ?? payload.events[0]?.id ?? null);
      })
      .catch(() => {});
  }, [member]);

  const featured = data.events.find((e) => e.id === featuredId) ?? data.events[0] ?? null;
  const rest = data.events.filter((e) => e.id !== featured?.id);

  const share = async (event: EventItem) => {
    const url = `${window.location.origin}/peronismogeselino/agenda`;
    const text = `${event.title} · ${dayOf(event.startsAt)} ${monthOf(event.startsAt)} ${timeOf(event.startsAt)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text, url });
      } catch {
        // cancelado
      }
    } else {
      await navigator.clipboard?.writeText(`${text} — ${url}`);
      setNotice("Actividad copiada para compartir.");
      window.setTimeout(() => setNotice(""), 2500);
    }
  };

  const addToCalendar = (event: EventItem) => {
    const dt = (iso: string) => {
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    };
    const end = event.endsAt || new Date(new Date(event.startsAt).getTime() + 2 * 3600_000).toISOString();
    const location = [event.placeName, event.address].filter(Boolean).join(" · ");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Peronismo Geselino//Agenda//ES",
      "BEGIN:VEVENT",
      `UID:pg-evento-${event.id}@gustavobarrera.com`,
      `DTSTART:${dt(event.startsAt)}`,
      `DTEND:${dt(end)}`,
      `SUMMARY:${event.title.replace(/[,;]/g, " ")}`,
      `DESCRIPTION:${(event.summary || "").replace(/[,;]/g, " ").replace(/\n/g, " ")}`,
      location ? `LOCATION:${location.replace(/[,;]/g, " ")}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.toLowerCase().replace(/\s+/g, "-")}.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const rsvp = async (event: EventItem) => {
    if (!member) {
      go("/comunidad");
      return;
    }
    try {
      await api.post(`/community/events/${event.id}/rsvp`, { response: "yes" });
      setNotice("Asistencia confirmada. ¡Nos vemos!");
      window.setTimeout(() => setNotice(""), 2500);
    } catch (error: any) {
      setNotice(error.message);
    }
  };

  const locationLocked = featured?.visibility === "members" && !featured?.mapsEmbedUrl;

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
        {featured ? (
          <article className="agenda-feature">
            {featured.image && (
              <div className="agenda-foto">
                <img src={featured.image} alt={featured.title} />
              </div>
            )}
            <div className="agenda-feature-head">
              <div className="agenda-big-date">
                <strong>{dayOf(featured.startsAt)}</strong>
                <span>{monthOf(featured.startsAt)}</span>
              </div>
              <div>
                <span className="event-type">
                  {featured.eventType} · {timeOf(featured.startsAt)}
                </span>
                <h2>{featured.title.toUpperCase()}</h2>
                <p>{featured.summary}</p>
              </div>
            </div>

            {featured.mapsEmbedUrl ? (
              <div className="map-shell">
                <iframe
                  title={`Mapa de la actividad ${featured.title}`}
                  src={featured.mapsEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <div className="map-shell map-locked">
                <div>
                  <LockIcon />
                  <strong>
                    {locationLocked
                      ? "Ubicación reservada para miembros de la comunidad."
                      : "Ubicación a confirmar."}
                  </strong>
                  {locationLocked && (
                    <button className="button button-cobalt" onClick={() => go("/comunidad")}>
                      INGRESAR A LA COMUNIDAD <Arrow />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="map-actions">
              <div>
                <strong>
                  {featured.placeName || featured.address
                    ? [featured.placeName, featured.address].filter(Boolean).join(" · ").toUpperCase()
                    : featured.visibility === "members"
                      ? "ACTIVIDAD DE LA COMUNIDAD"
                      : "ACTIVIDAD PÚBLICA"}
                </strong>
                <span>
                  {featured.visibility === "members"
                    ? "La dirección se administra desde el panel y solo se muestra a miembros."
                    : "La ubicación se administra desde el panel de control."}
                </span>
                {notice && <span className="agenda-notice">{notice}</span>}
              </div>
              <div className="map-buttons">
                {featured.googleMapsUrl && (
                  <a className="button button-cobalt" href={featured.googleMapsUrl} target="_blank" rel="noreferrer">
                    ABRIR EN GOOGLE MAPS <ShareIcon />
                  </a>
                )}
                <button className="button button-navy" onClick={() => addToCalendar(featured)}>
                  AGREGAR AL CALENDARIO
                </button>
                <button className="button button-sky" onClick={() => rsvp(featured)}>
                  CONFIRMAR ASISTENCIA
                </button>
                <button className="button button-outline" onClick={() => share(featured)}>
                  COMPARTIR <ShareIcon />
                </button>
              </div>
            </div>
          </article>
        ) : (
          <article className="agenda-feature">
            <div className="agenda-feature-head">
              <div className="agenda-big-date">
                <strong>—</strong>
                <span> </span>
              </div>
              <div>
                <span className="event-type">AGENDA</span>
                <h2>PRONTO HABRÁ ACTIVIDADES</h2>
                <p>Las próximas actividades se publican desde el panel de control.</p>
              </div>
            </div>
          </article>
        )}

        <aside className="agenda-side">
          <span className="eyebrow">TAMBIÉN EN AGENDA</span>
          {rest.map((event) => (
            <button key={event.id} className="agenda-side-event as-button" onClick={() => setFeaturedId(event.id)}>
              <strong>
                {dayOf(event.startsAt)} {monthOf(event.startsAt)}
              </strong>
              <span>{event.eventType}</span>
              <h3>{event.title}</h3>
              <p>{event.summary}</p>
            </button>
          ))}
          {rest.length === 0 && (
            <div className="agenda-side-event">
              <span>SIN MÁS ACTIVIDADES</span>
              <h3>Muy pronto</h3>
              <p>Cuando haya nuevas actividades van a aparecer acá.</p>
            </div>
          )}
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
          {!member && (
            <button className="button button-navy" onClick={() => go("/comunidad")}>
              INGRESAR A LA COMUNIDAD <Arrow />
            </button>
          )}
        </aside>
      </section>
    </div>
  );
}
