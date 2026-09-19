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

const categories = ["All", "KVS", "NVS", "CTET", "Teaching", "SSC"];

const courses = [
  {
    id: 1,
    category: "KVS",
    title: "KVS / NVS INTERVIEW BATCH",
    badge: "FREE",
    meta: "Interview Preparation",
    description: "Premium interview preparation resources, practice and guidance.",
    tone: "blue",
  },
  {
    id: 2,
    category: "CTET",
    title: "CTET COMPLETE PREPARATION",
    badge: "NEW",
    meta: "Paper I + II",
    description: "Structured preparation resources with chapter-wise study support.",
    tone: "purple",
  },
  {
    id: 3,
    category: "Teaching",
    title: "TEACHER'S TOOLKIT",
    badge: "FREE",
    meta: "Teaching Resources",
    description: "Useful classroom resources, worksheets and smart teaching material.",
    tone: "teal",
  },
  {
    id: 4,
    category: "SSC",
    title: "SSC FOUNDATION BATCH",
    badge: "POPULAR",
    meta: "Foundation Course",
    description: "A focused foundation track for systematic exam preparation.",
    tone: "orange",
  }
];

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

export default function Home() {
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
            to keep all your enrolled learning in one hub.
          </p>
          <div className="hero-buttons">
            <a className="primary-button" href="#courses">
              Explore Courses <ArrowRight size={18} />
            </a>
            <a className="ghost-button" href="#enrolled">
              My Enrolled
            </a>
          </div>
        </div>

        <div className="hero-card">
          <div className="hero-card-label">FEATURED</div>
          <div className="hero-card-title">PREMIUM<br />LEARNING</div>
          <div className="hero-card-line" />
          <div className="hero-card-foot">
            <span>4+ Categories</span>
            <span>Built for Mobile</span>
          </div>
        </div>
      </section>

      <section className="search-section" id="courses">
        <div className="section-heading">
          <div>
            <span className="section-kicker">COURSE LIBRARY</span>
            <h2>Find your course.</h2>
          </div>
          <span className="course-count">{courses.length} COURSES</span>
        </div>

        <div className="search-box">
          <Search size={20} />
          <input placeholder="Search by course name or category..." aria-label="Search courses" />
          <kbd>⌘ K</kbd>
        </div>

        <div className="filter-row" id="categories">
          {categories.map((category, index) => (
            <button key={category} className={`filter-pill ${index === 0 ? "selected" : ""}`}>
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="courses-grid">
        {courses.map((course) => (
          <article className="course-card" key={course.id}>
            <CourseArtwork tone={course.tone} badge={course.badge} />

            <div className="course-body">
              <div className="course-meta-row">
                <span>{course.category}</span>
                <span className="meta-dot">•</span>
                <span>{course.meta}</span>
              </div>

              <h3>{course.title}</h3>
              <p>{course.description}</p>

              <div className="course-divider" />

              <div className="course-actions">
                <button className="enroll-button">
                  <span className="enroll-icon"><Check size={16} /></span>
                  ENROLL
                </button>

                <button className="study-button">
                  LET&apos;S STUDY <ArrowRight size={19} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="enrolled-preview" id="enrolled">
        <div>
          <span className="section-kicker">YOUR SPACE</span>
          <h2>My Enrolled Courses</h2>
          <p>
            In Phase 1 this is the visual foundation. Later, Firebase will save
            every enrollment and this section will show each student&apos;s own courses.
          </p>
        </div>
        <div className="empty-state">
          <BookOpen size={22} />
          <span>No courses enrolled yet</span>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div>
          <span className="section-kicker">HELP</span>
          <h2>Frequently asked.</h2>
        </div>
        <div className="faq-list">
          {[
            ["How does Enroll work?", "In the final version, Enroll will save the course to your account."],
            ["Where will the course open?", "The final Let's Study button will use the course's Telegram private-channel link."],
            ["Can I see all my enrolled courses?", "Yes. A dedicated Enrolled section will show only courses saved to your account."],
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
        <span>Phase 1 • Premium UI Foundation</span>
      </footer>
    </main>
  );
}
