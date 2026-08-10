import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Arrow } from "./ui";
import { SessionProvider } from "./session";
import Home from "./screens/Home";
import Cause from "./screens/Cause";
import Agenda from "./screens/Agenda";
import Game from "./screens/Game";
import Peronometro from "./screens/Peronometro";
import Community from "./screens/Community";
import Panel from "./panel/Panel";
import Presentacion from "./screens/Presentacion";
import News from "./screens/News";
import NewsList from "./screens/NewsList";
import Peron365 from "./screens/Peron365";
import Guia from "./screens/Guia";
import { AvisoInstalar } from "./AvisoInstalar";

export default function App() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0 });
    } else {
      const id = location.hash.slice(1);
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 40);
    }
  }, [location]);

  const inPanel = location.pathname.startsWith("/panel");
  // La presentación es un recorrido cerrado: sin navegación que lleve a la app,
  // solo el botón "Ingresar a la app" del final.
  const chromeless = inPanel || location.pathname === "/presentacion";

  return (
    <SessionProvider>
      <div className="site-shell">
        {!chromeless && <Header />}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/noticias" element={<NewsList />} />
            <Route path="/noticias/:slug" element={<News />} />
            <Route path="/causas" element={<Cause />} />
            <Route path="/causas/:slug" element={<Cause />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/agenda/:id" element={<Agenda />} />
            <Route path="/juegos" element={<Game />} />
            <Route path="/juegos/jugar" element={<Peronometro />} />
            <Route path="/peronometro" element={<Navigate to="/juegos/jugar" replace />} />
            <Route path="/comunidad/*" element={<Community />} />
            <Route path="/presentacion" element={<Presentacion />} />
            <Route path="/peron365" element={<Peron365 />} />
            <Route path="/peron365/:date" element={<Peron365 />} />
            <Route path="/instalar" element={<Navigate to="/?instalar=1" replace />} />
            <Route path="/descargar" element={<Navigate to="/?instalar=1" replace />} />
            <Route path="/app" element={<Navigate to="/?instalar=1" replace />} />
            <Route path="/guia" element={<Guia />} />
            <Route path="/panel/*" element={<Panel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <AvisoInstalar />
        {!chromeless && <MobileDock />}
        {!chromeless && <Footer />}
      </div>
    </SessionProvider>
  );
}

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <header className="site-header">
      <button className="brand" onClick={() => go("/")} aria-label="Ir al inicio">
        <span className="brand-title">PERONISMO GESELINO</span>
        <span className="brand-subtitle">Villa Gesell · Buenos Aires</span>
      </button>

      <div className="pj-seal" aria-label="Partido Justicialista Provincia de Buenos Aires">
        <img src="/peronismogeselino/images/pj-bonaerense.png" alt="PJ Bonaerense" />
      </div>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-expanded={menuOpen}
        aria-label="Abrir navegación"
      >
        <span />
        <span />
      </button>

      <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Navegación principal">
        <button className={isActive("/") ? "active" : ""} onClick={() => go("/")}>
          Ahora
        </button>
        <button className={isActive("/causas") ? "active" : ""} onClick={() => go("/causas")}>
          Causas vivas
        </button>
        <button className={isActive("/agenda") ? "active" : ""} onClick={() => go("/agenda")}>
          Agenda
        </button>
        <button className={isActive("/juegos") ? "active" : ""} onClick={() => go("/juegos")}>
          Juegos
        </button>
      </nav>

      <button className="community-button" onClick={() => go("/comunidad")}>
        <span>LA COMUNIDAD</span>
        <Arrow />
      </button>
    </header>
  );
}

function MobileDock() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <nav className="mobile-dock" aria-label="Navegación móvil">
      <button className={isActive("/") ? "active" : ""} onClick={() => navigate("/")}>
        <span>⌂</span>Inicio
      </button>
      <button onClick={() => navigate("/#noticias")}>
        <span>▤</span>Noticias
      </button>
      <button className={isActive("/causas") ? "active" : ""} onClick={() => navigate("/causas")}>
        <span>●</span>Causas
      </button>
      <button className={isActive("/juegos") ? "active" : ""} onClick={() => navigate("/juegos")}>
        <span>◇</span>Juegos
      </button>
      <button
        className={isActive("/comunidad") ? "active" : ""}
        onClick={() => navigate("/comunidad")}
      >
        <span>✦</span>Comunidad
      </button>
    </nav>
  );
}

function Footer() {
  const navigate = useNavigate();
  return (
    <footer>
      <div className="footer-brand">
        <strong>PERONISMO GESELINO</strong>
        <span>Información, memoria y organización.</span>
      </div>
      <div className="footer-links">
        <button onClick={() => navigate("/?instalar=1")}>Bajar la app</button>
        <button onClick={() => navigate("/presentacion")}>Guía del portal</button>
        <button onClick={() => navigate("/")}>Portal público</button>
        <button onClick={() => navigate("/causas")}>Causas vivas</button>
        <button onClick={() => navigate("/agenda")}>Agenda</button>
        <button onClick={() => navigate("/juegos")}>Peronómetro</button>
        <button onClick={() => navigate("/peron365")}>Perón 365</button>
        <button onClick={() => navigate("/comunidad")}>La Comunidad</button>
      </div>
      <img
        src="/peronismogeselino/images/pj-bonaerense.png"
        alt="Partido Justicialista Provincia de Buenos Aires"
      />
    </footer>
  );
}
