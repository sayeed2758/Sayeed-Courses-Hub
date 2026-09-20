"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, BookOpen, LogIn } from "lucide-react";
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
        setItems([]);
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

  return (
    <main className="reference-shell enrolled-shell">
      <header className="site-header">
        <Link href="/" className="back-home"><ArrowLeft size={19} /> Back</Link>
        <Link href="/" className="brand-lockup">
          <span className="brand-logo">S</span>
          <span className="brand-text"><strong>SAYEED COURSES</strong><small>YOUR NEXT SKILL STARTS HERE</small></span>
        </Link>
        <span />
      </header>

      <section className="page-heading-new">
        <span className="hero-kicker">YOUR NEXT CHAPTER</span>
        <h1>My enrolled courses.</h1>
        <p>Everything you saved with your Sayeed Courses account.</p>
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
        <div className="page-empty"><h2>Couldn&apos;t load courses</h2><p>{error}</p></div>
      ) : items.length === 0 ? (
        <div className="page-empty">
          <BookOpen size={29} />
          <h2>Your shelf is empty</h2>
          <p>Go back to the catalogue and tap ENROLL on a course.</p>
          <Link href="/" className="modal-primary">EXPLORE COURSES</Link>
        </div>
      ) : (
        <div className="enrolled-grid-new">
          {items.map((item) => {
            const course = getCourseById(item.courseId);
            if (!course) return null;
            return (
              <Link className="enrolled-card-new" href={`/course/${course.id}`} key={item.id}>
                <div className={`learning-thumb ${course.tone}`}><span>{course.category}</span></div>
                <div><small>{course.category}</small><h2>{course.title}</h2><span>Enrolled course</span></div>
                <ArrowUpRight size={18} />
              </Link>
            );
          })}
        </div>
      )}

      {authOpen && (
        <div className="modal-backdrop">
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
