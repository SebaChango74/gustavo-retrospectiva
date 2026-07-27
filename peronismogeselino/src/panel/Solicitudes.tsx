import { useState } from "react";
import { api } from "../api";
import { useList } from "./Crud";

type Solicitud = {
  id: number;
  name: string;
  phone_display: string;
  phone_link: string;
  affiliate_number: string;
  created_at: string;
};

/**
 * Pedidos de ingreso a la comunidad. Nadie entra hasta que se aprueba acá.
 * Al aprobar queda como miembro y ya puede entrar con el mismo WhatsApp.
 */
export function Solicitudes() {
  const { data, error, reload } = useList("/admin/requests");
  const territorios = useList("/admin/territories");
  const [busy, setBusy] = useState(0);
  const [nota, setNota] = useState("");
  const [destino, setDestino] = useState<Record<number, string>>({});

  const items: Solicitud[] = data?.items ?? [];

  const decidir = async (item: Solicitud, accion: "approve" | "reject") => {
    setBusy(item.id);
    setNota("");
    try {
      await api.post(`/admin/requests/${item.id}/${accion}`, {
        territoryId: destino[item.id] || null,
      });
      setNota(
        accion === "approve"
          ? `${item.name} ya puede entrar. Avisale por WhatsApp.`
          : `Pedido de ${item.name} rechazado.`,
      );
      reload();
    } catch (err: any) {
      setNota(err.message);
    } finally {
      setBusy(0);
    }
  };

  return (
    <section className="panel-module">
      <header className="panel-module-head">
        <div>
          <h2>Pedidos de ingreso</h2>
          <p>
            Quien completa el formulario de la comunidad aparece acá. Aprobalo si lo conocés; si no,
            escribile por WhatsApp antes de decidir.
          </p>
        </div>
      </header>

      {error && <div className="panel-error">{error}</div>}
      {nota && <div className="panel-ok">{nota}</div>}

      {!data && !error ? (
        <div className="approvals-empty">
          <p>Buscando pedidos…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="approvals-empty">
          <strong>Sin pedidos</strong>
          <p>No hay nadie esperando entrar.</p>
        </div>
      ) : (
        <div className="approvals-list">
          {items.map((item) => (
            <article className="approval-card" key={item.id}>
              <div className="approval-main">
                <span className="approval-tag">Ingreso</span>
                <strong>{item.name}</strong>
                <small>
                  <a href={item.phone_link} target="_blank" rel="noreferrer">
                    {item.phone_display}
                  </a>
                  {item.affiliate_number ? ` · afiliado ${item.affiliate_number}` : " · sin afiliado"}
                  {` · ${item.created_at.slice(0, 10)}`}
                </small>
              </div>
              <div className="approval-actions">
                <select
                  value={destino[item.id] ?? ""}
                  onChange={(e) => setDestino({ ...destino, [item.id]: e.target.value })}
                >
                  <option value="">Sin territorio</option>
                  {(territorios.data?.items ?? []).map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  className="button button-cobalt"
                  disabled={busy === item.id}
                  onClick={() => decidir(item, "approve")}
                >
                  APROBAR
                </button>
                <button
                  className="button button-outline"
                  disabled={busy === item.id}
                  onClick={() => decidir(item, "reject")}
                >
                  RECHAZAR
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
