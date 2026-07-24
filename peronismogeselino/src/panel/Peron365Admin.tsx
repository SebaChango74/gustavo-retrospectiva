import { useState } from "react";
import { api } from "../api";
import { Crud, useList } from "./Crud";

const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "in_review", label: "En revisión" },
  { value: "verified", label: "Verificada ✓" },
  { value: "rejected", label: "Rechazada" },
];

export function Peron365Admin() {
  return (
    <>
      <Calendar />
      <Crud
        title="Perón 365 · biblioteca de frases"
        subtitle="Solo las frases «Verificadas» entran al selector diario. Cada una necesita su fuente documental."
        path="/admin/peron365/quotes"
        columns={[
          { key: "text", label: "Frase", render: (r) => `“${r.text.slice(0, 70)}${r.text.length > 70 ? "…" : ""}”` },
          { key: "source_title", label: "Fuente" },
          {
            key: "verification_status",
            label: "Estado",
            render: (r) =>
              STATUS_OPTIONS.find((s) => s.value === r.verification_status)?.label ??
              r.verification_status,
          },
          { key: "active", label: "Activa", render: (r) => (r.active ? "Sí" : "No") },
        ]}
        fields={[
          { key: "text", label: "Frase completa", type: "textarea", required: true },
          {
            key: "shortText",
            label: "Versión corta (para placas y tarjetas)",
            help: "Se usa cuando la frase completa no entra en la placa.",
          },
          { key: "author", label: "Autor", placeholder: "Juan Domingo Perón" },
          { key: "sourceTitle", label: "Fuente (título)", required: true },
          {
            key: "sourceType",
            label: "Tipo de fuente",
            type: "select",
            options: [
              { value: "discurso", label: "Discurso" },
              { value: "libro", label: "Libro" },
              { value: "entrevista", label: "Entrevista" },
              { value: "carta", label: "Carta" },
              { value: "atribuida", label: "Atribuida (sin fuente primaria)" },
            ],
          },
          { key: "sourceDate", label: "Fecha histórica", placeholder: "17 de octubre de 1950" },
          { key: "sourceUrl", label: "Enlace a la fuente" },
          { key: "sourceLocator", label: "Página o minuto (opcional)" },
          { key: "context", label: "Contexto histórico", type: "textarea" },
          { key: "topic", label: "Tema", placeholder: "trabajo / unidad / doctrina…" },
          {
            key: "verificationStatus",
            label: "Estado de verificación",
            type: "select",
            options: STATUS_OPTIONS,
          },
          { key: "active", label: "Activa en el mazo", type: "checkbox" },
        ]}
        emptyValues={{
          text: "",
          shortText: "",
          author: "Juan Domingo Perón",
          sourceTitle: "",
          sourceType: "discurso",
          sourceDate: "",
          sourceUrl: "",
          sourceLocator: "",
          context: "",
          topic: "",
          verificationStatus: "draft",
          active: true,
        }}
        fromRow={(row) => ({
          text: row.text,
          shortText: row.short_text,
          author: row.author,
          sourceTitle: row.source_title,
          sourceType: row.source_type,
          sourceDate: row.source_date,
          sourceUrl: row.source_url,
          sourceLocator: row.source_locator,
          context: row.historical_context,
          topic: row.topic,
          verificationStatus: row.verification_status,
          active: Boolean(row.active),
        })}
      />
    </>
  );
}

function Calendar() {
  const { data, error, reload } = useList("/admin/peron365/calendar");
  const quotes = useList("/admin/peron365/quotes");
  const [saveError, setSaveError] = useState("");

  const verified = (quotes.data?.items ?? []).filter(
    (q: any) => q.verification_status === "verified" && q.active,
  );

  const assign = async (dayKey: string, quoteId: string, theme: string) => {
    setSaveError("");
    try {
      await api.put(`/admin/peron365/calendar/${dayKey}`, {
        quoteId: Number(quoteId),
        theme,
      });
      reload();
    } catch (err: any) {
      setSaveError(err.message);
    }
  };

  return (
    <section className="panel-module">
      <header className="panel-module-head">
        <div>
          <h2>Perón 365 · calendario</h2>
          <p>
            Próximos 30 días. Si no asignás nada, el selector automático elige una frase verificada
            sin repetir. {data ? `Frases verificadas disponibles: ${data.verifiedCount}.` : ""}
          </p>
        </div>
      </header>
      {(error || saveError) && <div className="panel-error">{error || saveError}</div>}
      <div className="panel-table-wrap" style={{ marginBottom: 34 }}>
        <table className="panel-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Frase</th>
              <th>Plantilla</th>
              <th>Estado</th>
              <th>Aperturas</th>
              <th>Compartidas</th>
            </tr>
          </thead>
          <tbody>
            {(data?.days ?? []).map((day: any) => (
              <tr key={day.dayKey} style={day.isToday ? { background: "#fdf6e3" } : undefined}>
                <td>
                  {day.dayKey}
                  {day.isToday ? " · HOY" : ""}
                </td>
                <td>
                  {day.dayKey < (data?.days.find((d: any) => d.isToday)?.dayKey ?? "") || day.isToday ? (
                    <span>{day.quoteText ? `“${day.quoteText}”` : "—"}</span>
                  ) : (
                    <select
                      value={day.quoteId ?? ""}
                      onChange={(e) => assign(day.dayKey, e.target.value, day.theme)}
                    >
                      <option value="">Automática</option>
                      {verified.map((q: any) => (
                        <option key={q.id} value={q.id}>
                          {(q.short_text || q.text).slice(0, 60)}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td>
                  {day.isToday || day.status === "published" ? (
                    day.theme
                  ) : (
                    <select
                      value={day.theme}
                      onChange={(e) =>
                        day.quoteId && assign(day.dayKey, String(day.quoteId), e.target.value)
                      }
                    >
                      {(data?.themes ?? []).map((theme: string) => (
                        <option key={theme} value={theme}>
                          {theme}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td>
                  {day.status === "published"
                    ? "Publicada"
                    : day.status === "scheduled"
                      ? "Programada"
                      : "Automática"}
                </td>
                <td>{day.opens}</td>
                <td>{day.shares}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
