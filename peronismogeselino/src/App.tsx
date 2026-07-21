import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Arrow } from "./ui";
import { SessionProvider } from "./session";
import Home from "./screens/Home";
import Cause from "./screens/Cause";
import Agenda from "./screens/Agenda";
import Game from "./screens/Game";
import Community from "./screens/Community";
import Panel from "./panel/Panel";

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

  return (
    <SessionProvider>
      <div className="site-shell">
        {!inPanel && <Header />}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/causas" element={<Cause />} />
            <Route path="/causas/:slug" element={<Cause />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/juegos" element={<Game />} />
            <Route path="/comunidad/*" element={<Community />} />
            <Route path="/panel/*" element={<Panel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {!inPanel && <MobileDock />}
        {!inPanel && <Footer />}
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
        <button onClick={() => navigate("/")}>Portal público</button>
        <button onClick={() => navigate("/causas")}>Causas vivas</button>
        <button onClick={() => navigate("/agenda")}>Agenda</button>
        <button onClick={() => navigate("/juegos")}>Peronómetro</button>
        <button onClick={() => navigate("/comunidad")}>La Comunidad</button>
      </div>
      <img
        src="/peronismogeselino/images/pj-bonaerense.png"
        alt="Partido Justicialista Provincia de Buenos Aires"
      />
    </footer>
  );
}
