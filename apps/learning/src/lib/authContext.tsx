"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { db, type Session } from "./db";
import type { AppUser } from "./types";

type AuthState = {
  session: Session | null;
  profile: AppUser | null;
  /** true until the initial session check resolves */
  loading: boolean;
};

const AuthContext = createContext<AuthState>({
  session: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Validates the stored token against the server (GET /auth/session)
    // rather than trusting localStorage — a revoked session (password reset,
    // account deactivated, signed out elsewhere) comes back as null here.
    // The same call returns the profile row, so there's no second fetch.
    db.auth.getSession().then((s) => {
      if (!active) return;
      setSession(s);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_event, s) => {
      if (active) setSession(s);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const profile = (session?.user as AppUser | undefined) ?? null;

  return (
    <AuthContext.Provider value={{ session, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
