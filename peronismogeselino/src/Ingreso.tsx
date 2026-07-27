import { useState } from "react";
import { api } from "./api";
import { useSession } from "./session";

type Respuesta = {
  member?: unknown;
  pendiente?: boolean;
  whatsapp?: string;
  mensaje?: string;
};

/**
 * Ingreso a la comunidad: nombre y WhatsApp. Nada más.
 *
 * Quien ya es miembro entra directo. Quien no está en la lista deja su pedido
 * y la mesa lo aprueba desde el panel. Los administradores, que son los únicos
 * que publican y borran, suman su clave personal.
 */
export function Ingreso({ onError }: { onError: (message: string) => void }) {
  const { ingresar, refresh } = useSession();
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [afiliado, setAfiliado] = useState("");
  const [clave, setClave] = useState("");
  const [pideClave, setPideClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [pendiente, setPendiente] = useState<Respuesta | null>(null);

  // Al salir del campo de WhatsApp preguntamos si ese número lleva clave, así
  // el administrador no descubre el requisito recién cuando falla el ingreso.
  const revisarNumero = async () => {
    if (!whatsapp.trim()) return;
    try {
      const r = await api.post<{ claveRequerida: boolean }>("/auth/consultar", { whatsapp });
      setPideClave(r.claveRequerida);
    } catch {
      /* si falla, el ingreso lo va a pedir igual */
    }
  };

  const enviar = async (event: React.FormEvent) => {
    event.preventDefault();
    onError("");
    setEnviando(true);
    try {
      const r = await ingresar({ nombre, whatsapp, afiliado, clave });
      if (r?.pendiente) {
        setPendiente(r);
      } else {
        await refresh();
      }
    } catch (error: any) {
      if (error?.data?.claveRequerida) setPideClave(true);
      onError(error?.message || "No pudimos completar el ingreso.");
    } finally {
      setEnviando(false);
    }
  };

  if (pendiente) {
    return (
      <div className="ingreso-pendiente">
        <strong>Pedido enviado</strong>
        <p>{pendiente.mensaje}</p>
        <small>WhatsApp registrado: {pendiente.whatsapp}</small>
      </div>
    );
  }

  return (
    <form className="ingreso" onSubmit={enviar}>
      <label className="ingreso-campo">
        <span>Nombre y apellido</span>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Juan Domingo Pérez"
          autoComplete="name"
          required
        />
      </label>

      <label className="ingreso-campo">
        <span>WhatsApp</span>
        <input
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          onBlur={revisarNumero}
          placeholder="2255 456789"
          autoComplete="tel"
          inputMode="tel"
          required
        />
        <small>Con código de área, sin el 0 ni el 15.</small>
      </label>

      <label className="ingreso-campo">
        <span>
          Nº de afiliado al PJ <em>(opcional)</em>
        </span>
        <input
          type="text"
          value={afiliado}
          onChange={(e) => setAfiliado(e.target.value)}
          placeholder="Si lo tenés a mano"
          inputMode="numeric"
        />
      </label>

      {pideClave && (
        <label className="ingreso-campo">
          <span>Clave de administración</span>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
      )}

      <button className="button button-cobalt" type="submit" disabled={enviando}>
        {enviando ? "ENTRANDO…" : "ENTRAR"}
      </button>

      <p className="ingreso-nota">
        Si es tu primera vez, tu pedido queda a la espera de que la mesa lo apruebe.
      </p>
    </form>
  );
}
