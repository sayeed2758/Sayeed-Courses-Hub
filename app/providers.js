"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { auth, firebaseConfigured } from "../lib/firebase";

const AuthContext = createContext(null);

function friendlyAuthError(error) {
  const code = error?.code || "";
  if (code === "auth/unauthorized-domain") {
    const hostname = typeof window !== "undefined" ? window.location.hostname : "this website";
    return `Firebase has not authorized ${hostname}. In Firebase Console → Authentication → Settings → Authorized domains, add ${hostname}.`;
  }
  if (code === "auth/popup-blocked") {
    return "Google sign-in popup was blocked. Please allow pop-ups for this site and try again.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "The Google sign-in window was closed before completing sign-in.";
  }
  if (code === "auth/network-request-failed") {
    return "Network connection interrupted. Please check your internet and try again.";
  }
  return error?.message || "Google authentication could not start.";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(firebaseConfigured);
  const [configError, setConfigError] = useState(firebaseConfigured ? "" : "Firebase is not configured yet.");

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      setConfigError(firebaseConfigured ? "Firebase could not initialize." : "Firebase is not configured yet.");
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setAuthLoading(false);
        setConfigError("");
      },
      (error) => {
        setAuthLoading(false);
        setConfigError(friendlyAuthError(error));
      }
    );

    return unsubscribe;
  }, []);

  const value = useMemo(() => ({
    user,
    authLoading,
    configError,
    firebaseConfigured,
    async signInWithGoogle() {
      if (!auth) throw new Error("Firebase is not configured yet.");

      try {
        await setPersistence(auth, browserLocalPersistence);
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        return await signInWithPopup(auth, provider);
      } catch (error) {
        throw new Error(friendlyAuthError(error));
      }
    },
    async logout() {
      if (!auth) return;
      return signOut(auth);
    }
  }), [user, authLoading, configError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
