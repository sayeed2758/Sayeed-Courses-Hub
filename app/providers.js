 "use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { auth, firebaseConfigured } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(firebaseConfigured);
  const [configError, setConfigError] = useState(
    firebaseConfigured ? "" : "Firebase is not configured yet."
  );

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      authLoading,
      configError,
      firebaseConfigured,
      async signInWithGoogle() {
        if (!auth) throw new Error("Firebase is not configured yet.");
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
      },
      async logout() {
        if (!auth) return;
        return signOut(auth);
      }
    }),
    [user, authLoading, configError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
