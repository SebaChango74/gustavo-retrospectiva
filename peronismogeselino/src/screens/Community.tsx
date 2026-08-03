import { FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type EventItem } from "../api";
import { useSession } from "../session";
import { Ingreso } from "../Ingreso";
import { Arrow, LockIcon, dayOf, monthOf, timeOf } from "../ui";
import { TextoConEnlaces } from "../richtext";

const IMG = "/peronismogeselino/images";

type Overview = {
  announcements: {
    id: number;
    title: string;
    body: string;
    pinned: number;
    event_id: number | null;
    event_starts_at: string | null;
  }[];
  stats: { activeMembers: number; territories: number; openThreads: number };
  nextEvent:
    | (EventItem & { myRsvp: "yes" | "no" | null; confirmed: number })
    | null;
};

type ThreadSummary = {
  id: number;
  eyebrow: string;
  title: string;
  moderation_note: string;
  pinned: number;
  locked: number;
  replies: number;
  participants: number;
};

type ThreadDetail = {
  thread: {
    id: number;
    eyebrow: string;
    title: string;
    moderationNote: string;
    locked: boolean;
  };
  posts: {
    id: number;
    body: string;
    createdAt: string;
    memberName: string;
    territoryName: string;
    initials: string;
    color: string;
    mine: boolean;
  }[];
};

const TABS = [
  { key: "plaza", label: "La Plaza" },
  { key: "causas", label: "Causas" },
  { key: "territorio", label: "Territorio" },
  { key: "ideas", label: "Mesa de ideas" },
  { key: "agenda", label: "Agenda" },
  { key: "materiales", label: "Materiales" },
];

export default function Community() {
  const { member, loading } = useSession();
  const [loginError, setLoginError] = useState("");

  if (loading) {
    return <div className="inner-page" style={{ minHeight: "60vh" }} />;
  }

  if (!member) {
    return (
      <div className="community-login">
        <div className="community-login-image">
          <img src={`${IMG}/gustavo-abrazo.jpg`} alt="Encuentro de Gustavo Barrera con la comunidad" />
          <div className="image-quote">
            “Cuanto más unidos estemos, más fuerte se escucha Villa Gesell.”
          </div>
        </div>
        <div className="community-login-panel tech-grid">
          <span className="eyebrow light">ESPACIO PRIVADO · CON APROBACIÓN</span>
          <h1>BIENVENIDO A LA COMUNIDAD.</h1>
          <p>Entrá con tu nombre y tu WhatsApp. No hace falta nada más.</p>
          <Ingreso onError={setLoginError} />
          {loginError && <div className="panel-error">{loginError}</div>}
          <div className="invitation-note">
            <LockIcon />
            <span>
              Tu WhatsApp queda guardado solo para identificarte dentro de la comunidad. No se
              muestra a otros miembros ni se usa para nada más.
            </span>
          </div>
          <div className="login-links">
            <button
              onClick={() =>
                window.alert(
                  "Si es tu primera vez, completá el formulario igual: tu pedido le llega a la mesa y cuando lo apruebe entrás con el mismo WhatsApp.",
                )
              }
            >
              ¿Todavía no estás en la comunidad?
            </button>
            <button
              onClick={() =>
                window.alert(
                  "Convivencia: respeto entre compañeros, nada de datos personales de terceros y las diferencias se debaten con argumentos.",
                )
              }
            >
              Normas de convivencia
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

function Dashboard() {
  const { member, logout } = useSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState("plaza");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [openThread, setOpenThread] = useState<ThreadDetail | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [territoryInfo, setTerritoryInfo] = useState<any | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const firstName = (member!.name || "Compañero").split(/[\s@]/)[0].toUpperCase();

  const loadOverview = useCallback(() => {
    api.get<Overview>("/community/overview").then(setOverview).catch(() => {});
  }, []);

  useEffect(loadOverview, [loadOverview]);

  const loadThreads = useCallback(
    (filter: string) => {
      api
        .get<{ threads: ThreadSummary[] }>(`/community/threads?filter=${filter}`)
        .then(async (data) => {
          setThreads(data.threads);
          if (data.threads[0]) {
            const detail = await api.get<ThreadDetail>(`/community/threads/${data.threads[0].id}`);
            setOpenThread(detail);
          } else {
            setOpenThread(null);
          }
        })
        .catch((err) => setError(err.message));
    },
    [],
  );

  useEffect(() => {
    setError("");
    if (tab === "materiales") {
      api.get<{ items: any[] }>("/community/materials").then((d) => setMaterials(d.items));
    } else if (tab === "territorio") {
      api.get<any>("/community/territory").then(setTerritoryInfo);
      loadThreads("territorio");
    } else if (tab === "agenda") {
      // la agenda interna usa el próximo evento del overview + la página /agenda
    } else {
      loadThreads(tab);
    }
  }, [tab, loadThreads]);

  const expandThread = async (id: number) => {
    try {
      setOpenThread(await api.get<ThreadDetail>(`/community/threads/${id}`));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const postMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!openThread || !draft.trim()) return;
    try {
      await api.post(`/community/threads/${openThread.thread.id}/posts`, { body: draft.trim() });
      setDraft("");
      await expandThread(openThread.thread.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const rsvp = async (eventId: number, response: "yes" | "no") => {
    try {
      await api.post(`/community/events/${eventId}/rsvp`, { response });
      loadOverview();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const initials = (member!.name || "Compañero")
    .split(/[\s@]/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const nextEvent = overview?.nextEvent ?? null;

  return (
    <div className="community-dashboard">
      <section className="community-welcome">
        <div>
          <span className="eyebrow light">
            LA COMUNIDAD{member!.territoryName ? ` · ${member!.territoryName.toUpperCase()}` : ""}
          </span>
          <h1>HOLA, {firstName}.</h1>
          <p>
            {overview
              ? `Hay ${overview.stats.openThreads} conversaciones abiertas y ${
                  nextEvent ? "una actividad próxima" : "ninguna actividad próxima"
                }.`
              : "Cargando la actividad de la comunidad…"}
          </p>
        </div>
        <button
          className="profile-chip"
          onClick={async () => {
            await logout();
            navigate("/comunidad");
          }}
        >
          <span>{initials || "PG"}</span>
          <span>
            {member!.name || "Mi cuenta"}
            <small>Cerrar sesión</small>
          </span>
        </button>
      </section>

      <nav className="community-tabs" aria-label="Secciones de la comunidad">
        {TABS.map((item) => (
          <button
            key={item.key}
            className={tab === item.key ? "active" : ""}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="community-grid section">
        <div className="community-feed">
          {error && <div className="panel-error">{error}</div>}

          {tab === "plaza" &&
            (overview?.announcements ?? [])
              .filter((a) => a.pinned)
              .map((announcement) => (
                <article className="pinned-announcement" key={announcement.id}>
                  <div className="pin-icon">!</div>
                  <div>
                    <span>AVISO DE CONDUCCIÓN · FIJADO</span>
                    <h2>{announcement.title}</h2>
                    <p><TextoConEnlaces>{announcement.body}</TextoConEnlaces></p>
                  </div>
                  {announcement.event_starts_at && (
                    <div className="announcement-date">
                      <strong>{dayOf(announcement.event_starts_at)}</strong>
                      <span>
                        {monthOf(announcement.event_starts_at)} · {timeOf(announcement.event_starts_at)}
                      </span>
                      <button onClick={() => navigate("/agenda")}>
                        VER ACTIVIDAD <Arrow />
                      </button>
                    </div>
                  )}
                </article>
              ))}

          {tab === "agenda" && (
            <article className="thread-card">
              <header className="thread-header">
                <div>
                  <span className="eyebrow">AGENDA INTERNA</span>
                  <h2>{nextEvent ? nextEvent.title : "Sin actividades próximas"}</h2>
                </div>
              </header>
              {nextEvent && (
                <div className="messages" style={{ paddingBottom: 24 }}>
                  <p style={{ color: "#435367", fontSize: 13 }}>{nextEvent.summary}</p>
                  {nextEvent.mapsEmbedUrl && (
                    <div className="mini-map-wrap" style={{ height: 260 }}>
                      <iframe
                        title={`Ubicación de ${nextEvent.title}`}
                        src={nextEvent.mapsEmbedUrl}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                    <button
                      className="button button-cobalt"
                      onClick={() => rsvp(nextEvent.id, nextEvent.myRsvp === "yes" ? "no" : "yes")}
                    >
                      {nextEvent.myRsvp === "yes" ? "CANCELAR ASISTENCIA" : "CONFIRMAR ASISTENCIA"}
                    </button>
                    <button className="button button-navy" onClick={() => navigate("/agenda")}>
                      VER AGENDA COMPLETA <Arrow />
                    </button>
                  </div>
                  <p style={{ color: "#607083", fontSize: 11, marginTop: 10 }}>
                    {nextEvent.confirmed} asistencias confirmadas
                  </p>
                </div>
              )}
            </article>
          )}

          {tab === "materiales" && (
            <article className="thread-card">
              <header className="thread-header">
                <div>
                  <span className="eyebrow">MATERIALES PARA LA MILITANCIA</span>
                  <h2>Placas, documentos y enlaces</h2>
                </div>
              </header>
              <div className="messages" style={{ paddingBottom: 24 }}>
                {materials.length === 0 && (
                  <p style={{ color: "#607083" }}>Todavía no hay materiales publicados.</p>
                )}
                {materials.map((material) => (
                  <div className="message" key={material.id}>
                    <div className="avatar sky">
                      {material.kind === "document" ? "▤" : material.kind === "video" ? "▶" : "↗"}
                    </div>
                    <div className="message-body">
                      <div>
                        <strong>{material.title}</strong>
                      </div>
                      <p>{material.description}</p>
                      {material.url && (
                        <a
                          className="mini-map-link"
                          href={material.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          ABRIR MATERIAL ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}

          {tab === "territorio" && territoryInfo && (
            <article className="pinned-announcement">
              <div className="pin-icon">●</div>
              <div>
                <span>TU TERRITORIO</span>
                <h2>{territoryInfo.territory?.name ?? "SIN TERRITORIO ASIGNADO"}</h2>
                <p>
                  {territoryInfo.territory
                    ? territoryInfo.territory.description ||
                      `Conversaciones y organización de ${territoryInfo.territory.name}.`
                    : "Pedile a la administración que te asigne un territorio para ver su actividad."}
                  {territoryInfo.referentes?.length > 0 &&
                    ` Referente: ${territoryInfo.referentes.map((r: any) => r.name).join(", ")}.`}
                </p>
              </div>
            </article>
          )}

          {["plaza", "causas", "territorio", "ideas"].includes(tab) && (
            <>
              {threads.length === 0 && (
                <article className="thread-card">
                  <header className="thread-header">
                    <div>
                      <span className="eyebrow">SIN CONVERSACIONES</span>
                      <h2>Todavía no hay conversaciones acá</h2>
                    </div>
                  </header>
                  <div className="moderation-message">
                    <strong>MODERACIÓN</strong>
                    <p>La moderación abre las conversaciones desde el panel de control.</p>
                  </div>
                  <div style={{ height: 20 }} />
                </article>
              )}

              {threads.map((summary) => {
                const isOpen = openThread?.thread.id === summary.id;
                return (
                  <article className="thread-card" key={summary.id}>
                    <header className="thread-header">
                      <div>
                        <span className="eyebrow">{summary.eyebrow || "CONVERSACIÓN"}</span>
                        <h2>{summary.title}</h2>
                      </div>
                      <div className="thread-meta">
                        <span>{summary.participants} participantes</span>
                        <span>{summary.replies} respuestas</span>
                      </div>
                    </header>

                    {!isOpen && (
                      <div style={{ padding: "0 30px 24px" }}>
                        <button
                          className="button button-outline"
                          onClick={() => expandThread(summary.id)}
                        >
                          VER CONVERSACIÓN <Arrow />
                        </button>
                      </div>
                    )}

                    {isOpen && openThread && (
                      <>
                        {openThread.thread.moderationNote && (
                          <div className="moderation-message">
                            <strong>MODERACIÓN</strong>
                            <p>{openThread.thread.moderationNote}</p>
                          </div>
                        )}
                        <div className="messages">
                          {openThread.posts.length === 0 && (
                            <p style={{ color: "#607083", fontSize: 13, padding: "14px 0" }}>
                              Sé la primera persona en participar.
                            </p>
                          )}
                          {openThread.posts.map((post) => (
                            <div className="message" key={post.id}>
                              <div className={`avatar ${post.color}`}>{post.initials}</div>
                              <div className="message-body">
                                <div>
                                  <strong>{post.memberName}</strong>
                                  <span>
                                    {post.territoryName ? `${post.territoryName} · ` : ""}
                                    {timeOf(post.createdAt)}
                                  </span>
                                </div>
                                <p>{post.body}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {openThread.thread.locked ? (
                          <div className="moderation-message" style={{ marginBottom: 24 }}>
                            <strong>SOLO LECTURA</strong>
                            <p>Esta conversación fue cerrada por la moderación.</p>
                          </div>
                        ) : (
                          <form className="reply-box" onSubmit={postMessage}>
                            <div className="avatar navy">{initials || "PG"}</div>
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
                        )}
                      </>
                    )}
                  </article>
                );
              })}
            </>
          )}
        </div>

        <aside className="community-sidebar">
          <section className="community-side-card map-card">
            <span className="eyebrow">TU TERRITORIO</span>
            <div className="territory-map">
              <span className="map-pin">●</span>
              <strong>{(member!.territoryName || "VILLA GESELL").toUpperCase()}</strong>
              <small>Villa Gesell</small>
            </div>
            <button onClick={() => setTab("territorio")}>
              VER CONVERSACIONES DEL BARRIO <Arrow />
            </button>
          </section>

          {nextEvent && (
            <section className="community-side-card mini-agenda">
              <span className="eyebrow">PRÓXIMA ACTIVIDAD</span>
              <div>
                <strong>
                  {dayOf(nextEvent.startsAt)} {monthOf(nextEvent.startsAt)}
                </strong>
                <span>{timeOf(nextEvent.startsAt)}</span>
              </div>
              <h3>{nextEvent.title}</h3>
              <p>
                {nextEvent.placeName || nextEvent.address
                  ? `${nextEvent.placeName}${nextEvent.address ? ` · ${nextEvent.address}` : ""}`
                  : "Lugar visible para miembros confirmados."}
              </p>
              {nextEvent.mapsEmbedUrl && (
                <div className="mini-map-wrap">
                  <iframe
                    title={`Ubicación de ${nextEvent.title}`}
                    src={nextEvent.mapsEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
              {nextEvent.googleMapsUrl && (
                <a
                  className="mini-map-link"
                  href={nextEvent.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  ABRIR EN GOOGLE MAPS ↗
                </a>
              )}
              <button
                className="button button-cobalt"
                onClick={() => rsvp(nextEvent.id, nextEvent.myRsvp === "yes" ? "no" : "yes")}
              >
                {nextEvent.myRsvp === "yes" ? "ASISTENCIA CONFIRMADA ✓" : "CONFIRMAR ASISTENCIA"}
              </button>
            </section>
          )}

          {overview && (
            <section className="community-side-card community-stats">
              <span>
                <strong>{overview.stats.activeMembers}</strong> miembros activos
              </span>
              <span>
                <strong>{overview.stats.territories}</strong> territorios
              </span>
              <span>
                <strong>{overview.stats.openThreads}</strong> conversaciones abiertas
              </span>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
