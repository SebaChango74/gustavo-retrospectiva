import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, type Member } from "./api";

type SessionState = {
  member: Member | null;
  loading: boolean;
  refresh: () => Promise<void>;
  loginWithGoogleCredential: (credential: string) => Promise<Member>;
  loginDev: (email: string) => Promise<Member>;
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

  const loginWithGoogleCredential = useCallback(async (credential: string) => {
    const data = await api.post<{ member: Member }>("/auth/google", { credential });
    setMember(data.member);
    return data.member;
  }, []);

  const loginDev = useCallback(async (email: string) => {
    const data = await api.post<{ member: Member }>("/auth/dev", { email });
    setMember(data.member);
    return data.member;
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setMember(null);
  }, []);

  return (
    <SessionContext.Provider
      value={{ member, loading, refresh, loginWithGoogleCredential, loginDev, logout }}
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
