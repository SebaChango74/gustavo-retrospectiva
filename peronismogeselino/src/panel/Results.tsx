import { useList } from "./Crud";

export function Results() {
  const { data, error } = useList("/admin/results");

  return (
    <section className="panel-module">
      <header className="panel-module-head">
        <div>
          <h2>Peronómetro · resultados</h2>
          <p>Métricas agregadas y anónimas. No se guarda ningún dato personal de quien juega.</p>
        </div>
      </header>

      {error && <div className="panel-error">{error}</div>}

      {data && (
        <>
          <div className="panel-stats-row">
            <div className="panel-stat">
              <strong>{data.total}</strong>
              <span>partidas jugadas</span>
            </div>
            <div className="panel-stat">
              <strong>{data.average == null ? "—" : `${data.average}%`}</strong>
              <span>promedio de aciertos</span>
            </div>
          </div>

          <h3 className="panel-subheading">Distribución de resultados</h3>
          <div className="panel-table-wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Rango</th>
                  <th>Partidas</th>
                </tr>
              </thead>
              <tbody>
                {(data.distribution ?? []).map((row: any) => (
                  <tr key={row.range}>
                    <td>{row.range}%</td>
                    <td>{row.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="panel-subheading">Últimos 30 días</h3>
          <div className="panel-table-wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Partidas</th>
                  <th>Promedio</th>
                </tr>
              </thead>
              <tbody>
                {(data.byDay ?? []).map((row: any) => (
                  <tr key={row.day}>
                    <td>{row.day}</td>
                    <td>{row.games}</td>
                    <td>{row.avgScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
