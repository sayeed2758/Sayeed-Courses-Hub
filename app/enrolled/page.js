 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, LogIn, Sparkles } from "lucide-react";
import { useAuth } from "../providers";
import { getUserEnrollments } from "../../lib/enrollment";
import { getCourseById } from "../../lib/courses";
import AuthPanel from "../../components/AuthPanel";

export default function EnrolledPage() {
  const { user, authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      if (authLoading) return;
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const rows = await getUserEnrollments(user.uid);
        if (alive) setItems(rows);
      } catch (err) {
        if (alive) setError(err?.message || "Unable to load enrolled courses.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <main className="simple-page"><div className="loading-box">Loading your courses…</div></main>;
  }

  return (
    <main className="simple-page">
      <header className="simple-header">
        <Link href="/" className="back-link"><ArrowLeft size={18} /> Back</Link>
        <div className="detail-brand"><span className="detail-brand-dot" /> SAYEED COURSES HUB</div>
        <span />
      </header>

      <section className="enrolled-page-head">
        <span className="section-kicker">YOUR SPACE</span>
        <h1>My Enrolled Courses</h1>
        <p>Courses saved to your Sayeed Courses Hub account.</p>
      </section>

      {!user ? (
        <div className="account-empty">
          <LogIn size={28} />
          <h2>Sign in to see your courses</h2>
          <p>Enrollment is linked to your Google account.</p>
          <button className="detail-study account-button" onClick={() => setAuthOpen(true)}>
            SIGN IN <LogIn size={17} />
          </button>
        </div>
      ) : error ? (
        <div className="account-empty">
          <h2>Couldn&apos;t load courses</h2>
          <p>{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="account-empty">
          <BookOpen size={28} />
          <h2>No enrolled courses yet</h2>
          <p>Open a course and tap Enroll to save it here.</p>
          <Link href="/" className="detail-study account-button">EXPLORE COURSES <ArrowLeft size={17} /></Link>
        </div>
      ) : (
        <div className="enrolled-list">
          {items.map((item) => {
            const course = getCourseById(item.courseId);
            if (!course) return null;
            return (
              <Link href={`/course/${course.id}`} className="enrolled-row" key={item.id}>
                <div className={`enrolled-thumb mini-art ${course.tone}`}>
                  <span>{course.category}</span><strong>{course.badge}</strong>
                </div>
                <div className="enrolled-copy">
                  <span>{course.category} • {course.meta}</span>
                  <h2>{course.title}</h2>
                  <small>Enrolled course</small>
                </div>
                <Sparkles size={18} />
              </Link>
            );
          })}
        </div>
      )}

      {authOpen && (
        <div className="auth-overlay">
          <AuthPanel onClose={() => setAuthOpen(false)} />
        </div>
      )}
    </main>
  );
}
