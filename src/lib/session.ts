import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { OAuthScope, Session } from "@shared/types";

export type SessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "error" }
  | { status: "authed"; session: Session };

export interface SessionApi {
  state: SessionState;
  refresh: () => void;
  logout: () => Promise<void>;
}

export const SessionContext = createContext<SessionApi | null>(null);

export function loginUrl(scope: OAuthScope): string {
  return `/api/auth/login?scope=${scope}`;
}

/** GET /api/me once, with a retry hook; logout clears the cookie server-side. */
export function useSessionState(): SessionApi {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/me", { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) return setState({ status: "anonymous" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setState({
          status: "authed",
          session: (await response.json()) as Session,
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "error" });
      });
    return () => controller.abort();
  }, [attempt]);

  const refresh = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setState({ status: "anonymous" });
  }, []);

  return { state, refresh, logout };
}

export function useSession(): SessionApi {
  const api = useContext(SessionContext);
  if (!api) throw new Error("useSession needs a SessionContext provider");
  return api;
}
