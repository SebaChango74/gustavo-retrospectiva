import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename="/peronismogeselino">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

// PWA: el service worker solo gobierna /peronismogeselino/.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/peronismogeselino/sw.js", { scope: "/peronismogeselino/" })
      .catch(() => {});
  });
}
