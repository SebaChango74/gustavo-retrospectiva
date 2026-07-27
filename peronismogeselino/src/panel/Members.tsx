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
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [tier, setTier] = useState("manager");
  const [clave, setClave] = useState("");
  const [territoryId, setTerritoryId] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const territoryOptions = territories.data?.items ?? [];

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setOk("");
    try {
      await api.post("/admin/members", {
        phone,
        name,
        email,
        role,
        adminTier: role === "admin" ? tier : "builder",
        clave: role === "admin" ? clave : "",
        territoryId: territoryId || null,
      });
      setPhone("");
      setName("");
      setEmail("");
      setRole("member");
      setTier("manager");
      setClave("");
      setTerritoryId("");
      members.reload();
    } catch (err: any) {
      setError(err.message);
    }
  };

  /** La clave de administración se define acá y se avisa por WhatsApp. */
  const cambiarClave = async (row: any) => {
    const nueva = window.prompt(
      `Clave de administración para ${row.name || row.phone_display}.\nMínimo 8 caracteres. Pasásela por WhatsApp.`,
    );
    if (!nueva) return;
    setError("");
    setOk("");
    try {
      await api.put(`/admin/members/${row.id}/clave`, { clave: nueva });
      setOk(`Clave actualizada. ${row.name || "El administrador"} tiene que volver a entrar.`);
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
        oculto: Boolean(row.oculto),
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
          <h2>Miembros</h2>
          <p>
            Solo los WhatsApp de esta lista pueden entrar. Podés sumar a alguien directo desde acá,
            o aprobarlo desde “Pedidos de ingreso”.
          </p>
        </div>
      </header>

      {error && <div className="panel-error">{error}</div>}
      {ok && <div className="panel-ok">{ok}</div>}

      <form className="panel-invite" onSubmit={invite}>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="WhatsApp: 2255 456789"
          inputMode="tel"
          required
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre (opcional)"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo de contacto (opcional)"
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
        {role === "admin" && (
          <>
            <select value={tier} onChange={(e) => setTier(e.target.value)}>
              <option value="manager">Manager (aprueba y controla)</option>
              <option value="builder">Builder (todo, incluidos ajustes)</option>
            </select>
            <input
              type="text"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="Clave (mínimo 8)"
              minLength={8}
              required
            />
          </>
        )}
        <button className="button button-cobalt" type="submit">
          SUMAR
        </button>
      </form>

      <div className="panel-table-wrap">
        <table className="panel-table">
          <thead>
            <tr>
              <th>WhatsApp</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Nivel</th>
              <th>Territorio</th>
              <th>Figura</th>
              <th>Estado</th>
              <th>Último ingreso</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(members.data?.items ?? []).map((row: any) => (
              <tr key={row.id}>
                <td>
                  {row.phone_link ? (
                    <a href={row.phone_link} target="_blank" rel="noreferrer">
                      {row.phone_display}
                    </a>
                  ) : (
                    <span className="panel-dim">sin WhatsApp</span>
                  )}
                </td>
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
                    value={row.oculto ? "no" : "si"}
                    onChange={(e) => update(row.id, { oculto: e.target.value === "no" }, row)}
                    title="Una cuenta técnica no cuenta como miembro ni aparece en la comunidad."
                  >
                    <option value="si">En la comunidad</option>
                    <option value="no">Cuenta técnica</option>
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
                  {row.role === "admin" && (
                    <button onClick={() => cambiarClave(row)}>
                      {row.tiene_clave ? "Cambiar clave" : "Poner clave"}
                    </button>
                  )}
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
