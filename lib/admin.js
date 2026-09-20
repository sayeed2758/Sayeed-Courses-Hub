import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch
} from "firebase/firestore";
import { db, firebaseConfigured } from "./firebase";

export async function isUserAdmin(uid) {
  if (!firebaseConfigured || !db || !uid) return false;
  try {
    const snapshot = await getDoc(doc(db, "admins", uid));
    return snapshot.exists();
  } catch {
    return false;
  }
}

export async function saveCourse(course) {
  if (!firebaseConfigured || !db) throw new Error("Firebase is not configured.");
  if (!course?.id) throw new Error("Course ID is required.");

  const payload = {
    ...course,
    id: String(course.id),
    number: Number(course.number || 0),
    featured: Boolean(course.featured),
    learn: Array.isArray(course.learn) ? course.learn : [],
    modules: Array.isArray(course.modules) ? course.modules : [],
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(db, "courses", String(course.id)), payload, { merge: true });
  return payload;
}

export async function removeCourse(courseId) {
  if (!firebaseConfigured || !db) throw new Error("Firebase is not configured.");
  if (!courseId) throw new Error("Course ID is required.");
  await deleteDoc(doc(db, "courses", String(courseId)));
}

export async function seedStaticCourses(items) {
  if (!firebaseConfigured || !db) throw new Error("Firebase is not configured.");
  const batch = writeBatch(db);
  items.forEach((course) => {
    batch.set(doc(db, "courses", String(course.id)), {
      ...course,
      id: String(course.id),
      number: Number(course.number || 0),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  });
  await batch.commit();
}

export async function ensureCatalogueSeeded(items) {
  if (!firebaseConfigured || !db) throw new Error("Firebase is not configured.");
  const snapshot = await getDocs(collection(db, "courses"));
  if (snapshot.empty) await seedStaticCourses(items);
}
