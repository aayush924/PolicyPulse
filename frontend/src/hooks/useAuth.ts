import { useState, useEffect, useCallback } from "react";
import type { AuthState } from "@/types";
import { signIn as apiSignIn, signUp as apiSignUp } from "@/lib/api";

const TOKEN_KEY = "pp_token";
const USER_KEY = "pp_user";

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setAuth({ user, token, loading: false });
      } catch {
        setAuth({ user: null, token: null, loading: false });
      }
    } else {
      setAuth((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user, session } = await apiSignIn(email, password);
    const token = session.access_token;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ id: user.id, email: user.email }));
    setAuth({ user: { id: user.id, email: user.email }, token, loading: false });
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { user, session } = await apiSignUp(email, password);
    if (session) {
      const token = session.access_token;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify({ id: user.id, email: user.email }));
      setAuth({ user: { id: user.id, email: user.email }, token, loading: false });
    }
    return { needsConfirmation: !session };
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuth({ user: null, token: null, loading: false });
  }, []);

  return { ...auth, signIn, signUp, signOut };
}
