import { useState } from "react";
import { api } from "../api";
import { useList } from "./Crud";

export function Moderation() {
  const { data, error, reload } = useList("/admin/moderation");
  const [actionError, setActionError] = useState("");
  const [newThread, setNewThread] = useState({ eyebrow: "", title: "", moderationNote: "" });

  const threads = data?.threads ?? [];
  const recent = data?.recent ?? [];
  const hidden = data?.hidden ?? [];

  const updateThread = async (id: number, patch: Record<string, unknown>) => {
    try {
      await api.put(`/admin/moderation/threads/${id}`, patch);
      reload();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const moderatePost = async (id: number, status: string) => {
    const reason =
      status === "visible" ? "" : window.prompt("Motivo (queda en el registro interno):") || "";
    try {
      await api.put(`/admin/moderation/posts/${id}`, { status, reason });
      reload();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const createThread = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post("/admin/moderation/threads", newThread);
      setNewThread({ eyebrow: "", title: "", moderationNote: "" });
      reload();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  return (
    <section className="panel-module">
      <header className="panel-module-head">
        <div>
          <h2>Moderación del foro</h2>
          <p>Conversaciones, mensajes recientes y mensajes ocultados.</p>
        </div>
      </header>

      {(error || actionError) && <div className="panel-error">{error || actionError}</div>}

      <form className="panel-invite" onSubmit={createThread}>
        <input
          value={newThread.eyebrow}
          onChange={(e) => setNewThread({ ...newThread, eyebrow: e.target.value })}
          placeholder="Etiqueta (ej: CAUSA VIVA · ZONA FRÍA)"
        />
        <input
          value={newThread.title}
          onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
          placeholder="Título de la conversación"
          required
        />
        <input
          value={newThread.moderationNote}
          onChange={(e) => setNewThread({ ...newThread, moderationNote: e.target.value })}
          placeholder="Nota de moderación (visible en el hilo)"
        />
        <button className="button button-cobalt" type="submit">
          ABRIR CONVERSACIÓN
        </button>
      </form>

      <h3 className="panel-subheading">Conversaciones</h3>
      <div className="panel-table-wrap">
        <table className="panel-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Mensajes</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {threads.map((thread: any) => (
              <tr key={thread.id}>
                <td>
                  {thread.pinned ? "📌 " : ""}
                  {thread.title}
                  {thread.cause_title && <small className="panel-dim"> · {thread.cause_title}</small>}
                </td>
                <td>{thread.visible_posts}</td>
                <td>
                  {thread.status === "open" && !thread.locked && "Abierta"}
                  {thread.status === "open" && Boolean(thread.locked) && "Solo lectura"}
                  {thread.status === "closed" && "Cerrada"}
                  {thread.status === "hidden" && "Oculta"}
                </td>
                <td className="panel-row-actions">
                  <button onClick={() => updateThread(thread.id, { pinned: !thread.pinned })}>
                    {thread.pinned ? "Desfijar" : "Fijar"}
                  </button>
                  <button onClick={() => updateThread(thread.id, { locked: !thread.locked })}>
                    {thread.locked ? "Reabrir" : "Solo lectura"}
                  </button>
                  <button
                    onClick={() =>
                      updateThread(thread.id, {
                        status: thread.status === "hidden" ? "open" : "hidden",
                      })
                    }
                  >
                    {thread.status === "hidden" ? "Mostrar" : "Ocultar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="panel-subheading">Mensajes recientes</h3>
      <div className="panel-posts">
        {recent.length === 0 && <p className="panel-dim">Todavía no hay mensajes.</p>}
        {recent.map((post: any) => (
          <div className="panel-post" key={post.id}>
            <div>
              <strong>{post.member_name || "Miembro"}</strong>
              <span className="panel-dim"> en {post.thread_title}</span>
              <p>{post.body}</p>
            </div>
            <button onClick={() => moderatePost(post.id, "hidden")}>Ocultar</button>
          </div>
        ))}
      </div>

      <h3 className="panel-subheading">Mensajes ocultados</h3>
      <div className="panel-posts">
        {hidden.length === 0 && <p className="panel-dim">No hay mensajes ocultados.</p>}
        {hidden.map((post: any) => (
          <div className="panel-post hidden" key={post.id}>
            <div>
              <strong>{post.member_name || "Miembro"}</strong>
              <span className="panel-dim">
                {" "}
                en {post.thread_title}
                {post.hidden_reason ? ` · motivo: ${post.hidden_reason}` : ""}
              </span>
              <p>{post.body}</p>
            </div>
            <button onClick={() => moderatePost(post.id, "visible")}>Restaurar</button>
          </div>
        ))}
      </div>
    </section>
  );
}
