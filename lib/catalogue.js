import { collection, getDocs } from "firebase/firestore";
import { courses as staticCourses } from "./courses";
import { db, firebaseConfigured } from "./firebase";

let cache = {
  data: null,
  fetchedAt: 0,
  promise: null
};

const CACHE_TTL = 60_000;

function normalizeCourse(raw) {
  const category = String(raw.category ?? "General").trim();
  const explicitVideoCourseKey = String(
    raw.videoCourseKey ?? raw.videoCourse ?? ""
  ).trim();
  const videoCourseKey = explicitVideoCourseKey || category;

  return {
    id: String(raw.id ?? ""),
    number: Number(raw.number ?? 0),
    category,
    title: String(raw.title ?? "Untitled Course"),
    artTitle: String(raw.artTitle ?? raw.title ?? "COURSE"),
    badge: String(raw.badge ?? "NEW"),
    meta: String(raw.meta ?? "Course"),
    description: String(raw.description ?? ""),
    tone: String(raw.tone ?? "blue"),
    status: raw.status === "inactive" ? "inactive" : "active",
    featured: Boolean(raw.featured),
    telegramUrl: String(raw.telegramUrl ?? ""),
    thumbnailUrl: String(raw.thumbnailUrl ?? ""),
    videoCourseKey,
    videoEnabled: raw.videoEnabled === undefined ? Boolean(videoCourseKey) : Boolean(raw.videoEnabled),
    instructor: String(raw.instructor ?? "Sayeed Courses Hub"),
    duration: String(raw.duration ?? "Self-paced"),
    lessons: String(raw.lessons ?? ""),
    resources: String(raw.resources ?? ""),
    language: String(raw.language ?? "Hindi + English"),
    overview: String(raw.overview ?? ""),
    learn: Array.isArray(raw.learn) ? raw.learn.map(String) : [],
    modules: Array.isArray(raw.modules) ? raw.modules.map(String) : []
  };
}

export async function loadCatalogueCourses(options = {}) {
  const force = Boolean(options.force);
  const now = Date.now();

  if (!force && Array.isArray(cache.data) && now - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }

  if (!firebaseConfigured || !db) {
    const fallback = staticCourses.map(normalizeCourse);
    cache = { data: fallback, fetchedAt: now, promise: null };
    return fallback;
  }

  if (!force && cache.promise) return cache.promise;

  cache.promise = getDocs(collection(db, "courses"))
    .then((snapshot) => {
      const fallback = staticCourses.map(normalizeCourse);
      if (snapshot.empty) return fallback;

      return snapshot.docs
        .map((item) => normalizeCourse({ id: item.id, ...item.data() }))
        .filter((course) => course.id)
        .sort((a, b) => Number(a.number) - Number(b.number));
    })
    .catch(() => staticCourses.map(normalizeCourse))
    .then((items) => {
      cache = { data: items, fetchedAt: Date.now(), promise: null };
      return items;
    })
    .catch((error) => {
      cache.promise = null;
      throw error;
    });

  return cache.promise;
}

export function getCourseFromList(items, id) {
  return items.find((course) => String(course.id) === String(id));
}
