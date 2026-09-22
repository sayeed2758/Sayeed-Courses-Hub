import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where
} from "firebase/firestore";
import { assertFirebaseConfigured, db } from "./firebase";

const COLLECTION = "videoProgress";

function assertProgressInput(userId, courseId, messageId) {
  assertFirebaseConfigured();
  if (!userId) throw new Error("You must be signed in.");
  if (!courseId) throw new Error("Course ID is required.");
  const id = Number(messageId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("A valid video message ID is required.");
  }
}

function progressDocId(userId, courseId, messageId) {
  return `${String(userId)}__${String(courseId)}__${String(messageId)}`;
}

function normalize(row) {
  return {
    id: String(row.id || ""),
    userId: String(row.userId || ""),
    courseId: String(row.courseId || ""),
    messageId: Number(row.messageId || 0),
    position: Math.max(Number(row.position || 0), 0),
    duration: Math.max(Number(row.duration || 0), 0),
    completed: Boolean(row.completed),
    updatedAt: row.updatedAt || null
  };
}

export async function getVideoProgress(userId, courseId, messageId) {
  assertProgressInput(userId, courseId, messageId);
  const id = progressDocId(userId, courseId, messageId);
  const snapshot = await getDoc(doc(db, COLLECTION, id));
  if (!snapshot.exists()) return null;
  return normalize({ id: snapshot.id, ...snapshot.data() });
}


export async function getUserCourseProgress(userId, courseId) {
  assertProgressInput(userId, courseId, 1);
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTION),
      where("userId", "==", String(userId))
    )
  );

  return snapshot.docs
    .map((item) => normalize({ id: item.id, ...item.data() }))
    .filter((row) => row.courseId === String(courseId));
}

export async function saveVideoProgress({
  userId,
  courseId,
  messageId,
  position,
  duration,
  completed = false
}) {
  assertProgressInput(userId, courseId, messageId);

  const numericPosition = Math.max(Number(position || 0), 0);
  const numericDuration = Math.max(Number(duration || 0), 0);
  const id = progressDocId(userId, courseId, messageId);

  const payload = {
    userId: String(userId),
    courseId: String(courseId),
    messageId: Number(messageId),
    position: numericPosition,
    duration: numericDuration,
    completed: Boolean(completed),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, COLLECTION, id), payload, { merge: true });
  return { id, ...payload };
}
