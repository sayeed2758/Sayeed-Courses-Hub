import { collection, getDocs } from "firebase/firestore";
import { courses as staticCourses } from "./courses";
import { db, firebaseConfigured } from "./firebase";

function normalizeCourse(raw) {
  return {
    id: String(raw.id ?? ""),
    number: Number(raw.number ?? 0),
    category: String(raw.category ?? "General"),
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

export async function loadCatalogueCourses() {
  const fallback = staticCourses.map(normalizeCourse);
  if (!firebaseConfigured || !db) return fallback;

  try {
    const snapshot = await getDocs(collection(db, "courses"));
    if (snapshot.empty) return fallback;

    return snapshot.docs
      .map((item) => normalizeCourse({ id: item.id, ...item.data() }))
      .filter((course) => course.id)
      .sort((a, b) => Number(a.number) - Number(b.number));
  } catch {
    return fallback;
  }
}

export function getCourseFromList(items, id) {
  return items.find((course) => String(course.id) === String(id));
}
