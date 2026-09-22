const rawVideoApiUrl = process.env.NEXT_PUBLIC_VIDEO_API_URL || "";

export const VIDEO_API_URL = rawVideoApiUrl.replace(/\/+$/, "");

let videoCourseCache = {
  data: null,
  fetchedAt: 0,
  promise: null
};

const CACHE_TTL = 30_000;
const REQUEST_TIMEOUT_MS = 20_000;

export function isVideoApiConfigured() {
  return Boolean(VIDEO_API_URL);
}

function withTimeout(signal, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) controller.abort();
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return {
    signal: controller.signal,
    cleanup: () => window.clearTimeout(timer)
  };
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestJson(url, options = {}) {
  const timeout = withTimeout(options.signal);
  try {
    const response = await fetch(url, {
      ...options,
      signal: timeout.signal
    });
    const payload = await readJson(response);

    if (!response.ok) {
      const error = new Error(
        payload?.error || `Video API request failed with status ${response.status}.`
      );
      error.status = response.status;
      throw error;
    }

    if (!payload?.success) {
      const error = new Error(payload?.error || "Video API returned an unsuccessful response.");
      error.status = response.status;
      throw error;
    }

    return payload;
  } finally {
    timeout.cleanup();
  }
}

export function getVideoStreamUrl(messageId) {
  if (!VIDEO_API_URL) return "";

  const id = Number(messageId);
  if (!Number.isInteger(id) || id <= 0) return "";

  return `${VIDEO_API_URL}/video?messageId=${encodeURIComponent(id)}`;
}

export async function loadVideoCourses(options = {}) {
  const force = Boolean(options.force);
  const now = Date.now();

  if (!VIDEO_API_URL) {
    return {
      success: false,
      courseCount: 0,
      videoCount: 0,
      courses: [],
      error: "Video API is not configured yet."
    };
  }

  if (
    !force &&
    videoCourseCache.data &&
    now - videoCourseCache.fetchedAt < CACHE_TTL
  ) {
    return videoCourseCache.data;
  }

  if (!force && videoCourseCache.promise) {
    return videoCourseCache.promise;
  }

  videoCourseCache.promise = requestJson(`${VIDEO_API_URL}/courses`, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" }
  })
    .then((payload) => {
      videoCourseCache = {
        data: payload,
        fetchedAt: Date.now(),
        promise: null
      };
      return payload;
    })
    .catch((error) => {
      videoCourseCache.promise = null;
      throw error;
    });

  return videoCourseCache.promise;
}

export function getVideoCourseByKey(payload, courseKey) {
  const key = String(courseKey || "").trim().toLowerCase();
  if (!key || !payload?.courses) return null;

  return (
    payload.courses.find(
      (course) =>
        String(course.course || "").trim().toLowerCase() === key
    ) || null
  );
}

export async function checkVideoAccess(courseId, idToken) {
  if (!VIDEO_API_URL) {
    throw new Error("Video API is not configured yet.");
  }

  const normalizedCourseId = String(courseId || "").trim();
  const token = String(idToken || "").trim();

  if (!normalizedCourseId) {
    throw new Error("Course ID is missing.");
  }

  if (!token) {
    throw new Error("Firebase authentication token is missing.");
  }

  return requestJson(
    `${VIDEO_API_URL}/access?courseId=${encodeURIComponent(normalizedCourseId)}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    }
  );
}

export async function requestPlaybackUrl({ user, courseId, messageId }) {
  if (!VIDEO_API_URL) {
    throw new Error("Video API is not configured yet.");
  }

  if (!user) {
    throw new Error("Please sign in before starting playback.");
  }

  const normalizedCourseId = String(courseId || "").trim();
  const numericMessageId = Number(messageId);
  if (!normalizedCourseId) throw new Error("Course ID is missing.");
  if (!Number.isInteger(numericMessageId) || numericMessageId <= 0) {
    throw new Error("A valid video message ID is required.");
  }

  const idToken = await user.getIdToken();
  return requestJson(
    `${VIDEO_API_URL}/playback?courseId=${encodeURIComponent(normalizedCourseId)}&messageId=${encodeURIComponent(numericMessageId)}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${idToken}`
      }
    }
  );
}
