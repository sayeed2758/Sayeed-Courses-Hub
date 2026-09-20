"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Send,
  Sparkles
} from "lucide-react";
import { useAuth } from "../app/providers";
import { enrollInCourse } from "../lib/enrollment";

function CourseArtwork({ course }) {
  return (
    <div className={`course-cover detail-cover ${course.tone}`}>
      <div className="cover-grid" />
      <div className="cover-orb orb-one" />
      <div className="cover-orb orb-two" />
      <div className="cover-top">
        <span className="cover-number">#{course.number}</span>
        <span className="cover-badge">{course.badge}</span>
      </div>
      <div className="cover-copy">
        <span>{course.meta}</span>
        <strong>{course.artTitle}</strong>
      </div>
      <div className="cover-watermark">SAYEED</div>
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
      setMessage("Please sign in first from the account menu.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await enrollInCourse(user.uid, course.id);
      setEnrolled(true);
      setMessage(result.alreadyEnrolled ? "You are already enrolled." : "Course added to My Courses.");
    } catch (error) {
      setMessage(error?.message || "Enrollment failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleStudy() {
    if (!isActive) return;
    if (course.telegramUrl) {
      window.open(course.telegramUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setMessage("Telegram access link is not added for this course yet.");
  }

  return (
    <main className="reference-shell detail-shell-new">
      <header className="site-header detail-site-header">
        <Link href="/" className="back-home"><ArrowLeft size={19} /> Back</Link>
        <Link href="/" className="brand-lockup" aria-label="Sayeed Courses Hub home">
          <span className="brand-logo">
            <img src="/shahid-logo.png" alt="Shahid" />
          </span>
          <span className="brand-text"><strong>Sayeed Courses Hub</strong><small>Your Next Skills Start Here</small></span>
        </Link>
        <Link href="/" className="back-home"><span className="back-desktop-label">Courses</span> <ArrowUpRight size={19} /></Link>
      </header>

      <section className="detail-main-card">
        <CourseArtwork course={course} />
        <div className="detail-content-new">
          <div className="detail-category-row">
            <span className="category-chip">{course.category}</span>
            <span>#{course.number}</span>
          </div>
          <h1>{course.title}</h1>
          <p className="detail-description-new">{course.description}</p>

          <div className="detail-stats-new">
            <div><BookOpen size={18} /><span>{course.lessons}</span></div>
            <div><FileText size={18} /><span>{course.resources}</span></div>
            <div><Clock3 size={18} /><span>{course.duration}</span></div>
          </div>

          <div className="detail-actions-new">
            <button type="button" className={`enroll-button ${enrolled ? "is-enrolled" : ""}`} onClick={handleEnroll} disabled={!isActive || busy || enrolled}>
              <span className="action-lock">{enrolled ? "✓" : "+"}</span>
              {!isActive ? "COMING SOON" : busy ? "SAVING..." : enrolled ? "ENROLLED" : "ENROLL"}
            </button>
            <button type="button" className="study-button" onClick={handleStudy} disabled={!isActive}>
              LET&apos;S STUDY <Send size={18} />
            </button>
          </div>

          {message && <div className="detail-message">{message}</div>}
        </div>
      </section>

      <section className="detail-grid-new">
        <div className="detail-panel-new">
          <span className="section-kicker">ABOUT THIS COURSE</span>
          <h2>What you&apos;ll learn</h2>
          <p>{course.overview}</p>
          <div className="learn-list-new">
            {course.learn.map((item) => (
              <div key={item}><CheckCircle2 size={18} /><span>{item}</span></div>
            ))}
          </div>
        </div>

        <div className="detail-panel-new">
          <span className="section-kicker">COURSE CONTENT</span>
          <h2>Modules & lessons</h2>
          <div className="module-list-new">
            {course.modules.map((module, index) => (
              <div className="module-row-new" key={module}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{module}</strong>
                <ArrowUpRight size={17} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div><strong>SAYEED COURSES</strong><span>Open the learning path. Keep moving.</span></div>
        <span>Course #{course.number}</span>
      </footer>
    </main>
  );
}
