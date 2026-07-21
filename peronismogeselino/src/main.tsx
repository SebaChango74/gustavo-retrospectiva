import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/globals.css";

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
    navigator.serviceWorker.register(`${BASE}sw.js`, { scope: BASE }).catch(() => {});
  });
}
