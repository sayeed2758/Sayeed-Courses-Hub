import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";

export default function FirebaseSetupPage() {
  const steps = [
    ["Create the Firebase project", "Create one project for Sayeed Courses Hub in Firebase Console."],
    ["Register the Web app", "Project Overview → add a Web app → copy the six Firebase config values."],
    ["Enable Google sign-in", "Authentication → Sign-in method → Google → Enable → Save."],
    ["Create Firestore", "Build → Firestore Database → create the database and finish setup."],
    ["Add all six environment variables", "Vercel → Settings → Environment Variables. Add the six NEXT_PUBLIC_FIREBASE_* names exactly as written."],
    ["Add your Vercel domain", "Firebase → Authentication → Settings → Authorized domains → add your production Vercel domain."],
    ["Publish firestore.rules", "Use the rules file included in this ZIP after reviewing it. It keeps enrollments private and limits course edits to approved admins."],
    ["Provision your admin", "After your first Google sign-in, copy your Google UID from the Admin Panel message and create Firestore collection admins with a document whose ID is that UID. Add role: admin."],
    ["Create a fresh deployment", "Environment variables are injected at build time, so redeploy after every variable change."]
  ];

  return (
    <main className="reference-shell setup-shell-new">
      <header className="site-header">
        <Link href="/" className="back-home"><ArrowLeft size={19} /> Back</Link>
        <Link href="/" className="brand-lockup"><span className="brand-logo">S</span><span className="brand-text"><strong>SAYEED COURSES</strong><small>YOUR NEXT SKILL STARTS HERE</small></span></Link>
        <span />
      </header>
      <section className="page-heading-new">
        <span className="hero-kicker"><ShieldCheck size={15} /> FIREBASE + ADMIN SETUP</span>
        <h1>Firebase setup.</h1>
        <p>Phone-friendly setup notes for Google sign-in and Firestore enrollment.</p>
        <a className="modal-primary inline-button" href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">OPEN FIREBASE CONSOLE <ExternalLink size={16} /></a>
      </section>
      <div className="setup-list-new">
        {steps.map(([title, description], index) => (
          <div className="setup-row-new" key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><h2>{title}</h2><p>{description}</p></div>
            <CheckCircle2 size={19} />
          </div>
        ))}
      </div>
      <div className="setup-warning-new"><strong>Important:</strong> Never put a Firebase Admin SDK private key or service-account JSON into this frontend project or GitHub.</div>
    </main>
  );
}
