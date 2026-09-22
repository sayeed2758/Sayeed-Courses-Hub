"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AuthPanel from "../components/AuthPanel";
import { useAuth } from "./providers";
import { enrollInCourse, getUserEnrollments, unenrollFromCourse } from "../lib/enrollment";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  CircleHelp,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  X
} from "lucide-react";
import { courses, getCategoryCounts } from "../lib/courses";
import { loadCatalogueCourses } from "../lib/catalogue";
import { isUserAdmin } from "../lib/admin";

const FAQS = [
  ["How do I enroll in a course?", "Sign in with Google, tap ENROLL on the course card, and the course is saved to My Courses."],
  ["Can I save several courses?", "Yes. You can enroll in multiple courses and see them together inside My Courses."],
  ["How will I receive course access?", "Use LET'S STUDY from a course. Each course can be connected to its own Telegram learning link."],
  ["Where does LET'S STUDY open?", "The course detail page contains the Telegram access action. The link is managed per course in the catalogue data."],
  ["How do I find a course quickly?", "Use the search box, the category filter, or Sort courses to narrow the catalogue instantly."],
  ["What happens when a course is coming soon?", "The card remains visible, but ENROLL and study access stay disabled until the course is activated."]
];

function CourseArtwork({ course }) {
  return (
    <div className={`course-cover ${course.tone}`}>
      {course.thumbnailUrl ? (
        <img
          className="cover-thumbnail"
          src={course.thumbnailUrl}
          alt=""
          loading={course.number === 1 ? "eager" : "lazy"}
          fetchPriority={course.number === 1 ? "high" : "auto"}
          decoding="async"
          sizes="(max-width: 760px) 100vw, (max-width: 1179px) 50vw, 33vw"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
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

function Modal({ title, kicker, onClose, children, className = "" }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className={`modal-sheet ${className}`}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        {kicker && <span className="section-kicker">{kicker}</span>}
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function CourseCard({ course, isEnrolled, onEnrolled, onNeedsAuth }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const active = course.status === "active";

  async function handleEnroll() {
    if (!active) return;
    if (!user) {
      setNotice("SIGN_IN");
      onNeedsAuth?.();
      return;
    }

    if (isEnrolled) {
      const confirmed = window.confirm(`Remove “${course.title}” from My Courses?`);
      if (!confirmed) return;
      setBusy(true);
      setNotice("");
      try {
        await unenrollFromCourse(user.uid, course.id);
        onEnrolled(course.id, false);
        setNotice("UNENROLLED");
      } catch (error) {
        setNotice(error?.message || "Could not remove this course.");
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    setNotice("");
    try {
      const result = await enrollInCourse(user.uid, course.id);
      onEnrolled(course.id, true);
      setNotice(result.alreadyEnrolled ? "ALREADY" : "ENROLLED");
    } catch (error) {
      setNotice(error?.message || "Enrollment failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={`course-card ${!active ? "course-card-disabled" : ""}`}>
      <Link href={`/course/${course.id}`} className="course-cover-link" aria-label={`Open ${course.title}`}>
        <CourseArtwork course={course} />
      </Link>

      <div className="course-body">
        <div className="course-topline">
          <span className="category-chip">{course.category}</span>
          <span className="course-index">#{course.number}</span>
        </div>

        <Link href={`/course/${course.id}`} className="course-title-link">
          <h2>{course.title}</h2>
        </Link>
        <p>{course.description}</p>

        <div className="course-actions">
          <button
            className={`enroll-button ${isEnrolled ? "is-enrolled" : ""}`}
            type="button"
            onClick={handleEnroll}
            disabled={!active || busy}
          >
            <span className="action-lock">{isEnrolled ? "×" : "+"}</span>
            {busy ? "WORKING..." : isEnrolled ? "UNENROLL" : "ENROLL"}
          </button>

          <Link href={`/course/${course.id}`} className={`study-button ${!active ? "is-disabled" : ""}`} aria-disabled={!active}>
            LET&apos;S STUDY <ArrowUpRight size={18} />
          </Link>
        </div>

        {notice === "SIGN_IN" && (
          <div className="card-notice">
            <span>Sign in first to save this course.</span>
            <span className="notice-link">ACCOUNT</span>
          </div>
        )}
        {notice === "ENROLLED" && (
          <div className="card-notice success">
            <span>Course added to My Courses.</span>
            <span className="notice-link">SAVED</span>
          </div>
        )}
        {notice === "UNENROLLED" && (
          <div className="card-notice success">
            <span>Course removed from My Courses.</span>
            <span className="notice-link">REMOVED</span>
          </div>
        )}
        {notice === "ALREADY" && (
          <div className="card-notice success">
            <span>This course is already enrolled.</span>
            <span className="notice-link">SAVED</span>
          </div>
        )}
        {notice && !["SIGN_IN", "ENROLLED", "ALREADY", "UNENROLLED"].includes(notice) && (
          <div className="card-notice error"><span>{notice}</span></div>
        )}

        {!active && <div className="coming-note">COMING SOON — ACCESS WILL OPEN HERE.</div>}
      </div>
    </article>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recommended");
  const [sortOpen, setSortOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [learningOpen, setLearningOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [catalogueCourses, setCatalogueCourses] = useState(courses);
  const [adminUser, setAdminUser] = useState(false);

  useEffect(() => {
    const modalOpen = categoryOpen || faqOpen || menuOpen || learningOpen || authOpen;
    document.body.classList.toggle("modal-open", modalOpen);

    if (!modalOpen) return undefined;

    function handleEscape(event) {
      if (event.key !== "Escape") return;
      setCategoryOpen(false);
      setFaqOpen(false);
      setMenuOpen(false);
      setLearningOpen(false);
      setAuthOpen(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [categoryOpen, faqOpen, menuOpen, learningOpen, authOpen]);

  useEffect(() => {
    let alive = true;
    loadCatalogueCourses().then((items) => {
      if (alive && items.length) setCatalogueCourses(items);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!user) {
      setAdminUser(false);
      return () => { alive = false; };
    }
    isUserAdmin(user.uid).then((result) => {
      if (alive) setAdminUser(result);
    });
    return () => { alive = false; };
  }, [user]);

  useEffect(() => {
    let alive = true;

    async function loadEnrollments() {
      if (!user) {
        setEnrolledIds([]);
        return;
      }
      try {
        const rows = await getUserEnrollments(user.uid);
        if (alive) setEnrolledIds(rows.map((row) => String(row.courseId)));
      } catch {
        if (alive) setEnrolledIds([]);
      }
    }

    loadEnrollments();
    return () => { alive = false; };
  }, [user]);

  const catalogueCategories = useMemo(() => [
    "All",
    ...Array.from(new Set(catalogueCourses.map((course) => course.category).filter(Boolean)))
  ], [catalogueCourses]);
  const categoryCounts = useMemo(() => getCategoryCounts(catalogueCourses), [catalogueCourses]);

  const filteredCourses = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const result = catalogueCourses.filter((course) => {
      const categoryMatch = selectedCategory === "All" || course.category === selectedCategory;
      if (!categoryMatch) return false;

      const searchBlob = [
        course.id,
        course.number,
        course.title,
        course.artTitle,
        course.category,
        course.meta,
        course.badge,
        course.description,
        course.instructor,
        course.duration,
        course.lessons,
        course.resources,
        course.language
      ].join(" ").toLowerCase();

      const queryMatch = !tokens.length || tokens.every((token) => searchBlob.includes(token));
      return queryMatch;
    });

    if (sort === "az") return [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "za") return [...result].sort((a, b) => b.title.localeCompare(a.title));
    if (sort === "category") return [...result].sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
    if (sort === "oldest") return [...result].sort((a, b) => Number(a.number) - Number(b.number));
    if (sort === "newest") return [...result].sort((a, b) => Number(b.number) - Number(a.number));
    return [...result].sort((a, b) => Number(a.number) - Number(b.number));
  }, [catalogueCourses, query, selectedCategory, sort]);

  const filtersActive = Boolean(query.trim()) || selectedCategory !== "All" || sort !== "recommended";

  function clearFilters() {
    setQuery("");
    setSelectedCategory("All");
    setSort("recommended");
    setSortOpen(false);
    setCategoryOpen(false);
  }

  const featuredCourses = catalogueCourses.filter((course) => course.featured);
  const enrolledCourses = enrolledIds
    .map((id) => catalogueCourses.find((course) => String(course.id) === String(id)))
    .filter(Boolean);

  async function refreshCatalogue() {
    setRefreshing(true);
    setSortOpen(false);
    setCategoryOpen(false);
    try {
      const latest = await loadCatalogueCourses({ force: true });
      if (latest.length) setCatalogueCourses(latest);
    } finally {
      setQuery("");
      setSelectedCategory("All");
      setSort("recommended");
      setRefreshing(false);
    }
  }

  function selectCategory(category) {
    setSelectedCategory(category);
    setCategoryOpen(false);
    document.getElementById("courses")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function markEnrolled(id, next = true) {
    setEnrolledIds((current) => {
      const key = String(id);
      if (next) return current.includes(key) ? current : [...current, key];
      return current.filter((item) => item !== key);
    });
  }

  return (
    <main className="reference-shell">
      <header className="site-header">
        <Link href="/" className="brand-lockup" aria-label="Sayeed Courses Hub home">
          <span className="brand-logo">
            <img src="/shahid-logo.png" alt="Shahid" />
          </span>
          <span className="brand-text">
            <strong>Sayeed Courses Hub</strong>
            <small>Your Next Skills Start Here</small>
          </span>
        </Link>

        <div className="header-actions">
          <button className="header-pill wide" type="button" onClick={() => setFaqOpen(true)}>
            <CircleHelp size={20} /> FAQs
          </button>
          <button className="header-icon" type="button" onClick={refreshCatalogue} aria-label="Refresh catalogue">
            <RefreshCw size={21} className={refreshing ? "spin" : ""} />
          </button>
          <button className="header-icon telegram" type="button" onClick={() => setMenuOpen(true)} aria-label="Open study links">
            <Send size={22} />
          </button>
          <button className="header-icon cart-button" type="button" onClick={() => setLearningOpen(true)} aria-label="My courses">
            <ShoppingBag size={22} />
            <span>{enrolledCourses.length}</span>
          </button>
          <button className="header-icon" type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={23} />
          </button>
        </div>
      </header>

      <section className="hero-block">
        <span className="hero-kicker">CURIOUS MINDS. ENDLESS POSSIBILITIES.</span>
        <h1>Find your next <em>skill.</em></h1>
        <div className="search-box-large">
          <Search size={24} />
          <input
            type="search"
            inputMode="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search course by name or # number..."
            aria-label="Search course by name or number"
          />
          {query && (
            <button type="button" className="search-clear" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="sort-wrap">
          <button className="sort-button" type="button" aria-expanded={sortOpen} aria-haspopup="listbox" onClick={() => setSortOpen((open) => !open)}>
            <span><span className="sort-symbol">↕</span> Sort courses</span>
            <ChevronDown size={19} className={sortOpen ? "rotate" : ""} />
          </button>
          {sortOpen && (
            <div className="sort-menu" role="listbox" aria-label="Sort courses">
              {[
                ["recommended", "Recommended"],
                ["newest", "Newest first"],
                ["oldest", "Oldest first"],
                ["az", "A — Z"],
                ["za", "Z — A"],
                ["category", "Category"]
              ].map(([value, label]) => (
                <button key={value} type="button" role="option" aria-selected={sort === value} className={sort === value ? "selected" : ""} onClick={() => { setSort(value); setSortOpen(false); }}>
                  {label}{sort === value && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={`filter-summary ${filtersActive ? "has-filters" : ""}`} aria-live="polite">
          <span>Search, filter and sort your catalogue instantly.</span>
          {filtersActive && (
            <button type="button" onClick={clearFilters}>Clear filters</button>
          )}
        </div>
      </section>

      <section className="catalogue-section" id="courses">
        <div className="catalogue-head">
          <span>{filteredCourses.length} {filteredCourses.length === 1 ? "course" : "courses"} to explore</span>
          <button className="category-trigger" type="button" aria-expanded={categoryOpen} aria-haspopup="dialog" onClick={() => setCategoryOpen(true)}>
            {selectedCategory === "All" ? "All Courses" : selectedCategory}
            <ChevronDown size={17} />
          </button>
        </div>

        <div className="course-grid">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isEnrolled={enrolledIds.includes(String(course.id))}
              onEnrolled={markEnrolled}
              onNeedsAuth={() => setAuthOpen(true)}
            />
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="no-results">
            <Search size={28} />
            <h2>No courses found</h2>
            <p>Try another search or reset the category filter.</p>
            <button type="button" onClick={clearFilters}>Reset filters</button>
          </div>
        )}
      </section>

      <section className="feature-strip">
        <div>
          <span className="section-kicker">CURATED FOR YOU</span>
          <h2>Popular learning picks.</h2>
        </div>
        <div className="featured-list">
          {featuredCourses.map((course) => (
            <Link className="featured-card" key={course.id} href={`/course/${course.id}`}>
              <span className={`featured-dot ${course.tone}`} />
              <span className="featured-copy">
                <small>{course.category}</small>
                <strong>{course.title}</strong>
              </span>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <div>
          <strong>SAYEED COURSES</strong>
          <span>Learn something useful. Keep moving.</span>
        </div>
        <span>© 2026 Sayeed Courses Hub</span>
      </footer>

      {categoryOpen && (
        <Modal title="Course categories" kicker="EXPLORE YOUR INTERESTS" onClose={() => setCategoryOpen(false)} className="categories-modal">
          <button className="reset-filters" type="button" onClick={() => selectCategory("All")}>Reset all filters ↻</button>
          <div className="category-list">
            {catalogueCategories.map((category) => (
              <button
                key={category}
                type="button"
                className={selectedCategory === category ? "category-row active" : "category-row"}
                onClick={() => selectCategory(category)}
              >
                <span>{category === "All" ? "All Courses" : category}</span>
                <strong>{categoryCounts[category] || 0}</strong>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {faqOpen && (
        <Modal title="Questions & answers" kicker="A LITTLE CLARITY" onClose={() => setFaqOpen(false)} className="faq-modal">
          <button className="collapse-all" type="button" onClick={() => setExpandedFaq(null)}>Collapse all</button>
          <div className="faq-rows">
            {FAQS.map(([question, answer], index) => {
              const open = expandedFaq === index;
              return (
                <div className={`faq-row ${open ? "open" : ""}`} key={question}>
                  <button type="button" onClick={() => setExpandedFaq(open ? null : index)}>
                    <span>{question}</span><span className="faq-plus">{open ? "−" : "+"}</span>
                  </button>
                  {open && <p>{answer}</p>}
                </div>
              );
            })}
          </div>
          <div className="faq-help">Still need help? Open the course details or connect your Telegram access there →</div>
        </Modal>
      )}

      {learningOpen && (
        <Modal title="My course shelf" kicker="YOUR NEXT CHAPTER" onClose={() => setLearningOpen(false)} className="learning-modal">
          {!user ? (
            <div className="modal-empty">
              <ShoppingBag size={29} />
              <h3>Sign in to save courses</h3>
              <p>Your enrolled courses are linked to your Google account.</p>
              <button type="button" className="modal-primary" onClick={() => { setLearningOpen(false); setAuthOpen(true); }}>SIGN IN</button>
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div className="modal-empty">
              <ShoppingBag size={29} />
              <h3>Your shelf is empty</h3>
              <p>Tap ENROLL on any course to start building your learning list.</p>
            </div>
          ) : (
            <div className="learning-list">
              {enrolledCourses.map((course) => (
                <Link href={`/course/${course.id}`} className="learning-row" key={course.id} onClick={() => setLearningOpen(false)}>
                  <span className={`learning-thumb ${course.tone}`}><span>{course.category}</span></span>
                  <span>
                    <small>{course.category}</small>
                    <strong>{course.title}</strong>
                  </span>
                  <ArrowUpRight size={18} />
                </Link>
              ))}
            </div>
          )}
        </Modal>
      )}

      {menuOpen && (
        <Modal title="Your course hub" kicker="KEEP IT SIMPLE" onClose={() => setMenuOpen(false)} className="menu-modal">
          <div className="menu-account">
            <span>ACCOUNT</span>
            <strong>{user?.displayName || user?.email || "Not signed in"}</strong>
            <button type="button" onClick={() => { setMenuOpen(false); setAuthOpen(true); }}>ACCOUNT SETTINGS</button>
          </div>
          <div className="menu-links">
            <button type="button" onClick={() => { setMenuOpen(false); setFaqOpen(true); }}><CircleHelp size={18} /> FAQs</button>
            <button type="button" onClick={() => { setMenuOpen(false); setCategoryOpen(true); }}><Sparkles size={18} /> Categories</button>
            <button type="button" onClick={() => { setMenuOpen(false); setLearningOpen(true); }}><ShoppingBag size={18} /> My Courses <span>{enrolledCourses.length}</span></button>
            {adminUser && (
              <Link href="/admin" className="menu-link-button" onClick={() => setMenuOpen(false)}><ShieldCheck size={18} /> Admin Panel <span>PRO</span></Link>
            )}
            <button type="button" onClick={() => { setMenuOpen(false); setAuthOpen(true); }}><RefreshCw size={18} /> Sign in / Sign out</button>
          </div>
        </Modal>
      )}

      {authOpen && (
        <Modal title="Your account" kicker="A LITTLE PERSONAL" onClose={() => setAuthOpen(false)} className="auth-modal">
          <AuthPanel embedded onClose={() => setAuthOpen(false)} />
        </Modal>
      )}
    </main>
  );
}
