import { useEffect, useState } from "react";
import { api } from "../api";
import { useList } from "./Crud";

const KNOWN: Record<string, string> = {
  stats_territorios: "Portada · cantidad de territorios",
  stats_causas_activas: "Portada · causas activas (si no hay causas publicadas)",
  stats_municipios: "Portada · cantidad de municipios",
  community_cap: "Máximo de miembros de la comunidad",
  portal_url: "URL que aparece en la placa del Peronómetro",
  map_default_query: "Búsqueda por defecto del mapa (mientras no haya dirección real)",
};

export function SettingsModule() {
  const { data, error, reload } = useList("/admin/settings");
  const audit = useList("/admin/audit");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (data?.items) {
      const next: Record<string, string> = {};
      for (const row of data.items) next[row.key] = row.value;
      setValues(next);
    }
  }, [data]);

  const save = async () => {
    setSaved(false);
    setSaveError("");
    try {
      await api.put("/admin/settings", values);
      setSaved(true);
      reload();
    } catch (err: any) {
      setSaveError(err.message);
    }
  };

  return (
    <section className="panel-module">
      <header className="panel-module-head">
        <div>
          <h2>Ajustes</h2>
          <p>Valores generales del portal.</p>
        </div>
        <button className="button button-navy" onClick={save}>
          GUARDAR AJUSTES
        </button>
      </header>

      {(error || saveError) && <div className="panel-error">{error || saveError}</div>}
      {saved && <div className="panel-ok">Ajustes guardados.</div>}

      <div className="panel-form-grid">
        {Object.entries(values)
          .filter(([key]) => key !== "seeded_at")
          .map(([key, value]) => (
            <label className="panel-field" key={key}>
              <span>{KNOWN[key] ?? key}</span>
              <input
                value={value}
                onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              />
            </label>
          ))}
      </div>

      <h3 className="panel-subheading">Registro de actividad</h3>
      <div className="panel-table-wrap">
        <table className="panel-table">
          <thead>
            <tr>
              <th>Cuándo</th>
              <th>Quién</th>
              <th>Acción</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {(audit.data?.items ?? []).slice(0, 60).map((row: any) => (
              <tr key={row.id}>
                <td>{row.created_at}</td>
                <td>{row.actor_email ?? "—"}</td>
                <td>
                  {row.action} {row.entity}
                  {row.entity_id ? ` #${row.entity_id}` : ""}
                </td>
                <td>{row.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
