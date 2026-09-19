import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";

export default function FirebaseSetupPage() {
  const steps = [
    ["Create a Firebase project", "Create one project for Sayeed Courses Hub in Firebase Console."],
    ["Register the Web app", "From Project Overview, add a Web app and copy its Firebase config."],
    ["Enable Google sign-in", "Authentication → Sign-in method → Google → Enable → Save."],
    ["Create Firestore", "Build a Cloud Firestore database and choose the desired location."],
    ["Add environment variables", "Put the six NEXT_PUBLIC_FIREBASE_* values in Vercel, not inside source code."],
    ["Add your domain", "Add your Vercel domain to Firebase Authentication → Authorized domains."],
    ["Publish security rules", "Deploy the included firestore.rules after reviewing them."]
  ];

  return (
    <main className="simple-page setup-page">
      <header className="simple-header">
        <Link href="/" className="back-link"><ArrowLeft size={18} /> Back to Hub</Link>
        <div className="detail-brand"><span className="detail-brand-dot" /> SAYEED COURSES HUB</div>
        <span />
      </header>

      <section className="setup-hero">
        <span className="section-kicker"><ShieldCheck size={14} /> PHASE 5</span>
        <h1>Firebase Setup</h1>
        <p>Follow these steps from your phone. No code changes are required while creating the Firebase project.</p>
        <a className="primary-button" href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">
          Open Firebase Console <ExternalLink size={16} />
        </a>
      </section>

      <section className="setup-list">
        {steps.map(([title, description], index) => (
          <div className="setup-row" key={title}>
            <div className="setup-number">{String(index + 1).padStart(2, "0")}</div>
            <div className="setup-copy">
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            <CheckCircle2 size={19} />
          </div>
        ))}
      </section>

      <div className="setup-warning">
        <strong>Important:</strong> Firebase web configuration values are not the same thing as a server admin key. Never paste a Firebase Admin SDK private key, service account JSON, or other secret credential into this project or GitHub.
      </div>
    </main>
  );
}
