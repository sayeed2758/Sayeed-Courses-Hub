const rawVideoApiUrl = process.env.NEXT_PUBLIC_VIDEO_API_URL || "";

export const VIDEO_API_URL = rawVideoApiUrl.replace(/\/+$/, "");

let videoCourseCache = {
  data: null,
  fetchedAt: 0,
  promise: null
};

const CACHE_TTL = 30_000;

export function isVideoApiConfigured() {
  return Boolean(VIDEO_API_URL);
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

  videoCourseCache.promise = fetch(`${VIDEO_API_URL}/courses`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  })
    .then(async (response) => {
      let payload = null;

      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            `Video API request failed with status ${response.status}.`
        );
      }

      if (!payload?.success) {
        throw new Error(
          payload?.error || "Video API returned an unsuccessful response."
        );
      }

      return payload;
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

  const response = await fetch(
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

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    const error = new Error(
      payload?.error ||
        `Video access check failed with status ${response.status}.`
    );
    error.status = response.status;
    throw error;
  }

  return payload;
}
