"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Folder,
  Send,
  ShieldCheck,
  X
} from "lucide-react";
import AuthPanel from "./AuthPanel";
import VideoPlayer from "./VideoPlayer";
import { useAuth } from "../app/providers";
import { enrollInCourse, getUserEnrollments, unenrollFromCourse } from "../lib/enrollment";
import { loadCatalogueCourses, getCourseFromList } from "../lib/catalogue";

function CourseArtwork({ course }) {
  return (
    <div className={`course-cover detail-cover detail-cover-v3 ${course.tone}`}>
      {course.thumbnailUrl ? (
        <img
          className="cover-thumbnail"
          src={course.thumbnailUrl}
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      ) : null}
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

    if (enrolled) {
      const confirmed = window.confirm(`Remove “${course.title}” from My Courses?`);
      if (!confirmed) return;
      setBusy(true);
      setMessage("");
      try {
        await unenrollFromCourse(user.uid, course.id);
        setEnrolled(false);
        setMessage("Course removed from My Courses.");
      } catch (error) {
        setMessage(error?.message || "Could not remove this course.");
      } finally {
        setBusy(false);
      }
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

  function openLessons() {
    if (!isActive) return;
    const player = document.getElementById("course-video-player");
    if (player) {
      player.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setMessage(
      course.videoEnabled
        ? "Video player is loading. Scroll down to Video Lessons."
        : "Video lessons are not connected to this course yet."
    );
  }

  return (
    <main className="reference-shell detail-shell-v3">
      <header className="site-header detail-site-header detail-site-header-v3">
        <Link href="/" className="brand-lockup" aria-label="Sayeed Courses Hub home">
          <span className="brand-logo"><img src="/shahid-logo.png" alt="Shahid" /></span>
          <span className="brand-text">
            <strong>Sayeed Courses Hub</strong>
            <small>Your Next Skills Start Here</small>
          </span>
        </Link>
        <div className="detail-header-actions-v3">
          <Link href="/" className="header-pill detail-header-back-v3">
            <ArrowLeft size={18} /> ALL COURSES
          </Link>
          <Link href="/enrolled" className="header-pill detail-header-courses-v3">
            MY COURSES <ArrowUpRight size={17} />
          </Link>
        </div>
      </header>

      <div className="detail-breadcrumb-v3">
        <Link href="/"><ArrowLeft size={17} /> ALL COURSES</Link>
      </div>

      <section className="detail-main-card-v3">
        <CourseArtwork course={course} />

        <div className="detail-content-new detail-content-v3">
          <div className="detail-category-row detail-category-row-v3">
            <span className="category-chip">{course.category}</span>
            <span className="detail-course-number-v3">#{course.number}</span>
            {enrolled && (
              <span className="detail-enrolled-pill">
                <ShieldCheck size={14} /> IN MY COURSES
              </span>
            )}
          </div>

          <h1>{course.title}</h1>
          <p className="detail-description-new">{course.description}</p>

          <div className="detail-stats-new detail-stats-v3">
            <div><BookOpen size={17} /><span>{course.lessons}</span></div>
            <div><FileText size={17} /><span>{course.resources}</span></div>
            <div><Clock3 size={17} /><span>{course.duration}</span></div>
          </div>

          <div className="detail-actions-new detail-actions-v3">
            <button
              type="button"
              className={`enroll-button ${enrolled ? "is-enrolled" : ""}`}
              onClick={handleEnroll}
              disabled={!isActive || busy}
            >
              <span className="action-lock">{enrolled ? "×" : "+"}</span>
              {!isActive ? "COMING SOON" : busy ? "WORKING..." : enrolled ? "UNENROLL" : "ENROLL"}
            </button>
            <button type="button" className="study-button" onClick={openLessons} disabled={!isActive}>
              LET&apos;S STUDY <Send size={18} />
            </button>
          </div>

          {message && <div className="detail-message" aria-live="polite">{message}</div>}
        </div>
      </section>

      <section className="detail-module-section-v3">
        <div className="detail-section-head-v3">
          <div>
            <span className="section-kicker">COURSE CONTENT</span>
            <h2>Explore the learning path.</h2>
            <p>Move from one focused section to the next without losing the simple course flow.</p>
          </div>
          <span className="detail-section-count-v3">{course.modules.length} SECTIONS</span>
        </div>

        <div className="module-list-v3">
          {course.modules.map((module, index) => (
            <button type="button" className="module-row-v3" key={module} onClick={openLessons} disabled={!isActive}>
              <span className="module-folder-v3"><Folder size={27} strokeWidth={1.8} /></span>
              <span className="module-copy-v3">
                <small>SECTION {String(index + 1).padStart(2, "0")}</small>
                <strong>{module}</strong>
              </span>
              <span className="module-open-v3">OPEN LESSONS <ChevronRight size={19} /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="detail-grid-new detail-grid-v3">
        <div className="detail-panel-new detail-panel-v3">
          <span className="section-kicker">ABOUT THIS COURSE</span>
          <h2>What you&apos;ll learn</h2>
          <p>{course.overview}</p>
          <div className="learn-list-new learn-list-v3">
            {course.learn.map((item) => (
              <div key={item}><CheckCircle2 size={18} /><span>{item}</span></div>
            ))}
          </div>
        </div>

        <div className="detail-panel-new detail-panel-v3 detail-info-v3">
          <span className="section-kicker">COURSE DETAILS</span>
          <h2>Built for focused study.</h2>
          <div className="detail-info-list-v3">
            <div><span>Instructor</span><strong>{course.instructor}</strong></div>
            <div><span>Language</span><strong>{course.language}</strong></div>
            <div><span>Format</span><strong>{course.duration}</strong></div>
          </div>
        </div>
      </section>

      {course.videoEnabled && (
        <div id="course-video-player" className="course-video-player-anchor course-video-anchor-v3">
          <VideoPlayer course={course} />
        </div>
      )}

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
