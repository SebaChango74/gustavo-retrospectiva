import { useState } from "react";
import { api } from "../api";
import { useList } from "./Crud";

type PendingItem = {
  table: string;
  label: string;
  id: number;
  title: string;
  status: string;
  author: string;
};

/** Bandeja de aprobación: lo que enviaron los editores y espera el visto bueno. */
export function Approvals() {
  const { data, error, reload } = useList("/admin/pending");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");

  const items: PendingItem[] = data?.items ?? [];

  const act = async (item: PendingItem, action: "approve" | "reject") => {
    const key = `${item.table}-${item.id}`;
    setBusy(key);
    setNote("");
    try {
      await api.post(`/admin/pending/${item.table}/${item.id}/${action}`);
      setNote(
        action === "approve"
          ? `Publicado: “${item.title}”`
          : `Devuelto a borrador: “${item.title}”`,
      );
      reload();
    } catch (err: any) {
      setNote(err.message);
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="panel-module">
      <header className="panel-module-head">
        <div>
          <h2>Aprobaciones</h2>
          <p>
            Lo que cargaron los editores no sale al portal hasta que se apruebe acá. Al aprobar se
            publica; al devolver, vuelve a borrador para que lo corrijan.
          </p>
        </div>
      </header>

      {error && <div className="panel-error">{error}</div>}
      {note && <div className="panel-ok">{note}</div>}

      {items.length === 0 ? (
        <div className="approvals-empty">
          <strong>Todo al día</strong>
          <p>No hay contenido esperando aprobación.</p>
        </div>
      ) : (
        <div className="approvals-list">
          {items.map((item) => {
            const key = `${item.table}-${item.id}`;
            return (
              <article className="approval-card" key={key}>
                <div className="approval-main">
                  <span className="approval-tag">{item.label}</span>
                  <strong>{item.title}</strong>
                  <small>
                    Enviado por {item.author}
                    {item.status === "published" ? " · listo para publicar" : ` · ${item.status}`}
                  </small>
                </div>
                <div className="approval-actions">
                  <button
                    className="button button-cobalt"
                    disabled={busy === key}
                    onClick={() => act(item, "approve")}
                  >
                    APROBAR
                  </button>
                  <button
                    className="button button-outline"
                    disabled={busy === key}
                    onClick={() => act(item, "reject")}
                  >
                    DEVOLVER
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
