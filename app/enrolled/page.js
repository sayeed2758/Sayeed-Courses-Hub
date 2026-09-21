"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, BookOpen, LogIn, RefreshCw, Trash2 } from "lucide-react";
import { useAuth } from "../providers";
import { getUserEnrollments, unenrollFromCourse } from "../../lib/enrollment";
import { loadCatalogueCourses, getCourseFromList } from "../../lib/catalogue";
import AuthPanel from "../../components/AuthPanel";

export default function EnrolledPage() {
  const { user, authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState("");

  async function loadShelf(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    setError("");
    try {
      const liveCatalogue = await loadCatalogueCourses();
      setCatalogue(liveCatalogue);
      if (!user) {
        setItems([]);
        return;
      }
      const rows = await getUserEnrollments(user.uid);
      setItems(rows);
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
    // user/authLoading are intentionally the source of truth for this page.
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
    } catch (err) {
      setError(err?.message || "Could not remove this course.");
    } finally {
      setRemovingId("");
    }
  }

  const visibleCourses = useMemo(() => items
    .map((item) => ({ item, course: getCourseFromList(catalogue, item.courseId) }))
    .filter((row) => row.course), [items, catalogue]);

  return (
    <main className="reference-shell enrolled-shell">
      <header className="site-header">
        <Link href="/" className="back-home"><ArrowLeft size={19} /> Back</Link>
        <Link href="/" className="brand-lockup" aria-label="Sayeed Courses Hub home">
          <span className="brand-logo"><img src="/shahid-logo.png" alt="Shahid" /></span>
          <span className="brand-text"><strong>Sayeed Courses Hub</strong><small>Your Next Skills Start Here</small></span>
        </Link>
        <button className="header-icon shelf-refresh" type="button" onClick={() => loadShelf(true)} aria-label="Refresh enrolled courses" disabled={refreshing}>
          <RefreshCw size={19} className={refreshing ? "spin" : ""} />
        </button>
      </header>

      <section className="page-heading-new">
        <span className="hero-kicker">YOUR NEXT CHAPTER</span>
        <h1>My enrolled courses.</h1>
        <p>Everything you saved with your Sayeed Courses account, ready to continue.</p>
      </section>

      {authLoading || loading ? (
        <div className="page-empty"><span>Loading your courses...</span></div>
      ) : !user ? (
        <div className="page-empty">
          <LogIn size={29} />
          <h2>Sign in to see your courses</h2>
          <p>Enrollment is linked to your Google account.</p>
          <button type="button" className="modal-primary" onClick={() => setAuthOpen(true)}>SIGN IN</button>
        </div>
      ) : error ? (
        <div className="page-empty">
          <h2>Couldn&apos;t load courses</h2>
          <p>{error}</p>
          <button type="button" className="modal-primary" onClick={() => loadShelf(true)}>TRY AGAIN</button>
        </div>
      ) : visibleCourses.length === 0 ? (
        <div className="page-empty">
          <BookOpen size={29} />
          <h2>Your shelf is empty</h2>
          <p>Go back to the catalogue and tap ENROLL on a course.</p>
          <Link href="/" className="modal-primary">EXPLORE COURSES</Link>
        </div>
      ) : (
        <div className="enrolled-grid-new">
          {visibleCourses.map(({ item, course }) => (
            <article className="enrolled-card-new" key={item.id}>
              <Link className="enrolled-card-main" href={`/course/${course.id}`}>
                <div className={`learning-thumb ${course.tone}`}>
                  {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" loading="lazy" decoding="async" /> : null}
                  <span>{course.category}</span>
                </div>
                <div><small>{course.category}</small><h2>{course.title}</h2><span>Enrolled course</span></div>
                <ArrowUpRight size={18} />
              </Link>
              <button
                type="button"
                className="enrolled-remove-button"
                onClick={() => handleUnenroll(item, course)}
                disabled={removingId === String(item.id)}
              >
                <Trash2 size={15} />
                {removingId === String(item.id) ? "REMOVING..." : "REMOVE COURSE"}
              </button>
            </article>
          ))}
        </div>
      )}

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
