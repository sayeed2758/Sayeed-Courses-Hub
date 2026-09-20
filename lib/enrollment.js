import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";
import { assertFirebaseConfigured, db } from "./firebase";

export async function enrollInCourse(userId, courseId) {
  assertFirebaseConfigured();
  if (!userId) throw new Error("You must be signed in.");

  const existing = await getDocs(
    query(
      collection(db, "enrollments"),
      where("userId", "==", userId),
      where("courseId", "==", String(courseId)),
      limit(1)
    )
  );

  if (!existing.empty) {
    return { id: existing.docs[0].id, alreadyEnrolled: true };
  }

  const ref = await addDoc(collection(db, "enrollments"), {
    userId,
    courseId: String(courseId),
    enrolledAt: serverTimestamp()
  });

  return { id: ref.id, alreadyEnrolled: false };
}

export async function getUserEnrollments(userId) {
  assertFirebaseConfigured();
  if (!userId) return [];

  const snapshot = await getDocs(
    query(
      collection(db, "enrollments"),
      where("userId", "==", userId)
    )
  );

  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => {
      const aSeconds = a.enrolledAt?.seconds || 0;
      const bSeconds = b.enrolledAt?.seconds || 0;
      return bSeconds - aSeconds;
    });
}
