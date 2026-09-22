"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleAlert, FileVideo, Gauge, RotateCcw, UploadCloud, X } from "lucide-react";
import { useAuth } from "../app/providers";
import { VIDEO_API_URL } from "../lib/videoApi";

const DEFAULT_WORKERS = 3;

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDuration(value) {
  const seconds = Math.max(0, Math.round(Number(value || 0)));
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function readVideoMetadata(file) {
  if (!file?.type?.startsWith("video/")) return { duration: 0, width: 0, height: 0 };
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const result = {
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        width: Number(video.videoWidth || 0),
        height: Number(video.videoHeight || 0)
      };
      URL.revokeObjectURL(url);
      resolve(result);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ duration: 0, width: 0, height: 0 });
    };
    video.src = url;
  });
}

function fileTitle(name) {
  return String(name || "video.mp4").replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Untitled lesson";
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    cache: "no-store"
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || `Upload API returned ${response.status}.`);
  }
  return payload;
}

export default function AdminTelegramUploader({ courses = [] }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState({ duration: 0, width: 0, height: 0 });
  const [courseId, setCourseId] = useState("");
  const [module, setModule] = useState("01");
  const [videoId, setVideoId] = useState("");
  const [title, setTitle] = useState("");
  const [order, setOrder] = useState("");
  const [upload, setUpload] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [speed, setSpeed] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef(null);
  const lastProgressRef = useRef({ time: 0, bytes: 0 });

  const activeCourses = useMemo(
    () => courses.filter((course) => course.status === "active"),
    [courses]
  );

  useEffect(() => {
    if (!courseId && activeCourses[0]?.id) setCourseId(String(activeCourses[0].id));
  }, [activeCourses, courseId]);

  useEffect(() => {
    if (!file) return;
    setTitle((current) => current || fileTitle(file.name));
    readVideoMetadata(file).then(setMeta);
  }, [file]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const selectedCourse = activeCourses.find((course) => String(course.id) === String(courseId));

  function resetForm() {
    setFile(null);
    setMeta({ duration: 0, width: 0, height: 0 });
    setVideoId("");
    setTitle("");
    setOrder("");
    setUpload(null);
    setStatus("");
    setError("");
    setSpeed(0);
  }

  async function getToken() {
    if (!user) throw new Error("Admin sign-in is required.");
    return user.getIdToken();
  }

  async function postChunk(uploadId, partIndex, blob, uploadToken, signal) {
    const query = new URLSearchParams({ uploadId, part: String(partIndex) });
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await requestJson(`${VIDEO_API_URL}/upload/chunk?${query.toString()}`, {
          method: "POST",
          signal,
          headers: {
            "X-Upload-Token": uploadToken,
            "Content-Type": "application/octet-stream"
          },
          body: blob
        });
      } catch (err) {
        lastError = err;
        if (signal.aborted) throw err;
        await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
      }
    }
    throw lastError || new Error(`Part ${partIndex + 1} failed.`);
  }

  async function startUpload() {
    if (!VIDEO_API_URL) {
      setError("Video API is not configured in Vercel.");
      return;
    }
    if (!file) {
      setError("Choose a video file first.");
      return;
    }
    if (!courseId) {
      setError("Choose a course first.");
      return;
    }
    if (!module.trim()) {
      setError("Module is required.");
      return;
    }

    setBusy(true);
    setError("");
    setStatus("Preparing direct Telegram upload…");
    setUpload(null);
    setSpeed(0);

    try {
      const token = await getToken();
      const init = await requestJson(`${VIDEO_API_URL}/upload/init`, {
        method: "POST",
        headers: {
          "X-Upload-Token": uploadToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "video/mp4",
          courseId,
          courseName: selectedCourse?.title || "",
          module: module.trim(),
          videoId: videoId.trim(),
          title: title.trim() || fileTitle(file.name),
          order: Number(order || 0),
          durationSeconds: meta.duration,
          width: meta.width,
          height: meta.height
        })
      });

      const initialUpload = init.upload;
      setUpload({ ...initialUpload, uploadToken: init.uploadToken });
      setStartedAt(Date.now());
      setStatus("Uploading directly to Telegram…");
      lastProgressRef.current = { time: Date.now(), bytes: 0 };

      const uploadId = initialUpload.uploadId;
      const uploadToken = String(init.uploadToken || "");
      if (!uploadToken) throw new Error("Upload session token was not returned by the video API.");
      const chunkSize = Number(init.uploadFile?.partSize || initialUpload.partSize);
      const totalParts = Number(init.uploadFile?.totalParts || initialUpload.totalParts);
      const controller = new AbortController();
      abortRef.current = controller;
      let nextPart = 0;
      let completed = 0;
      let uploadedBytes = 0;
      let hardError = null;

      const setProgress = (partBytes) => {
        uploadedBytes += partBytes;
        completed += 1;
        const now = Date.now();
        const elapsedMs = Math.max(1, now - lastProgressRef.current.time);
        const deltaBytes = uploadedBytes - lastProgressRef.current.bytes;
        if (elapsedMs >= 900) {
          setSpeed((deltaBytes * 1000) / elapsedMs);
          lastProgressRef.current = { time: now, bytes: uploadedBytes };
        }
        setUpload((current) => current ? ({
          ...current,
          completedParts: completed,
          uploadedBytes,
          percent: Math.min(100, (uploadedBytes / file.size) * 100)
        }) : current);
      };

      const worker = async () => {
        while (!controller.signal.aborted) {
          const partIndex = nextPart;
          nextPart += 1;
          if (partIndex >= totalParts) return;

          const start = partIndex * chunkSize;
          const end = Math.min(file.size, start + chunkSize);
          const blob = file.slice(start, end);
          try {
            await postChunk(uploadId, partIndex, blob, uploadToken, controller.signal);
            setProgress(blob.size);
          } catch (err) {
            hardError = err;
            controller.abort();
            return;
          }
        }
      };

      await Promise.all(Array.from({ length: DEFAULT_WORKERS }, () => worker()));
      if (controller.signal.aborted) {
        if (hardError) throw hardError;
        throw new Error("Upload cancelled.");
      }

      setStatus("Finalizing Telegram message…");
      const finalPayload = await requestJson(`${VIDEO_API_URL}/upload/finalize?uploadId=${encodeURIComponent(uploadId)}`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      setUpload(finalPayload.upload);
      setStatus(`Uploaded to Telegram successfully · Message ${finalPayload.telegramMessageId}.`);
      setSpeed(0);
    } catch (err) {
      if (err?.name === "AbortError") {
        setStatus("Upload cancelled.");
      } else {
        setError(err?.message || "Telegram upload failed.");
        setStatus("");
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }

  async function cancelUpload() {
    const current = upload;
    abortRef.current?.abort();
    if (current?.uploadId && VIDEO_API_URL && user) {
      try {
        const token = await getToken();
        await requestJson(`${VIDEO_API_URL}/upload/cancel?uploadId=${encodeURIComponent(current.uploadId)}`, {
          method: "POST",
          headers: { "X-Upload-Token": current.uploadToken || "" }
        });
      } catch {
        // The local UI still stops immediately even when cancellation confirmation fails.
      }
    }
    setStatus("Upload cancelled.");
    setBusy(false);
  }

  const percent = Number(upload?.percent || 0);
  const etaSeconds = busy && speed > 0 && file ? Math.max(0, (file.size - Number(upload?.uploadedBytes || 0)) / speed) : 0;
  const elapsed = startedAt ? Math.max(1, (Date.now() - startedAt) / 1000) : 0;

  return (
    <section className="admin-upload-panel">
      <div className="admin-upload-head">
        <div>
          <span className="admin-section-title">DIRECT TELEGRAM UPLOADER · BATCH 1</span>
          <h2><FileVideo size={21} /> Upload straight to Telegram.</h2>
          <p>Video chunks are forwarded directly to your private Telegram channel. Render does not store the video file.</p>
        </div>
        <span className="admin-upload-chip">NO EXTRA STORAGE</span>
      </div>

      {error && <div className="admin-message error"><CircleAlert size={16} /> {error}</div>}
      {status && <div className={upload?.status === "complete" ? "admin-message success" : "admin-message"}><Check size={16} /> {status}</div>}

      <div className="admin-upload-grid">
        <label>Video file
          <input
            type="file"
            accept="video/*,.mkv,.m4v,.mov,.webm,.avi"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setUpload(null);
              setError("");
              setStatus("");
            }}
            disabled={busy}
          />
        </label>
        <label>Course
          <select value={courseId} onChange={(event) => setCourseId(event.target.value)} disabled={busy}>
            <option value="">Choose course</option>
            {activeCourses.map((course) => <option key={course.id} value={course.id}>#{course.number} — {course.title}</option>)}
          </select>
        </label>
        <label>Module
          <input value={module} onChange={(event) => setModule(event.target.value)} placeholder="01" disabled={busy} />
        </label>
        <label>Lesson title
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Lesson title" disabled={busy} />
        </label>
        <label>Video ID <small>Optional</small>
          <input value={videoId} onChange={(event) => setVideoId(event.target.value)} placeholder="Auto-generated if blank" disabled={busy} />
        </label>
        <label>Order <small>Optional</small>
          <input type="number" min="1" value={order} onChange={(event) => setOrder(event.target.value)} placeholder="Auto" disabled={busy} />
        </label>
      </div>

      {file && (
        <div className="admin-upload-file-card">
          <div className="admin-upload-file-icon"><FileVideo size={22} /></div>
          <div className="admin-upload-file-main">
            <strong>{file.name}</strong>
            <span>{formatBytes(file.size)} · {formatDuration(meta.duration) || "duration reading…"} · {meta.width && meta.height ? `${meta.width}×${meta.height}` : "video"}</span>
          </div>
          {!busy && <button type="button" className="admin-delete" onClick={resetForm} aria-label="Clear selected video"><X size={15} /></button>}
        </div>
      )}

      {upload && (
        <div className="admin-upload-progress-card">
          <div className="admin-upload-progress-top">
            <strong>{percent.toFixed(1)}%</strong>
            <span>{formatBytes(upload.uploadedBytes)} / {formatBytes(upload.fileSize)}</span>
          </div>
          <div className="admin-upload-progress-track"><span style={{ width: `${Math.min(100, percent)}%` }} /></div>
          <div className="admin-upload-progress-meta">
            <span>Part {Math.min(upload.completedParts, upload.totalParts)} / {upload.totalParts}</span>
            <span><Gauge size={13} /> {speed > 0 ? `${formatBytes(speed)}/s` : "calculating…"}</span>
            {etaSeconds > 0 ? <span>ETA {etaSeconds >= 60 ? `${Math.ceil(etaSeconds / 60)} min` : `${Math.ceil(etaSeconds)} sec`}</span> : null}
          </div>
          {upload.telegramMessageId ? <div className="admin-upload-done"><Check size={15} /> Telegram message {upload.telegramMessageId} · course lesson registered</div> : null}
        </div>
      )}

      <div className="admin-upload-actions">
        {!busy ? (
          <button type="button" className="modal-primary" onClick={startUpload} disabled={!file || !courseId}>
            <UploadCloud size={16} /> START TELEGRAM UPLOAD
          </button>
        ) : (
          <button type="button" className="admin-secondary admin-upload-cancel" onClick={cancelUpload}>
            <X size={16} /> CANCEL UPLOAD
          </button>
        )}
        {upload?.status && !busy && upload.status !== "complete" && upload.status !== "uploading" ? (
          <button type="button" className="admin-secondary" onClick={startUpload} disabled={!file || !courseId}>
            <RotateCcw size={16} /> START AGAIN
          </button>
        ) : null}
      </div>

      <div className="admin-upload-note">
        <strong>How it works:</strong> 512 KiB Telegram-sized chunks → direct MTProto upload → Telegram channel message → Firestore video index + published lesson. No R2, Drive or temporary video bucket is used.
      </div>
    </section>
  );
}
