import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, type Member } from "./api";

export type Ingreso = {
  nombre: string;
  whatsapp: string;
  afiliado?: string;
  clave?: string;
};

export type RespuestaIngreso = {
  member?: Member;
  pendiente?: boolean;
  whatsapp?: string;
  mensaje?: string;
};

type SessionState = {
  member: Member | null;
  loading: boolean;
  refresh: () => Promise<void>;
  ingresar: (datos: Ingreso) => Promise<RespuestaIngreso>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ member: Member | null }>("/auth/me");
      setMember(data.member);
    } catch {
      setMember(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const ingresar = useCallback(async (datos: Ingreso) => {
    const data = await api.post<RespuestaIngreso>("/auth/ingresar", datos);
    if (data.member) setMember(data.member);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setMember(null);
  }, []);

  return (
    <SessionContext.Provider
      value={{ member, loading, refresh, ingresar, logout }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession requiere SessionProvider");
  return context;
}
