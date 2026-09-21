"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Database, ExternalLink, Eye, Image as ImageIcon, Plus, Save, Search, ShieldCheck, Trash2, X, RefreshCw, Video, UploadCloud, Pencil, EyeOff } from "lucide-react";
import { useAuth } from "../providers";
import { courses as staticCourses } from "../../lib/courses";
import { loadCatalogueCourses } from "../../lib/catalogue";
import { ensureCatalogueSeeded, isUserAdmin, removeCourse, saveCourse, seedStaticCourses } from "../../lib/admin";
import { VIDEO_API_URL } from "../../lib/videoApi";
import { bulkImportVideoLessons, getVideoLessons, removeVideoLesson, saveVideoLesson } from "../../lib/videoLessons";

const emptyCourse = {
  id: "",
  number: 0,
  category: "KVS",
  title: "",
  artTitle: "COURSE",
  badge: "NEW",
  meta: "Course",
  description: "",
  tone: "blue",
  status: "active",
  featured: false,
  telegramUrl: "",
  thumbnailUrl: "",
  videoEnabled: false,
  videoCourseKey: "",
  instructor: "Sayeed Courses Hub",
  duration: "Self-paced",
  lessons: "",
  resources: "",
  language: "Hindi + English",
  overview: "",
  learn: [],
  modules: []
};

function toEditor(course) {
  return {
    ...emptyCourse,
    ...course,
    id: String(course?.id || ""),
    learnText: Array.isArray(course?.learn) ? course.learn.join(", ") : "",
    modulesText: Array.isArray(course?.modules) ? course.modules.join(", ") : ""
  };
}

function cleanForSave(editor) {
  return {
    id: editor.id.trim(),
    number: Number(editor.number || 0),
    category: editor.category.trim(),
    title: editor.title.trim(),
    artTitle: editor.artTitle.trim(),
    badge: editor.badge.trim(),
    meta: editor.meta.trim(),
    description: editor.description.trim(),
    tone: editor.tone,
    status: editor.status,
    featured: Boolean(editor.featured),
    telegramUrl: editor.telegramUrl.trim(),
    thumbnailUrl: editor.thumbnailUrl.trim(),
    videoEnabled: Boolean(editor.videoEnabled),
    videoCourseKey: editor.videoCourseKey.trim(),
    instructor: editor.instructor.trim(),
    duration: editor.duration.trim(),
    lessons: editor.lessons.trim(),
    resources: editor.resources.trim(),
    language: editor.language.trim(),
    overview: editor.overview.trim(),
    learn: editor.learnText.split(",").map((x) => x.trim()).filter(Boolean),
    modules: editor.modulesText.split(",").map((x) => x.trim()).filter(Boolean)
  };
}


function buildImportedLessons(source, courseId) {
  const lessons = [];
  (source.modules || []).forEach((module) => {
    (module.videos || []).forEach((video, index) => {
      lessons.push({
        courseId: String(courseId),
        sourceCourse: String(source.course || ""),
        module: String(module.module || "01"),
        messageId: Number(video.messageId),
        videoId: String(video.videoId || ""),
        title: String(video.title || "Untitled lesson"),
        order: index + 1,
        published: true
      });
    });
  });
  return lessons;
}

function VideoManager({ courses, admin }) {
  const [telegramCatalogue, setTelegramCatalogue] = useState(null);
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [sourceTargets, setSourceTargets] = useState({});
  const [managedLessons, setManagedLessons] = useState([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoMessage, setVideoMessage] = useState("");
  const [videoError, setVideoError] = useState("");

  const activeCourses = useMemo(
    () => courses.filter((course) => course.status === "active"),
    [courses]
  );

  function guessTarget(sourceKey) {
    const normalized = String(sourceKey || "").trim().toLowerCase();
    return activeCourses.find((course) =>
      String(course.videoCourseKey || "").trim().toLowerCase() === normalized ||
      String(course.category || "").trim().toLowerCase() === normalized
    )?.id || "";
  }

  async function loadTelegramCatalogue(force = false) {
    if (!VIDEO_API_URL) {
      setVideoError("Video API is not configured in Vercel.");
      return;
    }
    setVideoLoading(true);
    setVideoError("");
    try {
      const url = `${VIDEO_API_URL}/courses${force ? "?refresh=true" : ""}`;
      const response = await fetch(url, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.error || "Could not load Telegram videos.");
      setTelegramCatalogue(payload);
      const defaults = {};
      (payload.courses || []).forEach((source) => {
        defaults[source.course] = sourceTargets[source.course] || guessTarget(source.course);
      });
      setSourceTargets(defaults);
      if (!selectedTargetId && activeCourses[0]?.id) setSelectedTargetId(String(activeCourses[0].id));
    } catch (error) {
      setVideoError(error?.message || "Could not load Telegram video catalogue.");
    } finally {
      setVideoLoading(false);
    }
  }

  async function loadManagedLessons(courseId = selectedTargetId) {
    if (!courseId) {
      setManagedLessons([]);
      return;
    }
    setVideoLoading(true);
    setVideoError("");
    try {
      const rows = await getVideoLessons(courseId);
      setManagedLessons(rows);
    } catch (error) {
      setVideoError(error?.message || "Could not load published lessons.");
    } finally {
      setVideoLoading(false);
    }
  }

  useEffect(() => {
    if (admin && activeCourses.length && !selectedTargetId) {
      setSelectedTargetId(String(activeCourses[0].id));
    }
  }, [admin, activeCourses, selectedTargetId]);

  useEffect(() => {
    if (admin && selectedTargetId) loadManagedLessons(selectedTargetId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTargetId, admin]);

  async function handleImport(source) {
    const targetId = sourceTargets[source.course] || guessTarget(source.course);
    if (!targetId) {
      setVideoError(`Choose a website course for Telegram course “${source.course}” first.`);
      return;
    }
    setVideoBusy(true);
    setVideoError("");
    setVideoMessage("");
    try {
      const lessons = buildImportedLessons(source, targetId);
      const saved = await bulkImportVideoLessons(lessons);
      setSelectedTargetId(String(targetId));
      setManagedLessons(await getVideoLessons(targetId));
      setVideoMessage(`${saved.length} lesson${saved.length === 1 ? "" : "s"} imported and published for ${activeCourses.find((course) => String(course.id) === String(targetId))?.title || `Course ${targetId}`}.`);
    } catch (error) {
      setVideoError(error?.message || "Could not import Telegram lessons.");
    } finally {
      setVideoBusy(false);
    }
  }

  async function handleSaveLesson(lesson) {
    setVideoBusy(true);
    setVideoError("");
    try {
      const saved = await saveVideoLesson(lesson);
      setManagedLessons((rows) => rows.map((row) => row.id === saved.id ? saved : row));
      setVideoMessage("Lesson updated.");
    } catch (error) {
      setVideoError(error?.message || "Could not update lesson.");
    } finally {
      setVideoBusy(false);
    }
  }

  async function handleDeleteLesson(lesson) {
    if (!window.confirm(`Remove “${lesson.title}” from this course?`)) return;
    setVideoBusy(true);
    setVideoError("");
    try {
      await removeVideoLesson(lesson.id);
      setManagedLessons((rows) => rows.filter((row) => row.id !== lesson.id));
      setVideoMessage("Lesson removed from the published library.");
    } catch (error) {
      setVideoError(error?.message || "Could not remove lesson.");
    } finally {
      setVideoBusy(false);
    }
  }

  return (
    <section className="admin-video-manager">
      <div className="admin-video-manager-head">
        <div>
          <span className="admin-section-title">VIDEO LIBRARY MANAGER</span>
          <h2><Video size={21} /> Manage lessons without editing code.</h2>
          <p>Sync videos from the private Telegram channel, map them to a website course, then publish or edit each lesson here.</p>
        </div>
        <button type="button" className="admin-secondary" onClick={() => loadTelegramCatalogue(true)} disabled={videoLoading || videoBusy}>
          <RefreshCw size={16} className={videoLoading ? "spin" : ""} /> SYNC TELEGRAM
        </button>
      </div>

      {videoMessage && <div className="admin-message success"><Check size={16} /> {videoMessage}</div>}
      {videoError && <div className="admin-message error">{videoError}</div>}

      <div className="admin-video-toolbar">
        <label>Manage published lessons for
          <select value={selectedTargetId} onChange={(event) => setSelectedTargetId(event.target.value)}>
            <option value="">Choose course</option>
            {activeCourses.map((course) => <option key={course.id} value={course.id}>#{course.number} — {course.title}</option>)}
          </select>
        </label>
        <div className="admin-video-stats">
          <span>{telegramCatalogue?.videoCount || 0} Telegram videos found</span>
          <span>{managedLessons.filter((lesson) => lesson.published).length} published here</span>
        </div>
      </div>

      {!telegramCatalogue ? (
        <div className="admin-video-empty">
          <UploadCloud size={26} />
          <strong>Start with Telegram sync.</strong>
          <span>Pull the current course/module/video list from your private channel. Existing videos are not uploaded again.</span>
          <button type="button" className="modal-primary" onClick={() => loadTelegramCatalogue(false)} disabled={videoLoading}><RefreshCw size={15} /> LOAD TELEGRAM LIBRARY</button>
        </div>
      ) : (
        <>
          <div className="admin-video-source-grid">
            {(telegramCatalogue.courses || []).map((source) => (
              <article className="admin-video-source-card" key={source.course}>
                <div className="admin-video-source-top"><span>{source.course}</span><strong>{source.videoCount} VIDEOS</strong></div>
                <small>{source.moduleCount} modules</small>
                <label>Website course
                  <select
                    value={sourceTargets[source.course] || ""}
                    onChange={(event) => setSourceTargets((current) => ({ ...current, [source.course]: event.target.value }))}
                  >
                    <option value="">Choose course</option>
                    {activeCourses.map((course) => <option key={course.id} value={course.id}>#{course.number} — {course.title}</option>)}
                  </select>
                </label>
                <button type="button" className="admin-import-button" onClick={() => handleImport(source)} disabled={videoBusy || !sourceTargets[source.course]}>
                  <UploadCloud size={15} /> IMPORT & PUBLISH
                </button>
              </article>
            ))}
          </div>

          <div className="admin-published-lessons">
            <div className="admin-form-head"><span>PUBLISHED LESSONS</span><strong>{managedLessons.length}</strong></div>
            {selectedTargetId && managedLessons.length === 0 ? (
              <div className="admin-list-empty">No published lessons for this website course yet.</div>
            ) : managedLessons.map((lesson) => (
              <div className={`admin-lesson-row ${lesson.published ? "" : "unpublished"}`} key={lesson.id}>
                <div className="admin-lesson-fields">
                  <label>Module<input value={lesson.module} onChange={(event) => setManagedLessons((rows) => rows.map((row) => row.id === lesson.id ? { ...row, module: event.target.value } : row))} /></label>
                  <label>Title<input value={lesson.title} onChange={(event) => setManagedLessons((rows) => rows.map((row) => row.id === lesson.id ? { ...row, title: event.target.value } : row))} /></label>
                  <label>Order<input type="number" min="1" value={lesson.order} onChange={(event) => setManagedLessons((rows) => rows.map((row) => row.id === lesson.id ? { ...row, order: event.target.value } : row))} /></label>
                </div>
                <div className="admin-lesson-meta"><span>{lesson.videoId || "VIDEO"}</span><span>Message {lesson.messageId}</span></div>
                <div className="admin-lesson-actions">
                  <button type="button" className="admin-secondary" onClick={() => handleSaveLesson({ ...lesson, published: !lesson.published })} disabled={videoBusy}>
                    {lesson.published ? <><EyeOff size={15} /> UNPUBLISH</> : <><Check size={15} /> PUBLISH</>}
                  </button>
                  <button type="button" className="admin-edit" onClick={() => handleSaveLesson(lesson)} disabled={videoBusy}><Save size={15} /> SAVE</button>
                  <button type="button" className="admin-delete" onClick={() => handleDeleteLesson(lesson)} disabled={videoBusy}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default function AdminPage() {
  const { user, authLoading } = useAuth();
  const [adminChecked, setAdminChecked] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [items, setItems] = useState([]);
  const [editor, setEditor] = useState(toEditor(emptyCourse));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [listQuery, setListQuery] = useState("");
  const [listFilter, setListFilter] = useState("all");

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const list = await loadCatalogueCourses();
      setItems(list);
    } catch (err) {
      setError(err?.message || "Could not load catalogue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    async function check() {
      setAdminChecked(false);
      if (authLoading || !user) {
        if (alive) setAdmin(false);
        return;
      }
      const allowed = await isUserAdmin(user.uid);
      if (alive) {
        setAdmin(allowed);
        setAdminChecked(true);
      }
      if (allowed) {
        try {
          await ensureCatalogueSeeded(staticCourses);
          await loadItems();
        } catch (err) {
          if (alive) setError(err?.message || "Could not initialize the admin catalogue.");
          if (alive) setLoading(false);
        }
      }
    }
    check();
    return () => { alive = false; };
  }, [user, authLoading]);

  const sortedItems = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    const filtered = items.filter((course) => {
      const statusMatch = listFilter === "all" || (listFilter === "active" ? course.status === "active" : course.status === "inactive");
      if (!statusMatch) return false;
      if (!q) return true;
      return [course.id, course.number, course.title, course.category, course.badge, course.meta]
        .join(" ").toLowerCase().includes(q);
    });
    return [...filtered].sort((a, b) => Number(a.number) - Number(b.number));
  }, [items, listQuery, listFilter]);

  function chooseCourse(course) {
    setEditor(toEditor(course));
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startNew() {
    const nextNumber = sortedItems.reduce((max, item) => Math.max(max, Number(item.number || 0)), 0) + 1;
    setEditor(toEditor({ ...emptyCourse, number: nextNumber, id: String(nextNumber) }));
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const payload = cleanForSave(editor);
      if (!payload.id || !payload.title || !payload.category) throw new Error("Course ID, title and category are required.");
      const saved = await saveCourse(payload);
      setItems((current) => {
        const without = current.filter((item) => String(item.id) !== String(saved.id));
        return [...without, saved].sort((a, b) => Number(a.number) - Number(b.number));
      });
      setEditor(toEditor(saved));
      setMessage("Course saved to the Firestore catalogue.");
    } catch (err) {
      setError(err?.message || "Could not save course.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(course) {
    if (!window.confirm(`Delete “${course.title}” from the Firestore catalogue?`)) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await removeCourse(course.id);
      setItems((current) => current.filter((item) => String(item.id) !== String(course.id)));
      setEditor(toEditor(emptyCourse));
      setMessage("Course deleted from Firestore. Static fallback remains available until the remote catalogue is reseeded.");
    } catch (err) {
      setError(err?.message || "Could not delete course.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSeed() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await seedStaticCourses(staticCourses);
      await loadItems();
      setMessage("Static catalogue synced to Firestore.");
    } catch (err) {
      setError(err?.message || "Could not sync catalogue.");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || !adminChecked) {
    return <main className="reference-shell admin-shell"><div className="page-empty"><span>Checking admin access...</span></div></main>;
  }

  if (!user) {
    return (
      <main className="reference-shell admin-shell">
        <header className="site-header">
          <Link href="/" className="back-home"><ArrowLeft size={19} /> Back</Link>
          <span className="brand-text"><strong>Sayeed Courses Hub</strong><small>ADMIN CONTROL</small></span>
          <span />
        </header>
        <div className="page-empty admin-gate">
          <ShieldCheck size={31} />
          <h2>Sign in required</h2>
          <p>Use the Google account that has been granted admin access in Firestore.</p>
          <Link href="/" className="modal-primary">BACK TO COURSES</Link>
        </div>
      </main>
    );
  }

  if (!admin) {
    return (
      <main className="reference-shell admin-shell">
        <header className="site-header">
          <Link href="/" className="back-home"><ArrowLeft size={19} /> Back</Link>
          <span className="brand-text"><strong>Sayeed Courses Hub</strong><small>ADMIN CONTROL</small></span>
          <span />
        </header>
        <div className="page-empty admin-gate">
          <ShieldCheck size={31} />
          <h2>Admin access not enabled</h2>
          <p>In Firebase Firestore, create collection <strong>admins</strong>, then create a document whose ID is your Google UID:</p>
          <code>{user.uid}</code>
          <p className="admin-hint">Add a field such as <strong>role: admin</strong>. The frontend cannot create this trusted role for you.</p>
          <a className="modal-primary" href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">OPEN FIREBASE <ExternalLink size={15} /></a>
        </div>
      </main>
    );
  }

  return (
    <main className="reference-shell admin-shell">
      <header className="site-header admin-header">
        <Link href="/" className="back-home"><ArrowLeft size={19} /> Back</Link>
        <div className="brand-lockup">
          <span className="brand-logo"><img src="/shahid-logo.png" alt="Shahid" /></span>
          <span className="brand-text"><strong>Sayeed Courses Hub</strong><small>ADMIN CONTROL CENTER</small></span>
        </div>
        <span className="admin-badge"><ShieldCheck size={14} /> ADMIN</span>
      </header>

      <section className="page-heading-new admin-heading">
        <span className="hero-kicker">COURSE MANAGEMENT</span>
        <h1>Control your catalogue.</h1>
        <p>Create, edit, feature or deactivate courses without touching the frontend code.</p>
      </section>

      {message && <div className="admin-message success"><Check size={17} /> {message}</div>}
      {error && <div className="admin-message error">{error}</div>}

      <div className="admin-toolbar">
        <button type="button" className="modal-primary" onClick={startNew}><Plus size={17} /> NEW COURSE</button>
        <button type="button" className="admin-secondary" onClick={handleSeed} disabled={busy}><Database size={17} /> SYNC STATIC CATALOGUE</button>
      </div>

      <VideoManager courses={items} admin={admin} />

      <section className="admin-layout">
        <form className="admin-form" onSubmit={handleSave}>
          <div className="admin-form-head"><span>COURSE EDITOR</span><strong>{editor.id ? `#${editor.number}` : "NEW"}</strong></div>
          <div className="admin-section-title">BASICS</div>

          <label>Course ID<input value={editor.id} onChange={(e) => setEditor({ ...editor, id: e.target.value })} placeholder="e.g. 7" /></label>
          <div className="admin-field-grid">
            <label>Number<input type="number" min="1" value={editor.number} onChange={(e) => setEditor({ ...editor, number: e.target.value })} /></label>
            <label>Category<input list="admin-category-list" value={editor.category} onChange={(e) => setEditor({ ...editor, category: e.target.value })} /><datalist id="admin-category-list"><option value="KVS" /><option value="NVS" /><option value="CTET" /><option value="Teaching" /><option value="SSC" /><option value="General" /></datalist></label>
          </div>
          <label>Course title<input value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} /></label>
          <div className="admin-field-grid">
            <label>Artwork title<input value={editor.artTitle} onChange={(e) => setEditor({ ...editor, artTitle: e.target.value })} /></label>
            <label>Badge<select value={editor.badge} onChange={(e) => setEditor({ ...editor, badge: e.target.value })}><option>FREE</option><option>NEW</option><option>POPULAR</option><option>SOON</option><option>PREMIUM</option></select></label>
          </div>
          <label>Meta label<input value={editor.meta} onChange={(e) => setEditor({ ...editor, meta: e.target.value })} /></label>
          <label>Description<textarea rows="3" value={editor.description} onChange={(e) => setEditor({ ...editor, description: e.target.value })} /></label>

          <div className="admin-section-title">PRESENTATION</div>
          <div className="admin-field-grid">
            <label>Tone<select value={editor.tone} onChange={(e) => setEditor({ ...editor, tone: e.target.value })}><option>blue</option><option>purple</option><option>teal</option><option>orange</option></select></label>
            <label>Status<select value={editor.status} onChange={(e) => setEditor({ ...editor, status: e.target.value })}><option value="active">Active</option><option value="inactive">Coming Soon</option></select></label>
          </div>
          <label>Thumbnail Direct Image URL<input value={editor.thumbnailUrl} onChange={(e) => setEditor({ ...editor, thumbnailUrl: e.target.value })} placeholder="https://...jpg" inputMode="url" /></label>
          {editor.thumbnailUrl ? (
            <div className="admin-thumb-preview">
              <div className="admin-thumb-preview-head"><span><ImageIcon size={14} /> THUMBNAIL PREVIEW</span><a href={editor.thumbnailUrl} target="_blank" rel="noreferrer"><Eye size={14} /> OPEN</a></div>
              <div className="admin-thumb-frame"><img src={editor.thumbnailUrl} alt="Course thumbnail preview" onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.parentElement?.classList.add("is-error"); }} /></div>
            </div>
          ) : null}
          <label>Telegram study URL<input value={editor.telegramUrl} onChange={(e) => setEditor({ ...editor, telegramUrl: e.target.value })} placeholder="https://t.me/..." inputMode="url" /></label>
          <div className="admin-link-hint">Paste the <strong>direct image link</strong> (JPG, PNG or WEBP) — not a Google Drive/Instagram page link. <span>16:9</span> recommended.</div>
          <div className="admin-section-title">COURSE DETAILS</div>
          <div className="admin-field-grid">
            <label>Instructor<input value={editor.instructor} onChange={(e) => setEditor({ ...editor, instructor: e.target.value })} /></label>
            <label>Duration<input value={editor.duration} onChange={(e) => setEditor({ ...editor, duration: e.target.value })} /></label>
          </div>
          <div className="admin-field-grid">
            <label>Lessons<input value={editor.lessons} onChange={(e) => setEditor({ ...editor, lessons: e.target.value })} /></label>
            <label>Resources<input value={editor.resources} onChange={(e) => setEditor({ ...editor, resources: e.target.value })} /></label>
          </div>
          <label>Language<input value={editor.language} onChange={(e) => setEditor({ ...editor, language: e.target.value })} /></label>
          <label>Overview<textarea rows="4" value={editor.overview} onChange={(e) => setEditor({ ...editor, overview: e.target.value })} /></label>
          <label>What you&apos;ll learn <small>Comma separated</small><textarea rows="3" value={editor.learnText || ""} onChange={(e) => setEditor({ ...editor, learnText: e.target.value })} /></label>
          <label>Modules <small>Comma separated</small><textarea rows="3" value={editor.modulesText || ""} onChange={(e) => setEditor({ ...editor, modulesText: e.target.value })} /></label>

          <div className="admin-section-title">VIDEO ACCESS</div>
          <label className="admin-check"><input type="checkbox" checked={Boolean(editor.videoEnabled)} onChange={(e) => setEditor({ ...editor, videoEnabled: e.target.checked })} /> Enable secure video lessons for this course</label>
          <label>Telegram Course Key <small>Must match the COURSE: value in your private video captions. Example: CTET</small><input value={editor.videoCourseKey || ""} onChange={(e) => setEditor({ ...editor, videoCourseKey: e.target.value })} placeholder={editor.category || "CTET"} /></label>

          <div className="admin-section-title">DISCOVERY</div>
          <label className="admin-check"><input type="checkbox" checked={Boolean(editor.featured)} onChange={(e) => setEditor({ ...editor, featured: e.target.checked })} /> Feature this course on the home page</label>
          <button className="modal-primary admin-save" type="submit" disabled={busy}><Save size={17} /> {busy ? "SAVING..." : "SAVE COURSE"}</button>
        </form>

        <section className="admin-list-panel">
          <div className="admin-form-head"><span>LIVE CATALOGUE</span><strong>{loading ? "..." : sortedItems.length}</strong></div>
          <div className="admin-list-tools">
            <div className="admin-list-search"><Search size={15} /><input value={listQuery} onChange={(e) => setListQuery(e.target.value)} placeholder="Search courses..." /><button type="button" onClick={() => setListQuery("")} aria-label="Clear search" disabled={!listQuery}><X size={14} /></button></div>
            <div className="admin-filter-row">
              {[['all','ALL'],['active','ACTIVE'],['inactive','COMING SOON']].map(([value,label]) => <button key={value} type="button" className={listFilter===value?"active":""} onClick={() => setListFilter(value)}>{label}</button>)}
            </div>
          </div>
          <div className="admin-course-list">
            {loading ? <div className="admin-list-empty">Loading catalogue...</div> : sortedItems.map((course) => (
              <article className="admin-course-row" key={course.id}>
                <div className="admin-course-row-main">
                  {course.thumbnailUrl ? <img className="admin-course-thumb" src={course.thumbnailUrl} alt="" loading="lazy" /> : <div className="admin-course-thumb admin-course-thumb-empty"><ImageIcon size={16} /></div>}
                  <div><span>#{course.number} · {course.category}</span><strong>{course.title}</strong><small>{course.status === "active" ? "ACTIVE" : "COMING SOON"}{course.featured ? " · FEATURED" : ""}</small></div>
                </div>
                <div className="admin-row-actions">
                  <button type="button" className="admin-edit" onClick={() => chooseCourse(course)}>EDIT</button>
                  <button type="button" className="admin-delete" onClick={() => handleDelete(course)} disabled={busy} aria-label={`Delete ${course.title}`}><Trash2 size={15} /></button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
