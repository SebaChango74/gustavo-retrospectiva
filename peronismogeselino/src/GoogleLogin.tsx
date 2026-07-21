import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import { useSession } from "./session";

declare global {
  interface Window {
    google?: any;
  }
}

type Config = { googleClientId: string; devLogin: boolean };

let configPromise: Promise<Config> | null = null;
function getConfig(): Promise<Config> {
  configPromise ??= api.get<Config>("/public/config");
  return configPromise;
}

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-gis]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.gis = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Google Sign-In."));
    document.head.appendChild(script);
  });
}

/**
 * Botón real de "Continuar con Google" (Google Identity Services).
 * - Con PG_GOOGLE_CLIENT_ID configurado, muestra el botón oficial de Google.
 * - En desarrollo (PG_DEV=1) ofrece además un ingreso manual por correo.
 */
export function GoogleLogin({ onError }: { onError: (message: string) => void }) {
  const { loginWithGoogleCredential, loginDev } = useSession();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [devEmail, setDevEmail] = useState("");

  useEffect(() => {
    let cancelled = false;
    getConfig().then(async (cfg) => {
      if (cancelled) return;
      setConfig(cfg);
      if (!cfg.googleClientId) return;
      try {
        await loadGisScript();
        if (cancelled || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: cfg.googleClientId,
          callback: async (response: { credential: string }) => {
            try {
              await loginWithGoogleCredential(response.credential);
            } catch (error: any) {
              onError(error?.message || "No pudimos completar el ingreso.");
            }
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: 320,
        });
      } catch (error: any) {
        onError(error?.message || "No se pudo cargar Google Sign-In.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loginWithGoogleCredential, onError]);

  if (!config) return null;

  return (
    <div className="google-login-zone">
      {config.googleClientId ? (
        <div ref={buttonRef} className="gis-button" />
      ) : (
        <div className="invitation-note">
          <span aria-hidden="true">◆</span>
          <span>
            El ingreso con Google se habilita configurando <code>PG_GOOGLE_CLIENT_ID</code> en el
            servidor. Ver instrucciones en el README de la aplicación.
          </span>
        </div>
      )}
      {config.devLogin && (
        <form
          className="dev-login"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await loginDev(devEmail.trim());
            } catch (error: any) {
              onError(error?.message || "No se pudo ingresar.");
            }
          }}
        >
          <input
            type="email"
            value={devEmail}
            onChange={(event) => setDevEmail(event.target.value)}
            placeholder="correo de prueba (solo desarrollo)"
            required
          />
          <button type="submit">Ingresar (dev)</button>
        </form>
      )}
    </div>
  );
}
