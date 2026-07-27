import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/globals.css";
// Debe importarse acá: el navegador avisa que la app es instalable apenas
// carga la página, y si nadie escucha en ese momento, el aviso se pierde.
import "./install";

// "/peronismogeselino/" en modo integrado, "/" en modo independiente.
const BASE = import.meta.env.BASE_URL;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={BASE.replace(/\/$/, "") || "/"}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

// PWA: el service worker solo gobierna la base de la app.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${BASE}sw.js`, { scope: BASE })
      // Buscar versión nueva en cada arranque. Sin esto, quien tiene la app
      // instalada puede quedarse semanas con una versión vieja.
      .then((registro) => registro.update().catch(() => {}))
      .catch(() => {});

    // Cuando entra una versión nueva, recargar una sola vez para que la
    // persona no siga usando la anterior sin enterarse.
    let recargando = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (recargando) return;
      recargando = true;
      window.location.reload();
    });
  });
}
