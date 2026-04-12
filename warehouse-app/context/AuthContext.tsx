import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { setSessionInvalidateHandler } from '@/src/authInvalidation';

const SESSION_KEY = 'wm_session';

export type Session = {
  token: string;
  userId: number;
  username: string;
};

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSessionInvalidateHandler(() => {
      SecureStore.deleteItemAsync(SESSION_KEY).catch(() => {});
      setSession(null);
    });
    return () => setSessionInvalidateHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(SESSION_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as Session;
          if (parsed?.token && parsed?.username) {
            setSession(parsed);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (next: Session) => {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    } catch {
      /* still sign out in UI */
    }
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, loading, signIn, signOut }),
    [session, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
