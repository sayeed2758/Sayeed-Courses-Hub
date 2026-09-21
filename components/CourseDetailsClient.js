"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Send,
  ShieldCheck,
  X
} from "lucide-react";
import AuthPanel from "./AuthPanel";
import { useAuth } from "../app/providers";
import { enrollInCourse, getUserEnrollments } from "../lib/enrollment";
import { loadCatalogueCourses, getCourseFromList } from "../lib/catalogue";
import VideoPlayer from "./VideoPlayer";

function CourseArtwork({ course }) {
  return (
    <div className={`course-cover detail-cover ${course.tone}`}>
      {course.thumbnailUrl ? <img className="cover-thumbnail" src={course.thumbnailUrl} alt="" loading="eager" fetchPriority="high" decoding="async" /> : null}
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
      <div className="cover-watermark">Made With 💓 By Shahid</div>
    </div>
  );
}

export default function CourseDetailsClient({ course: initialCourse, courseId }) {
  const { user } = useAuth();
  const [course, setCourse] = useState(initialCourse || null);
  const [busy, setBusy] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [message, setMessage] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(!initialCourse);

  useEffect(() => {
    let alive = true;
    async function loadCourse() {
      try {
        const items = await loadCatalogueCourses();
        const live = getCourseFromList(items, courseId);
        if (alive) {
          setCourse(live || initialCourse || null);
          setLoading(false);
        }
      } catch {
        if (alive) setLoading(false);
      }
    }
    loadCourse();
    return () => { alive = false; };
  }, [courseId, initialCourse]);

  useEffect(() => {
    let alive = true;
    async function loadEnrollmentState() {
      if (!user || !course) {
        setEnrolled(false);
        return;
      }
      try {
        const rows = await getUserEnrollments(user.uid);
        const match = rows.some((row) => String(row.courseId) === String(course.id));
        if (alive) setEnrolled(match);
      } catch {
        if (alive) setEnrolled(false);
      }
    }
    loadEnrollmentState();
    return () => { alive = false; };
  }, [user, course]);

  if (loading) {
    return (
      <main className="reference-shell detail-shell-new">
        <div className="page-empty"><span>Loading course...</span></div>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="reference-shell detail-shell-new">
        <div className="page-empty">
          <h2>Course not found</h2>
          <p>This course is not available in the current catalogue.</p>
          <Link href="/" className="modal-primary">BACK TO COURSES</Link>
        </div>
      </main>
    );
  }

  const isActive = course.status === "active";

  async function handleEnroll() {
    if (!user) {
      setMessage("Sign in with Google to save this course to My Courses.");
      setAuthOpen(true);
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
    if (!user) {
      setMessage("Sign in with Google to access secure course videos.");
      setAuthOpen(true);
      return;
    }
    const target = document.getElementById("course-video-player");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setMessage("Video lessons are loading. Please try again in a moment.");
  }

  return (
    <main className="reference-shell detail-shell-new">
      <header className="site-header detail-site-header">
        <Link href="/" className="back-home"><ArrowLeft size={19} /> Back</Link>
        <Link href="/" className="brand-lockup" aria-label="Sayeed Courses Hub home">
          <span className="brand-logo"><img src="/shahid-logo.png" alt="Shahid" /></span>
          <span className="brand-text"><strong>Sayeed Courses Hub</strong><small>Your Next Skills Start Here</small></span>
        </Link>
        <Link href="/enrolled" className="back-home"><span className="back-desktop-label">My Courses</span> <ArrowUpRight size={19} /></Link>
      </header>

      <section className="detail-main-card">
        <CourseArtwork course={course} />
        <div className="detail-content-new">
          <div className="detail-category-row">
            <span className="category-chip">{course.category}</span>
            <span>#{course.number}</span>
            {enrolled && <span className="detail-enrolled-pill"><ShieldCheck size={14} /> IN MY COURSES</span>}
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

          {message && <div className="detail-message" aria-live="polite">{message}</div>}
        </div>
      </section>

      {enrolled && course.videoEnabled ? (
        <div id="course-video-player" className="course-video-anchor">
          <VideoPlayer course={course} />
        </div>
      ) : null}

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

      {authOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setAuthOpen(false);
        }}>
          <div className="modal-sheet auth-modal">
            <button className="modal-close" type="button" onClick={() => setAuthOpen(false)} aria-label="Close"><X size={20} /></button>
            <span className="section-kicker">ACCOUNT</span>
            <h2>Your account</h2>
            <AuthPanel embedded onClose={() => setAuthOpen(false)} />
          </div>
        </div>
      )}
    </main>
  );
}
