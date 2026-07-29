import { useCallback, useEffect, useState, type ReactNode } from "react";
import { api } from "../api";
import { ImagePicker } from "./ImagePicker";

export type FieldOption = { value: string; label: string };

export type Field = {
  key: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "checkbox"
    | "select"
    | "datetime"
    | "lines"
    | "timeline"
    | "image";
  options?: FieldOption[];
  help?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
};

export type TimelineItem = { dateLabel: string; title: string; body: string; state: string };

export type Column = { key: string; label: string; render?: (row: any) => ReactNode };

type CrudProps = {
  title: string;
  subtitle?: string;
  path: string;
  columns: Column[];
  fields: Field[];
  emptyValues: Record<string, any>;
  fromRow: (row: any) => Record<string, any>;
  canDelete?: boolean;
  aside?: ReactNode;
};

export function useList(path: string) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const reload = useCallback(() => {
    api
      .get<any>(path)
      .then((payload) => {
        setData(payload);
        setError("");
      })
      .catch((err) => setError(err.message));
  }, [path]);
  useEffect(reload, [reload]);
  return { data, error, reload };
}

export function Crud({
  title,
  subtitle,
  path,
  columns,
  fields,
  emptyValues,
  fromRow,
  canDelete = true,
  aside,
}: CrudProps) {
  const { data, error, reload } = useList(path);
  const [editing, setEditing] = useState<{ id: number | null; values: Record<string, any> } | null>(
    null,
  );
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const items: any[] = data?.items ?? [];

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setFormError("");
    try {
      if (editing.id == null) {
        await api.post(path, editing.values);
      } else {
        await api.put(`${path}/${editing.id}`, editing.values);
      }
      setEditing(null);
      reload();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("¿Eliminar definitivamente este elemento?")) return;
    try {
      await api.del(`${path}/${id}`);
      reload();
    } catch (err: any) {
      window.alert(err.message);
    }
  };

  return (
    <section className="panel-module">
      <header className="panel-module-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          className="button button-cobalt"
          onClick={() => setEditing({ id: null, values: { ...emptyValues } })}
        >
          + NUEVO
        </button>
      </header>

      {error && <div className="panel-error">{error}</div>}
      {aside}

      {editing && (
        <div className="panel-form">
          <h3>{editing.id == null ? "Nuevo elemento" : `Editando #${editing.id}`}</h3>
          <div className="panel-form-grid">
            {fields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={editing.values[field.key]}
                onChange={(value) =>
                  setEditing({ ...editing, values: { ...editing.values, [field.key]: value } })
                }
              />
            ))}
          </div>
          {formError && <div className="panel-error">{formError}</div>}
          <div className="panel-form-actions">
            <button className="button button-navy" onClick={save} disabled={busy}>
              {busy ? "GUARDANDO…" : "GUARDAR"}
            </button>
            <button className="button button-outline" onClick={() => setEditing(null)}>
              CANCELAR
            </button>
          </div>
        </div>
      )}

      <div className="panel-table-wrap">
        <table className="panel-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? "")}</td>
                ))}
                <td className="panel-row-actions">
                  <button onClick={() => setEditing({ id: row.id, values: fromRow(row) })}>
                    Editar
                  </button>
                  {canDelete && <button onClick={() => remove(row.id)}>Eliminar</button>}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="panel-empty">
                  Sin elementos todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: any;
  onChange: (value: any) => void;
}) {
  const type = field.type ?? "text";

  if (type === "image") {
    return <ImagePicker value={value ?? ""} onChange={onChange} />;
  }

  if (type === "checkbox") {
    return (
      <label className="panel-field checkbox">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        <span>{field.label}</span>
        {field.help && <small>{field.help}</small>}
      </label>
    );
  }

  if (type === "timeline") {
    const items: TimelineItem[] = Array.isArray(value) ? value : [];
    const update = (index: number, patch: Partial<TimelineItem>) => {
      onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    };
    return (
      <div className="panel-field wide">
        <span>{field.label}</span>
        {field.help && <small>{field.help}</small>}
        <div className="panel-timeline-editor">
          {items.map((item, index) => (
            <div className="panel-timeline-row" key={index}>
              <input
                value={item.dateLabel}
                placeholder="Fecha (ej: 14 JUL)"
                onChange={(e) => update(index, { dateLabel: e.target.value })}
              />
              <input
                value={item.title}
                placeholder="Título"
                onChange={(e) => update(index, { title: e.target.value })}
              />
              <input
                value={item.body}
                placeholder="Detalle"
                onChange={(e) => update(index, { body: e.target.value })}
              />
              <select value={item.state} onChange={(e) => update(index, { state: e.target.value })}>
                <option value="done">Hecho</option>
                <option value="current">Ahora</option>
                <option value="pending">Próximo</option>
              </select>
              <button type="button" onClick={() => onChange(items.filter((_, i) => i !== index))}>
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="panel-add-row"
            onClick={() =>
              onChange([...items, { dateLabel: "", title: "", body: "", state: "pending" }])
            }
          >
            + Agregar hito
          </button>
        </div>
      </div>
    );
  }

  return (
    <label className={type === "textarea" || type === "lines" ? "panel-field wide" : "panel-field"}>
      <span>
        {field.label}
        {field.required ? " *" : ""}
      </span>
      {type === "textarea" && (
        <textarea
          rows={4}
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {type === "lines" && (
        <textarea
          rows={4}
          value={Array.isArray(value) ? value.join("\n") : (value ?? "")}
          placeholder={field.placeholder ?? "Un elemento por línea"}
          onChange={(e) => onChange(e.target.value.split("\n"))}
        />
      )}
      {type === "select" && (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      {type === "number" && (
        <input
          type="number"
          value={value ?? ""}
          step={field.step}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {type === "datetime" && (
        <input
          type="datetime-local"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {type === "text" && (
        <input
          type="text"
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.help && <small>{field.help}</small>}
    </label>
  );
}
