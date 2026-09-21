import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { db, firebaseConfigured } from "./firebase";

const COLLECTION = "videoLessons";

function assertConfigured() {
  if (!firebaseConfigured || !db) {
    throw new Error("Firebase is not configured.");
  }
}

function normalizeLesson(raw) {
  return {
    id: String(raw.id ?? ""),
    courseId: String(raw.courseId ?? ""),
    sourceCourse: String(raw.sourceCourse ?? ""),
    module: String(raw.module ?? "01"),
    messageId: Number(raw.messageId ?? 0),
    videoId: String(raw.videoId ?? ""),
    title: String(raw.title ?? "Untitled lesson"),
    order: Number(raw.order ?? 0),
    published: raw.published !== false,
    duration: String(raw.duration ?? ""),
    updatedAt: raw.updatedAt ?? null
  };
}

function lessonDocId(courseId, messageId) {
  return `${String(courseId)}__${String(messageId)}`;
}

export async function getPublishedVideoLessons(courseId) {
  assertConfigured();
  if (!courseId) return [];

  const snapshot = await getDocs(
    query(
      collection(db, COLLECTION),
      where("courseId", "==", String(courseId))
    )
  );

  return snapshot.docs
    .map((item) => normalizeLesson({ id: item.id, ...item.data() }))
    .filter((lesson) => lesson.published && lesson.messageId > 0)
    .sort((a, b) => {
      const moduleCompare = String(a.module).localeCompare(String(b.module), undefined, { numeric: true, sensitivity: "base" });
      if (moduleCompare !== 0) return moduleCompare;
      return Number(a.order) - Number(b.order) || Number(a.messageId) - Number(b.messageId);
    });
}

export async function getVideoLessons(courseId) {
  assertConfigured();
  if (!courseId) return [];

  const snapshot = await getDocs(
    query(collection(db, COLLECTION), where("courseId", "==", String(courseId)))
  );

  return snapshot.docs
    .map((item) => normalizeLesson({ id: item.id, ...item.data() }))
    .sort((a, b) => {
      const moduleCompare = String(a.module).localeCompare(String(b.module), undefined, { numeric: true, sensitivity: "base" });
      if (moduleCompare !== 0) return moduleCompare;
      return Number(a.order) - Number(b.order) || Number(a.messageId) - Number(b.messageId);
    });
}

export async function saveVideoLesson(lesson) {
  assertConfigured();
  if (!lesson?.courseId) throw new Error("Course ID is required.");
  if (!Number.isInteger(Number(lesson.messageId)) || Number(lesson.messageId) <= 0) {
    throw new Error("A valid Telegram message ID is required.");
  }

  const id = lesson.id || lessonDocId(lesson.courseId, lesson.messageId);
  const payload = {
    courseId: String(lesson.courseId),
    sourceCourse: String(lesson.sourceCourse ?? "").trim(),
    module: String(lesson.module ?? "01").trim() || "01",
    messageId: Number(lesson.messageId),
    videoId: String(lesson.videoId ?? "").trim(),
    title: String(lesson.title ?? "Untitled lesson").trim() || "Untitled lesson",
    order: Number(lesson.order ?? 0),
    published: lesson.published !== false,
    duration: String(lesson.duration ?? "").trim(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(db, COLLECTION, String(id)), payload, { merge: true });
  return normalizeLesson({ id, ...payload });
}

export async function removeVideoLesson(lessonId) {
  assertConfigured();
  if (!lessonId) throw new Error("Lesson ID is required.");
  await deleteDoc(doc(db, COLLECTION, String(lessonId)));
}

export async function bulkImportVideoLessons(lessons) {
  assertConfigured();
  if (!Array.isArray(lessons) || lessons.length === 0) return [];

  const batch = writeBatch(db);
  const normalized = [];

  lessons.forEach((lesson) => {
    if (!lesson?.courseId || !Number.isInteger(Number(lesson.messageId)) || Number(lesson.messageId) <= 0) return;
    const id = lessonDocId(lesson.courseId, lesson.messageId);
    const payload = {
      courseId: String(lesson.courseId),
      sourceCourse: String(lesson.sourceCourse ?? "").trim(),
      module: String(lesson.module ?? "01").trim() || "01",
      messageId: Number(lesson.messageId),
      videoId: String(lesson.videoId ?? "").trim(),
      title: String(lesson.title ?? "Untitled lesson").trim() || "Untitled lesson",
      order: Number(lesson.order ?? 0),
      published: lesson.published !== false,
      duration: String(lesson.duration ?? "").trim(),
      updatedAt: new Date().toISOString()
    };
    batch.set(doc(db, COLLECTION, id), payload, { merge: true });
    normalized.push(normalizeLesson({ id, ...payload }));
  });

  if (normalized.length > 0) await batch.commit();
  return normalized;
}
