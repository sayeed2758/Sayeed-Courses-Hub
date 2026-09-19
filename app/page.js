 "use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Menu,
  Search,
  Sparkles,
  UserRound,
  X
} from "lucide-react";

import { categories, courses } from "../lib/courses";

function CourseArtwork({ tone, badge }) {
  return (
    <div className={`course-art ${tone}`}>
      <div className="art-noise" />
      <div className="art-topline">
        <span className="art-brand">EZEE VISION</span>
        <span className="art-badge">{badge}</span>
      </div>
      <div className="art-content">
        <span className="art-small">PREMIUM</span>
        <strong>COURSE</strong>
        <strong>HUB</strong>
      </div>
      <div className="art-shape one" />
      <div className="art-shape two" />
    </div>
  );
}

function CourseCard({ course }) {
  const [notice, setNotice] = useState(false);

  return (
    <article className={`course-card ${course.status === "inactive" ? "course-disabled" : ""}`}>
      <Link
        href={`/course/${course.id}`}
        className="course-card-link"
        aria-label={`Open ${course.title}`}
      >
        <CourseArtwork tone={course.tone} badge={course.badge} />
      </Link>

      <div className="course-body">
        <div className="course-meta-row">
          <span>{course.category}</span>
          <span className="meta-dot">•</span>
          <span>{course.meta}</span>
          {course.status === "inactive" && <span className="status-chip">COMING SOON</span>}
        </div>

        <Link href={`/course/${course.id}`} className="course-title-link">
          <h3>{course.title}</h3>
        </Link>
        <p>{course.description}</p>

        <div className="course-divider" />

        <div className="course-actions">
          <button
            className="enroll-button"
            disabled={course.status !== "active"}
            onClick={() => setNotice(true)}
          >
            <span className="enroll-icon"><Check size={16} /></span>
            ENROLL
          </button>

          <button
            className="study-button"
            disabled={course.status !== "active"}
            onClick={() => setNotice(true)}
          >
            LET&apos;S STUDY <ArrowRight size={19} />
          </button>
        </div>

        {notice && (
          <div className="phase-notice" role="status">
            <span>Catalogue controls are ready. Real enrollment comes in Phase 4.</span>
            <button onClick={() => setNotice(false)} aria-label="Close notice">
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [query, setQuery] = useState("");

  const activeCourses = courses.filter((course) => course.status === "active");
  const featuredCourses = courses.filter(
    (course) => course.featured && course.status === "active"
  );

  const filteredCourses = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return activeCourses.filter((course) => {
      const categoryMatch =
        selectedCategory === "All" || course.category === selectedCategory;

      const textMatch =
        !normalized ||
        course.title.toLowerCase().includes(normalized) ||
        course.category.toLowerCase().includes(normalized) ||
        course.meta.toLowerCase().includes(normalized) ||
        course.description.toLowerCase().includes(normalized);

      return categoryMatch && textMatch;
    });
  }, [query, selectedCategory]);

  return (
    <main className="site-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={18} strokeWidth={2.5} /></div>
          <div>
            <div className="brand-title">EZEE VISION</div>
            <div className="brand-subtitle">COURSE HUB</div>
          </div>
        </div>

        <nav className="desktop-nav">
          <a className="active" href="#courses">Courses</a>
          <a href="#categories">Categories</a>
          <a href="#featured">Featured</a>
          <a href="#enrolled">Enrolled</a>
          <a href="#faq">FAQ</a>
        </nav>

        <div className="top-actions">
          <button className="icon-button" aria-label="Account">
            <UserRound size={19} />
          </button>
          <button className="menu-button" aria-label="Menu">
            <Menu size={20} />
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-glow glow-one" />
        <div className="hero-glow glow-two" />
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> LEARN. PREPARE. ACHIEVE.</div>
          <h1>
            Your next
            <span> learning journey</span>
            starts here.
          </h1>
          <p>
            Discover focused courses, premium study resources and a clean place
            to keep all your learning in one hub.
          </p>
          <div className="hero-buttons">
            <a className="primary-button" href="#courses">
              Explore Courses <ArrowRight size={18} />
            </a>
            <a className="ghost-button" href="#featured">
              Featured Courses
            </a>
          </div>
        </div>

        <div className="hero-card">
          <div className="hero-card-label">PHASE 2</div>
          <div className="hero-card-title">SMART<br />CATALOGUE</div>
          <div className="hero-card-line" />
          <div className="hero-card-foot">
            <span>{activeCourses.length} Active Courses</span>
            <span>Live Filters</span>
          </div>
        </div>
      </section>

      <section className="search-section" id="courses">
        <div className="section-heading">
          <div>
            <span className="section-kicker">COURSE LIBRARY</span>
            <h2>Find your course.</h2>
          </div>
          <span className="course-count">
            {filteredCourses.length} {filteredCourses.length === 1 ? "COURSE" : "COURSES"}
          </span>
        </div>

        <div className="search-box">
          <Search size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by course name or category..."
            aria-label="Search courses"
          />
          {query && (
            <button className="clear-search" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="filter-row" id="categories">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`filter-pill ${selectedCategory === category ? "selected" : ""}`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="featured-section" id="featured">
        <div className="section-heading">
          <div>
            <span className="section-kicker">HANDPICKED</span>
            <h2>Featured courses.</h2>
          </div>
          <span className="course-count">{featuredCourses.length} FEATURED</span>
        </div>

        <div className="featured-row">
          {featuredCourses.map((course) => (
            <Link className="featured-mini-card" key={course.id} href={`/course/${course.id}`}>
              <div className={`mini-art ${course.tone}`}>
                <span>{course.category}</span>
                <strong>{course.badge}</strong>
              </div>
              <div className="mini-copy">
                <span>{course.meta}</span>
                <h3>{course.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="courses-grid">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => <CourseCard course={course} key={course.id} />)
        ) : (
          <div className="empty-results">
            <Search size={24} />
            <h3>No courses found</h3>
            <p>Try another search term or choose a different category.</p>
            <button
              onClick={() => {
                setQuery("");
                setSelectedCategory("All");
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      <section className="enrolled-preview" id="enrolled">
        <div>
          <span className="section-kicker">YOUR SPACE</span>
          <h2>My Enrolled Courses</h2>
          <p>
            Phase 2 prepares the catalogue. In the enrollment phase, Firebase
            will save every user&apos;s courses permanently.
          </p>
        </div>
        <div className="empty-state">
          <BookOpen size={22} />
          <span>Enrollment will be connected in Phase 4</span>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div>
          <span className="section-kicker">HELP</span>
          <h2>Frequently asked.</h2>
        </div>
        <div className="faq-list">
          {[
            ["How do I find a course?", "Use the search box or category filters. Results update instantly."],
            ["What is Featured?", "Featured courses are selected by the catalogue configuration and shown in a dedicated section."],
            ["When will Enroll save my course?", "Persistent enrollment is introduced in the Firebase-powered enrollment phase."]
          ].map(([q, a]) => (
            <details key={q} className="faq-item">
              <summary>{q}<ChevronDown size={18} /></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <div className="brand-mark"><Sparkles size={17} /></div>
          <span>EZEE VISION COURSE HUB</span>
        </div>
        <span>Phase 2 • Smart Course Catalogue</span>
      </footer>
    </main>
  );
}
