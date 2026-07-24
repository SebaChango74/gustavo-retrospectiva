import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, type NewsArchive } from "../api";
import { Arrow, dateLabel } from "../ui";

export default function NewsList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("p")) || 1);
  const [data, setData] = useState<NewsArchive | null>(null);

  useEffect(() => {
    api
      .get<NewsArchive>(`/public/news?page=${page}`)
      .then(setData)
      .catch(() => setData({ news: [], page: 1, pages: 1, total: 0 }));
    window.scrollTo({ top: 0 });
  }, [page]);

  const goToPage = (n: number) => setSearchParams(n <= 1 ? {} : { p: String(n) });

  return (
    <div className="inner-page news-archive-page">
      <section className="inner-hero tech-grid">
        <div className="breadcrumb">
          <button onClick={() => navigate("/")}>Inicio</button>
          <span>/</span>
          <span>Noticias</span>
        </div>
        <span className="eyebrow light">TODAS LAS NOTICIAS</span>
        <h1>LO QUE ESTÁ PASANDO</h1>
        <p>El seguimiento completo de la actividad geselina, de lo más reciente a lo más antiguo.</p>
      </section>

      <section className="section">
        {data && data.news.length === 0 && (
          <p className="archive-empty">Todavía no hay noticias publicadas.</p>
        )}

        <div className="archive-grid">
          {(data?.news ?? []).map((item) => (
            <article className="news-card archive-card" key={item.slug}>
              <button
                onClick={() => navigate(`/noticias/${item.slug}`)}
                aria-label={`Abrir ${item.title}`}
              >
                {item.image && (
                  <div className="news-image">
                    <img src={item.image} alt="" />
                  </div>
                )}
                <div className="news-body">
                  <div className="meta">
                    <span>{item.tag}</span>
                    <time>{dateLabel(item.published_at)}</time>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <span className="read-more">
                    LEER MÁS <Arrow />
                  </span>
                </div>
              </button>
            </article>
          ))}
        </div>

        {data && data.pages > 1 && (
          <nav className="archive-pager" aria-label="Paginación de noticias">
            <button
              className="pager-arrow"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              aria-label="Página anterior"
            >
              ← Anterior
            </button>
            <div className="pager-numbers">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={n === page ? "pager-num active" : "pager-num"}
                  onClick={() => goToPage(n)}
                  aria-current={n === page ? "page" : undefined}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              className="pager-arrow"
              disabled={page >= data.pages}
              onClick={() => goToPage(page + 1)}
              aria-label="Página siguiente"
            >
              Siguiente →
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
