"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  LogIn,
  Play,
  RefreshCw,
  Trash2,
  Trophy,
  Video
} from "lucide-react";
import { useAuth } from "../providers";
import { getUserEnrollments, unenrollFromCourse } from "../../lib/enrollment";
import { loadCatalogueCourses, getCourseFromList } from "../../lib/catalogue";
import { getPublishedVideoLessons } from "../../lib/videoLessons";
import { getUserCourseProgress } from "../../lib/videoProgress";
import AuthPanel from "../../components/AuthPanel";

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function formatUpdatedAt(value) {
  if (!value) return "";
  try {
    const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(date);
  } catch {
    return "";
  }
}

function buildLearningSummary(course, lessons, progressRows) {
  const progressMap = new Map(progressRows.map((row) => [String(row.messageId), row]));
  let completed = 0;
  let started = 0;
  let watchedTotal = 0;
  let durationTotal = 0;
  let latest = null;
  let nextLesson = null;
  let resumeLesson = null;

  lessons.forEach((lesson) => {
    const row = progressMap.get(String(lesson.messageId));
    const duration = Math.max(Number(row?.duration || 0), 0);
    const position = Math.max(Number(row?.position || 0), 0);
    const finished = Boolean(row?.completed);

    if (finished) completed += 1;
    else if (position > 5) started += 1;

    watchedTotal += Math.min(position, duration || position);
    durationTotal += duration;

    if (row?.updatedAt && (!latest || String(row.updatedAt) > String(latest.updatedAt))) {
      latest = { lesson, ...row };
    }
  });

  const ordered = [...lessons].sort((a, b) =>
    Number(a.order) - Number(b.order) || Number(a.messageId) - Number(b.messageId)
  );
  nextLesson = ordered.find((lesson) => !progressMap.get(String(lesson.messageId))?.completed) || ordered[0] || null;
  resumeLesson = latest?.lesson || nextLesson;

  const percent = lessons.length
    ? clampPercent((completed / lessons.length) * 100)
    : durationTotal
      ? clampPercent((watchedTotal / durationTotal) * 100)
      : 0;

  return {
    lessonCount: lessons.length,
    completed,
    started,
    percent,
    nextLesson,
    resumeLesson,
    latestUpdatedAt: latest?.updatedAt || null,
    lastWatchedLabel: latest?.lesson?.title || "Ready to start",
    completedLabel: `${completed}/${lessons.length || 0} completed`,
    hasProgress: completed > 0 || started > 0 || watchedTotal > 0,
    watchedMinutes: durationTotal ? Math.round(watchedTotal / 60) : 0,
    course
  };
}

export default function EnrolledPage() {
  const { user, authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState("");

  async function loadLearningProgress(rows, liveCatalogue) {
    if (!user || rows.length === 0) {
      setSummaries({});
      return;
    }

    setProgressLoading(true);
    try {
      const next = {};
      await Promise.all(
        rows.map(async (item) => {
          const course = getCourseFromList(liveCatalogue, item.courseId);
          if (!course) return;

          try {
            const [lessons, progressRows] = await Promise.all([
              course.videoEnabled ? getPublishedVideoLessons(course.id) : Promise.resolve([]),
              getUserCourseProgress(user.uid, course.id)
            ]);
            next[String(course.id)] = buildLearningSummary(course, lessons, progressRows);
          } catch {
            next[String(course.id)] = buildLearningSummary(course, [], []);
          }
        })
      );
      setSummaries(next);
    } finally {
      setProgressLoading(false);
    }
  }

  async function loadShelf(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    setError("");
    try {
      const liveCatalogue = await loadCatalogueCourses();
      setCatalogue(liveCatalogue);
      if (!user) {
        setItems([]);
        setSummaries({});
        return;
      }
      const rows = await getUserEnrollments(user.uid);
      setItems(rows);
      await loadLearningProgress(rows, liveCatalogue);
    } catch (err) {
      setError(err?.message || "Unable to load enrolled courses.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    loadShelf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function handleUnenroll(item, course) {
    const confirmed = window.confirm(`Remove “${course.title}” from My Courses?`);
    if (!confirmed) return;

    setRemovingId(String(item.id));
    setError("");
    try {
      await unenrollFromCourse(user.uid, course.id);
      setItems((current) => current.filter((row) => row.id !== item.id));
      setSummaries((current) => {
        const next = { ...current };
        delete next[String(course.id)];
        return next;
      });
    } catch (err) {
      setError(err?.message || "Could not remove this course.");
    } finally {
      setRemovingId("");
    }
  }

  const visibleCourses = useMemo(() => items
    .map((item) => ({ item, course: getCourseFromList(catalogue, item.courseId) }))
    .filter((row) => row.course), [items, catalogue]);

  const learningRows = useMemo(() => visibleCourses.map(({ item, course }) => ({
    item,
    course,
    summary: summaries[String(course.id)] || buildLearningSummary(course, [], [])
  })), [visibleCourses, summaries]);

  const continueCourse = useMemo(() => {
    const inProgress = learningRows.find((row) => row.summary.percent > 0 && row.summary.percent < 100 && row.summary.resumeLesson);
    if (inProgress) return inProgress;
    return learningRows[0] || null;
  }, [learningRows]);

  const stats = useMemo(() => {
    const started = learningRows.filter((row) => row.summary.hasProgress).length;
    const completed = learningRows.filter((row) => row.summary.percent >= 100 && row.summary.lessonCount > 0).length;
    const totalLessons = learningRows.reduce((sum, row) => sum + row.summary.lessonCount, 0);
    const completedLessons = learningRows.reduce((sum, row) => sum + row.summary.completed, 0);
    return { started, completed, totalLessons, completedLessons };
  }, [learningRows]);

  return (
    <main className="reference-shell enrolled-shell ui5-enrolled-shell">
      <header className="site-header ui5-enrolled-header">
        <Link href="/" className="back-home enrolled-back-link"><ArrowLeft size={18} /> Back to courses</Link>
        <Link href="/" className="brand-lockup" aria-label="Sayeed Courses Hub home">
          <span className="brand-logo"><img src="/shahid-logo.png" alt="Shahid" /></span>
          <span className="brand-text"><strong>Sayeed Courses Hub</strong><small>Your Next Skills Start Here</small></span>
        </Link>
        <button className="header-icon shelf-refresh" type="button" onClick={() => loadShelf(true)} aria-label="Refresh enrolled courses" disabled={refreshing}>
          <RefreshCw size={19} className={refreshing ? "spin" : ""} />
        </button>
      </header>

      <section className="ui5-learning-hero">
        <span className="hero-kicker">YOUR LEARNING SPACE</span>
        <h1>My <em>courses.</em></h1>
        <p>Pick up where you left off, explore your enrolled courses, and keep your learning moving in one simple space.</p>
      </section>

      {authLoading || loading ? (
        <div className="page-empty ui5-empty-state"><RefreshCw size={23} className="spin" /><span>Loading your learning space...</span></div>
      ) : !user ? (
        <div className="page-empty ui5-empty-state">
          <LogIn size={29} />
          <h2>Sign in to see your courses</h2>
          <p>Enrollment and learning progress are linked to your Google account.</p>
          <button type="button" className="modal-primary" onClick={() => setAuthOpen(true)}>SIGN IN</button>
        </div>
      ) : error ? (
        <div className="page-empty ui5-empty-state">
          <h2>Couldn&apos;t load courses</h2>
          <p>{error}</p>
          <button type="button" className="modal-primary" onClick={() => loadShelf(true)}>TRY AGAIN</button>
        </div>
      ) : visibleCourses.length === 0 ? (
        <div className="page-empty ui5-empty-state">
          <BookOpen size={29} />
          <h2>Your shelf is empty</h2>
          <p>Go back to the catalogue and tap ENROLL on a course to build your learning space.</p>
          <Link href="/" className="modal-primary">EXPLORE COURSES</Link>
        </div>
      ) : (
        <>
          {continueCourse && (
            <section className="ui5-continue-card">
              <div className={`ui5-continue-art ${continueCourse.course.tone}`}>
                {continueCourse.course.thumbnailUrl ? (
                  <img src={continueCourse.course.thumbnailUrl} alt="" loading="lazy" decoding="async" />
                ) : null}
                <span className="ui5-art-number">#{continueCourse.course.number}</span>
                <span className="ui5-art-label">{continueCourse.summary.percent > 0 ? "CONTINUE LEARNING" : "READY TO START"}</span>
                <strong>{continueCourse.course.artTitle}</strong>
              </div>
              <div className="ui5-continue-copy">
                <span className="section-kicker">{continueCourse.course.category} • {continueCourse.summary.lessonCount || continueCourse.course.lessons}</span>
                <h2>{continueCourse.course.title}</h2>
                <p>{continueCourse.summary.percent > 0 ? `Continue from “${continueCourse.summary.resumeLesson?.title || continueCourse.summary.lastWatchedLabel}”.` : "Start the course and build your first bit of progress."}</p>
                <div className="ui5-progress-meta">
                  <div><strong>{continueCourse.summary.percent}%</strong><span>course progress</span></div>
                  <div><strong>{continueCourse.summary.completed}</strong><span>lessons done</span></div>
                </div>
                <div className="ui5-progress-track" aria-label={`${continueCourse.summary.percent}% course progress`}>
                  <span style={{ width: `${continueCourse.summary.percent}%` }} />
                </div>
                <div className="ui5-continue-actions">
                  <Link href={`/course/${continueCourse.course.id}`} className="ui5-primary-action">
                    <Play size={17} fill="currentColor" /> {continueCourse.summary.percent > 0 ? "CONTINUE" : "OPEN COURSE"}
                  </Link>
                  <Link href={`/course/${continueCourse.course.id}`} className="ui5-secondary-action">
                    VIEW COURSE <ArrowRight size={17} />
                  </Link>
                </div>
              </div>
            </section>
          )}

          <section className="ui5-stats-grid" aria-label="Learning summary">
            <div><span><BookOpen size={17} /></span><strong>{visibleCourses.length}</strong><small>Enrolled courses</small></div>
            <div><span><Play size={17} /></span><strong>{stats.started}</strong><small>In progress</small></div>
            <div><span><CheckCircle2 size={17} /></span><strong>{stats.completedLessons}</strong><small>Lessons completed</small></div>
            <div><span><Trophy size={17} /></span><strong>{stats.completed}</strong><small>Courses completed</small></div>
          </section>

          <section className="ui5-course-section">
            <div className="ui5-section-head">
              <div>
                <span className="section-kicker">YOUR LIBRARY</span>
                <h2>Keep learning.</h2>
              </div>
              <span className="ui5-section-note">{progressLoading ? "Refreshing progress…" : `${visibleCourses.length} saved`}</span>
            </div>

            <div className="ui5-learning-list">
              {learningRows.map(({ item, course, summary }) => (
                <article className="ui5-learning-card" key={item.id}>
                  <Link href={`/course/${course.id}`} className={`ui5-learning-thumb ${course.tone}`} aria-label={`Open ${course.title}`}>
                    {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" loading="lazy" decoding="async" /> : null}
                    <span>#{course.number}</span>
                  </Link>
                  <div className="ui5-learning-main">
                    <div className="ui5-learning-topline">
                      <span className="category-chip">{course.category}</span>
                      <span className={`ui5-status ${summary.percent >= 100 ? "done" : summary.hasProgress ? "active" : "new"}`}>
                        {summary.percent >= 100 ? "COMPLETED" : summary.hasProgress ? "IN PROGRESS" : "NOT STARTED"}
                      </span>
                    </div>
                    <Link href={`/course/${course.id}`} className="ui5-learning-title"><h3>{course.title}</h3></Link>
                    <p>{summary.hasProgress ? `Last focus: ${summary.lastWatchedLabel}` : course.description}</p>
                    <div className="ui5-learning-progress-row">
                      <div className="ui5-progress-track"><span style={{ width: `${summary.percent}%` }} /></div>
                      <strong>{summary.percent}%</strong>
                    </div>
                    <div className="ui5-learning-meta">
                      <span><Video size={14} /> {summary.lessonCount || course.lessons}</span>
                      <span><CheckCircle2 size={14} /> {summary.completedLabel}</span>
                      {summary.latestUpdatedAt ? <span><Clock3 size={14} /> {formatUpdatedAt(summary.latestUpdatedAt)}</span> : null}
                    </div>
                  </div>
                  <div className="ui5-learning-side">
                    <Link href={`/course/${course.id}`} className="ui5-open-button">
                      {summary.hasProgress ? "CONTINUE" : "OPEN"} <ArrowRight size={16} />
                    </Link>
                    <button
                      type="button"
                      className="enrolled-remove-button"
                      onClick={() => handleUnenroll(item, course)}
                      disabled={removingId === String(item.id)}
                    >
                      <Trash2 size={14} />
                      {removingId === String(item.id) ? "REMOVING..." : "REMOVE"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="ui5-study-tip">
            <div className="ui5-tip-icon"><Trophy size={19} /></div>
            <div><span className="section-kicker">A SIMPLE ROUTINE</span><h2>Study a little. Finish a lot.</h2><p>Open one course, finish one lesson, and come back tomorrow. Your progress stays tied to your account.</p></div>
            <Link href="/" className="ui5-tip-link">EXPLORE MORE <ArrowRight size={16} /></Link>
          </section>
        </>
      )}

      <footer className="site-footer">
        <div><strong>SAYEED COURSES</strong><span>Your learning space, kept simple.</span></div>
        <span>© 2026 Sayeed Courses Hub</span>
      </footer>

      {authOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-sheet auth-modal">
            <button className="modal-close" type="button" onClick={() => setAuthOpen(false)} aria-label="Close">×</button>
            <span className="section-kicker">ACCOUNT</span>
            <h2>Your account</h2>
            <AuthPanel embedded onClose={() => setAuthOpen(false)} />
          </div>
        </div>
      )}
    </main>
  );
}
