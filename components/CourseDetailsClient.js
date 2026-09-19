 "use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  PlayCircle,
  UserRound
} from "lucide-react";
import { useAuth } from "../app/providers";
import { enrollInCourse } from "../lib/enrollment";

function CourseArtwork({ tone, badge }) {
  return (
    <div className={`detail-art course-art ${tone}`}>
      <div className="art-noise" />
      <div className="art-topline">
        <span className="art-brand">SAYEED COURSES HUB</span>
        <span className="art-badge">{badge}</span>
      </div>
      <div className="art-content">
        <span className="art-small">PREMIUM COURSE</span>
        <strong>{tone === "purple" ? "PREP" : "LEARN"}</strong>
        <strong>SMARTER</strong>
      </div>
      <div className="art-shape one" />
      <div className="art-shape two" />
    </div>
  );
}

export default function CourseDetailsClient({ course }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [message, setMessage] = useState("");

  const isActive = course.status === "active";

  async function handleEnroll() {
    if (!user) {
      setMessage("Please sign in from the account button on the home page first.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const result = await enrollInCourse(user.uid, course.id);
      setEnrolled(true);
      setMessage(
        result.alreadyEnrolled
          ? "You are already enrolled."
          : "Course saved to My Enrolled Courses."
      );
    } catch (err) {
      setMessage(err?.message || "Enrollment failed. Check your Firebase setup.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="detail-shell">
      <header className="detail-header">
        <Link href="/" className="back-link">
          <ArrowLeft size={18} /> Back to Courses
        </Link>
        <div className="detail-brand">
          <span className="detail-brand-dot" />
          SAYEED COURSES HUB
        </div>
        <div className="detail-account">
          <UserRound size={18} />
        </div>
      </header>

      <section className="detail-hero">
        <CourseArtwork tone={course.tone} badge={course.badge} />

        <div className="detail-copy">
          <div className="detail-kicker">
            {course.category} <span>•</span> {course.meta}
          </div>
          <h1>{course.title}</h1>
          <p className="detail-description">{course.description}</p>

          <div className="detail-stats">
            <div><BookOpen size={17} /><span>{course.lessons}</span></div>
            <div><FileText size={17} /><span>{course.resources}</span></div>
            <div><Clock3 size={17} /><span>{course.duration}</span></div>
          </div>

          <div className="detail-actions">
            <button
              className={`detail-enroll ${enrolled ? "enrolled-state" : ""}`}
              disabled={!isActive || busy || enrolled}
              onClick={handleEnroll}
            >
              <CheckCircle2 size={18} />
              {!isActive ? "COMING SOON" : busy ? "SAVING…" : enrolled ? "ENROLLED" : "ENROLL"}
            </button>

            <button
              className="detail-study"
              type="button"
              onClick={() => setMessage("Telegram access will be connected in the Telegram phase.")}
              disabled={!isActive}
            >
              LET&apos;S STUDY <ArrowRight size={19} />
            </button>
          </div>

          {message && <div className="phase3-note success-detail-note">{message}</div>}

          <div className="phase3-note">
            <span>Phase 5</span>
            Firebase setup readiness and safer deployment configuration are now being prepared.
          </div>
        </div>
      </section>

      <section className="detail-info-grid">
        <div className="detail-main">
          <div className="detail-panel">
            <span className="section-kicker">ABOUT THIS COURSE</span>
            <h2>What you&apos;ll learn</h2>
            <p>{course.overview}</p>

            <div className="learn-grid">
              {course.learn.map((item) => (
                <div className="learn-item" key={item}>
                  <CheckCircle2 size={18} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-panel">
            <span className="section-kicker">COURSE CONTENT</span>
            <h2>Modules & lessons</h2>
            <div className="module-list">
              {course.modules.map((module, index) => (
                <div className="module-row" key={module}>
                  <div className="module-number">{String(index + 1).padStart(2, "0")}</div>
                  <div>
                    <strong>{module}</strong>
                    <span>Structured learning module</span>
                  </div>
                  <PlayCircle size={19} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="detail-side">
          <div className="detail-panel sticky-panel">
            <span className="section-kicker">COURSE INFO</span>
            <h2>At a glance</h2>
            <div className="info-list">
              <div><span>Instructor</span><strong>{course.instructor}</strong></div>
              <div><span>Category</span><strong>{course.category}</strong></div>
              <div><span>Language</span><strong>{course.language}</strong></div>
              <div><span>Format</span><strong>{course.duration}</strong></div>
            </div>
            <Link href="/" className="side-link">
              Explore more courses <ArrowRight size={17} />
            </Link>
          </div>
        </aside>
      </section>

      <footer className="footer detail-footer">
        <span>SAYEED COURSES HUB</span>
        <span>Phase 5 • Firebase Readiness</span>
      </footer>
    </main>
  );
}
