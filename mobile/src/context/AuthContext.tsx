import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { authApi } from "@/api/auth";
import { setAuthToken } from "@/api/tokenStore";
import { Session } from "@/api/types";

const SESSION_KEY = "nextplayai.session";

interface AuthContextValue {
  session: Session | null;
  isRestoring: boolean;
  login: (email: string, password: string) => Promise<Session>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(SESSION_KEY);
        if (raw) {
          const restored: Session = JSON.parse(raw);
          setAuthToken(restored.token);
          setSession(restored);
        }
      } catch {
        // Corrupt or inaccessible secure storage — fall through to logged-out state.
      } finally {
        setIsRestoring(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const next: Session = {
      email,
      token: res.access_token,
      role: res.role,
      fullName: res.full_name,
    };
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(next));
    setAuthToken(next.token);
    setSession(next);
    return next;
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setAuthToken(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, isRestoring, login, logout }),
    [session, isRestoring, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
