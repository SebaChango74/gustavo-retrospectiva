import { useState } from "react";
import { api } from "../api";
import { useList } from "./Crud";
import { roleLabel } from "./Panel";

const ROLES = ["member", "referente", "moderator", "editor", "admin"];
const STATUS_LABEL: Record<string, string> = {
  invited: "Invitado (aún no ingresó)",
  active: "Activo",
  suspended: "Suspendido",
};

export function Members() {
  const members = useList("/admin/members");
  const territories = useList("/admin/territories");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("member");
  const [territoryId, setTerritoryId] = useState("");
  const [error, setError] = useState("");

  const territoryOptions = territories.data?.items ?? [];

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/admin/members", {
        email,
        name,
        role,
        territoryId: territoryId || null,
      });
      setEmail("");
      setName("");
      setRole("member");
      setTerritoryId("");
      members.reload();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const update = async (id: number, patch: Record<string, unknown>, row: any) => {
    setError("");
    try {
      await api.put(`/admin/members/${id}`, {
        name: row.name,
        role: row.role,
        status: row.status,
        territoryId: row.territory_id,
        adminTier: row.admin_tier ?? "builder",
        ...patch,
      });
      members.reload();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("¿Eliminar este miembro? Perderá el acceso de inmediato.")) return;
    try {
      await api.del(`/admin/members/${id}`);
      members.reload();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <section className="panel-module">
      <header className="panel-module-head">
        <div>
          <h2>Miembros e invitaciones</h2>
          <p>
            La comunidad es por invitación: solo los correos de esta lista pueden ingresar con
            Google.
          </p>
        </div>
      </header>

      {error && <div className="panel-error">{error}</div>}

      <form className="panel-invite" onSubmit={invite}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@gmail.com"
          required
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre (opcional)"
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <select value={territoryId} onChange={(e) => setTerritoryId(e.target.value)}>
          <option value="">Sin territorio</option>
          {territoryOptions.map((t: any) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button className="button button-cobalt" type="submit">
          INVITAR
        </button>
      </form>

      <div className="panel-table-wrap">
        <table className="panel-table">
          <thead>
            <tr>
              <th>Correo</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Nivel</th>
              <th>Territorio</th>
              <th>Estado</th>
              <th>Último ingreso</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(members.data?.items ?? []).map((row: any) => (
              <tr key={row.id}>
                <td>{row.email}</td>
                <td>{row.name}</td>
                <td>
                  <select
                    value={row.role}
                    onChange={(e) => update(row.id, { role: e.target.value }, row)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {roleLabel(r)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {row.role === "admin" ? (
                    <select
                      value={row.admin_tier ?? "builder"}
                      onChange={(e) => update(row.id, { adminTier: e.target.value }, row)}
                    >
                      <option value="builder">Builder (todo)</option>
                      <option value="manager">Manager (aprueba)</option>
                    </select>
                  ) : (
                    <span className="panel-dim">—</span>
                  )}
                </td>
                <td>
                  <select
                    value={row.territory_id ?? ""}
                    onChange={(e) => update(row.id, { territoryId: e.target.value || null }, row)}
                  >
                    <option value="">—</option>
                    {territoryOptions.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={row.status}
                    onChange={(e) => update(row.id, { status: e.target.value }, row)}
                  >
                    {Object.entries(STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{row.last_login_at ? row.last_login_at.slice(0, 16) : "Nunca"}</td>
                <td className="panel-row-actions">
                  <button onClick={() => remove(row.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
