"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, FileText, PlayCircle, UserRound } from "lucide-react";
import { getCourseById } from "../../../lib/courses";
import { useAuth } from "../../providers";
import { enrollInCourse } from "../../../lib/enrollment";
import { useState } from "react";

export function generateStaticParams() {
  return ["1", "2", "3", "4", "5", "6"].map((id) => ({ id }));
}

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

export default function CourseDetailsPage({ params }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [message, setMessage] = useState("");
  const id = params?.id;
  const course = getCourseById(id);

  if (!course) {
    return (
      <main className="detail-shell">
        <div className="detail-not-found">
          <h1>Course not found</h1>
          <p>The course may have been removed or is not available yet.</p>
          <Link href="/" className="primary-button">Back to Courses <ArrowRight size={18} /></Link>
        </div>
      </main>
    );
  }

  const isActive = course.status === "active";

  return (
    <main className="detail-shell">
      <header className="detail-header">
        <Link href="/" className="back-link"><ArrowLeft size={18} /> Back to Courses</Link>
        <div className="detail-brand">
          <span className="detail-brand-dot" />
          SAYEED COURSES HUB
        </div>
        <div className="detail-account"><UserRound size={18} /></div>
      </header>

      <section className="detail-hero">
        <CourseArtwork tone={course.tone} badge={course.badge} />

        <div className="detail-copy">
          <div className="detail-kicker">{course.category} <span>•</span> {course.meta}</div>
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
              onClick={async () => {
                if (!user) {
                  setMessage("Please sign in from the account button on the home page first.");
                  return;
                }
                setBusy(true);
                setMessage("");
                try {
                  const result = await enrollInCourse(user.uid, course.id);
                  setEnrolled(true);
                  setMessage(result.alreadyEnrolled ? "You are already enrolled." : "Course saved to My Enrolled Courses.");
                } catch (err) {
                  setMessage(err?.message || "Enrollment failed. Check Firebase setup.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <CheckCircle2 size={18} />
              {!isActive ? "COMING SOON" : busy ? "SAVING…" : enrolled ? "ENROLLED" : "ENROLL"}
            </button>
            <button className="detail-study" disabled={!isActive}>
              LET&apos;S STUDY <ArrowRight size={19} />
            </button>
          </div>

          {message && <div className="phase3-note success-detail-note">{message}</div>}

          <div className="phase3-note">
            <span>Phase 3</span>
            Course details are live. Firebase enrollment and Telegram access will be connected in later phases.
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
            <Link href="/" className="side-link">Explore more courses <ArrowRight size={17} /></Link>
          </div>
        </aside>
      </section>

      <footer className="footer detail-footer">
        <span>SAYEED COURSES HUB</span>
        <span>Phase 3 • Course Details</span>
      </footer>
    </main>
  );
}
