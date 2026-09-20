"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, LogIn, LogOut } from "lucide-react";
import { useAuth } from "../app/providers";

export default function AuthPanel({ onClose, embedded = false }) {
  const { user, authLoading, signInWithGoogle, logout, configError } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogle() {
    setBusy(true);
    setError("");
    try {
      await signInWithGoogle();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Google sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) {
    return <div className={`auth-panel ${embedded ? "embedded" : ""}`}><div className="auth-loading-line" />Checking account...</div>;
  }

  if (configError && !user) {
    return (
      <div className={`auth-panel ${embedded ? "embedded" : ""}`}>
        <div className="auth-status-chip">FIREBASE SETUP</div>
        <h3>Connect your account</h3>
        <p>The website is ready for Google sign-in, but this deployment is reporting a Firebase configuration problem.</p>
        <Link href="/setup" className="auth-secondary" onClick={onClose}>OPEN SETUP GUIDE</Link>
        <small className="auth-help-note">After changing Vercel variables, create a fresh deployment.</small>
      </div>
    );
  }

  if (user) {
    const initials = (user.displayName || user.email || "U").slice(0, 1).toUpperCase();
    return (
      <div className={`auth-panel ${embedded ? "embedded" : ""}`}>
        {user.photoURL ? (
          <img className="auth-avatar-image" src={user.photoURL} alt="" />
        ) : (
          <div className="auth-avatar">{initials}</div>
        )}
        <div className="auth-status-chip signed-in">GOOGLE ACCOUNT CONNECTED</div>
        <h3>{user.displayName || "Signed in"}</h3>
        <p>{user.email || "Google account"}</p>
        <div className="auth-account-actions">
          <Link href="/enrolled" className="auth-primary auth-link-button" onClick={onClose}>
            <BookOpen size={17} /> MY COURSES
          </Link>
          <button
            type="button"
            className="auth-secondary auth-secondary-button"
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await logout();
                onClose?.();
              } catch (err) {
                setError(err?.message || "Could not sign out.");
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            <LogOut size={17} /> {busy ? "SIGNING OUT..." : "SIGN OUT"}
          </button>
        </div>
        {error && <small className="auth-error" aria-live="polite">{error}</small>}
      </div>
    );
  }

  return (
    <div className={`auth-panel ${embedded ? "embedded" : ""}`}>
      <div className="auth-status-chip">ACCOUNT</div>
      <h3>Save your learning list.</h3>
      <p>Sign in once and every enrolled course stays connected to your account.</p>
      <button type="button" className="auth-primary" onClick={handleGoogle} disabled={busy}>
        <LogIn size={17} /> {busy ? "OPENING GOOGLE..." : "CONTINUE WITH GOOGLE"}
      </button>
      {error && <small className="auth-error" aria-live="polite">{error}</small>}
    </div>
  );
}
