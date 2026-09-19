 "use client";

import { useState } from "react";
import { LogIn, LogOut, X } from "lucide-react";
import { useAuth } from "../app/providers";

export default function AuthPanel({ onClose }) {
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
      setError(err?.message || "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (configError && !user) {\n    return (\n      <div className="auth-popover">\n        <button className="auth-close" onClick={onClose} aria-label="Close"><X size={16} /></button>\n        <span className="section-kicker">FIREBASE SETUP</span>\n        <h3>Account setup is pending.</h3>\n        <p>Firebase has not been connected yet. Complete the Phase 5 setup steps before enabling sign-in.</p>\n        <div className="setup-mini-note">Add the six <b>NEXT_PUBLIC_FIREBASE_*</b> values in Vercel Environment Variables.</div>\n      </div>\n    );\n  }\n\n  if (authLoading) {
    return <div className="auth-popover"><span>Checking account…</span></div>;
  }

  if (user) {
    return (
      <div className="auth-popover">
        <button className="auth-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        <div className="auth-avatar">{(user.displayName || user.email || "S").slice(0, 1).toUpperCase()}</div>
        <strong>{user.displayName || "Signed in"}</strong>
        <span className="auth-email">{user.email}</span>
        <button className="auth-google" onClick={async () => { setBusy(true); await logout(); setBusy(false); onClose?.(); }}>
          <LogOut size={16} /> {busy ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    );
  }

  return (
    <div className="auth-popover">
      <button className="auth-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
      <span className="section-kicker">ACCOUNT</span>
      <h3>Sign in to enroll.</h3>
      <p>Your enrolled courses will be linked to your account.</p>
      <button className="auth-google" onClick={handleGoogle} disabled={busy}>
        <LogIn size={16} /> {busy ? "Opening Google…" : "Continue with Google"}
      </button>
      {error && <small className="auth-error">{error}</small>}
    </div>
  );
}
