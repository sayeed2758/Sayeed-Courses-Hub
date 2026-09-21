"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, LockKeyhole, Play, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "../app/providers";
import { getVideoCourseByKey, loadVideoCourses, VIDEO_API_URL } from "../lib/videoApi";
import { getPublishedVideoLessons } from "../lib/videoLessons";
import { getVideoProgress, saveVideoProgress } from "../lib/videoProgress";

function formatTime(seconds) {
  const total = Math.max(Math.floor(Number(seconds || 0)), 0);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export default function VideoPlayer({ course }) {
  const { user } = useAuth();
  const [catalogue, setCatalogue] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const [expiresIn, setExpiresIn] = useState(null);
  const [resumeProgress, setResumeProgress] = useState(null);
  const videoRef = useRef(null);
  const lastProgressSaveRef = useRef(0);

  const videoCourse = useMemo(
    () => getVideoCourseByKey(catalogue, course?.videoCourseKey),
    [catalogue, course?.videoCourseKey]
  );

  const videos = useMemo(() => {
    if (!videoCourse?.modules) return [];
    return videoCourse.modules.flatMap((module) =>
      (module.videos || []).map((video) => ({ ...video, module: module.module }))
    );
  }, [videoCourse]);

  const selectedVideo = useMemo(
    () => videos.find((video) => Number(video.messageId) === Number(selectedMessageId)) || videos[0] || null,
    [videos, selectedMessageId]
  );

  async function loadSelectedProgress(video = selectedVideo) {
    if (!user || !video) {
      setResumeProgress(null);
      return;
    }
    try {
      const progress = await getVideoProgress(user.uid, course.id, video.messageId);
      setResumeProgress(progress);
    } catch {
      setResumeProgress(null);
    }
  }

  async function persistVideoProgress(force = false, completed = false) {
    const element = videoRef.current;
    if (!user || !course || !selectedVideo || !element) return;

    const now = Date.now();
    if (!force && now - lastProgressSaveRef.current < 8000) return;
    if (!force && !Number.isFinite(element.currentTime)) return;

    lastProgressSaveRef.current = now;
    try {
      await saveVideoProgress({
        userId: user.uid,
        courseId: course.id,
        messageId: selectedVideo.messageId,
        position: element.currentTime,
        duration: Number.isFinite(element.duration) ? element.duration : 0,
        completed: completed || (
          Number.isFinite(element.duration) &&
          element.duration > 0 &&
          element.currentTime / element.duration >= 0.95
        )
      });
    } catch {
      // Progress save is intentionally non-blocking for playback.
    }
  }

  async function loadVideos(force = false) {
    if (!course?.videoEnabled || !course?.videoCourseKey) {
      setLoading(false);
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Phase 3: prefer the admin-curated Firestore library. This avoids a
      // Telegram scan for every student page and lets the admin publish,
      // rename, reorder and unpublish lessons without editing code.
      const curatedLessons = await getPublishedVideoLessons(course.id);
      if (curatedLessons.length > 0) {
        const moduleMap = new Map();
        curatedLessons.forEach((lesson) => {
          if (!moduleMap.has(lesson.module)) moduleMap.set(lesson.module, []);
          moduleMap.get(lesson.module).push({
            messageId: lesson.messageId,
            videoId: lesson.videoId,
            title: lesson.title
          });
        });
        setCatalogue({
          success: true,
          courses: [{
            course: course.videoCourseKey || course.category,
            modules: Array.from(moduleMap.entries()).map(([module, videos]) => ({ module, videos }))
          }]
        });
        const firstVideo = curatedLessons[0];
        if (firstVideo && !selectedMessageId) setSelectedMessageId(firstVideo.messageId);
      } else {
        const payload = await loadVideoCourses({ force });
        setCatalogue(payload);
        const firstVideo = getVideoCourseByKey(payload, course.videoCourseKey)?.modules?.[0]?.videos?.[0];
        if (firstVideo && !selectedMessageId) setSelectedMessageId(firstVideo.messageId);
      }
    } catch (err) {
      setError(err?.message || "Video library could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function startPlayback(video = selectedVideo) {
    if (!video || !user || !VIDEO_API_URL) return;

    setPlaying(false);
    setPlaybackUrl("");
    setError("");

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(
        `${VIDEO_API_URL}/playback?courseId=${encodeURIComponent(course.id)}&messageId=${encodeURIComponent(video.messageId)}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${idToken}`
          }
        }
      );

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok || !payload?.success || !payload?.playbackUrl) {
        throw new Error(payload?.error || `Playback request failed (${response.status}).`);
      }

      setPlaybackUrl(payload.playbackUrl);
      setExpiresIn(payload.expiresIn || null);
      setPlaying(true);
    } catch (err) {
      setError(err?.message || "Secure playback could not start.");
    }
  }

  useEffect(() => {
    setCatalogue(null);
    setSelectedMessageId(null);
    setPlaybackUrl("");
    setPlaying(false);
    setError("");
    setResumeProgress(null);
    loadVideos();
    // course identity is the intended reset boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id, user?.uid]);

  useEffect(() => {
    loadSelectedProgress(selectedVideo);
    setResumeProgress((current) => current || null);
    setPlaybackUrl("");
    setPlaying(false);
    lastProgressSaveRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideo?.messageId, user?.uid, course?.id]);

  useEffect(() => {
    if (selectedVideo && playing && Number(selectedVideo.messageId) !== Number(selectedMessageId)) {
      startPlayback(selectedVideo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMessageId]);

  if (!course?.videoEnabled) return null;

  if (!user) {
    return (
      <section className="video-learning-panel video-locked-panel">
        <div className="video-panel-heading">
          <div>
            <span className="section-kicker">VIDEO LESSONS</span>
            <h2>Secure course player</h2>
          </div>
          <LockKeyhole size={22} />
        </div>
        <div className="video-locked-message">
          <LockKeyhole size={26} />
          <strong>Sign in to access course videos.</strong>
          <span>Your account is verified before a private playback link is created.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="video-learning-panel">
      <div className="video-panel-heading">
        <div>
          <span className="section-kicker">VIDEO LESSONS</span>
          <h2>Learn inside the hub.</h2>
        </div>
        <div className="video-security-badge"><ShieldCheck size={15} /> SECURE</div>
      </div>

      {loading ? (
        <div className="video-loading-state"><LoaderCircle className="video-spin" size={25} /><span>Loading video library...</span></div>
      ) : error && !videoCourse ? (
        <div className="video-error-state"><AlertCircle size={22} /><span>{error}</span><button type="button" onClick={() => loadVideos(true)}><RefreshCw size={15} /> Retry</button></div>
      ) : !videoCourse || videos.length === 0 ? (
        <div className="video-empty-state"><Play size={23} /><strong>Videos are being prepared.</strong><span>No published video was found for this course yet.</span></div>
      ) : (
        <>
          <div className="secure-video-frame">
            {playbackUrl ? (
              <video
                ref={videoRef}
                className="secure-video"
                controls
                playsInline
                preload="metadata"
                controlsList="nodownload"
                disablePictureInPicture
                src={playbackUrl}
                onLoadedMetadata={(event) => {
                  const saved = Number(resumeProgress?.position || 0);
                  const duration = event.currentTarget.duration;
                  if (
                    saved > 5 &&
                    Number.isFinite(duration) &&
                    duration > 0 &&
                    saved < Math.max(duration - 5, 0)
                  ) {
                    event.currentTarget.currentTime = saved;
                  }
                }}
                onTimeUpdate={() => { void persistVideoProgress(false); }}
                onPause={() => { void persistVideoProgress(true); }}
                onEnded={() => { void persistVideoProgress(true, true); }}
                onContextMenu={(event) => event.preventDefault()}
                onError={() => setError("Playback expired or the video could not be loaded. Tap Refresh Playback to continue.")}
              />
            ) : (
              <div className="video-placeholder">
                <div className="video-play-circle"><Play size={28} fill="currentColor" /></div>
                <strong>{selectedVideo?.title || "Select a lesson"}</strong>
                <span>{selectedVideo?.module || "Course video"}</span>
                <button type="button" onClick={() => startPlayback(selectedVideo)} disabled={!selectedVideo}>
                  WATCH LESSON <Play size={16} fill="currentColor" />
                </button>
              </div>
            )}
          </div>

          <div className="video-start-info" role="note">
            <span className="video-start-info-icon">ℹ</span>
            <span>Video start hone mein thoda time lag sakta hai, especially large video files ke liye. Please wait while the video starts.</span>
          </div>

          <div className="video-now-playing">
            <div>
              <span>{selectedVideo?.module || "Lesson"}</span>
              <strong>{selectedVideo?.title || "Select a lesson"}</strong>
            </div>
            {playbackUrl && (
              <button type="button" onClick={() => startPlayback(selectedVideo)}>
                <RefreshCw size={15} /> Refresh Playback
              </button>
            )}
          </div>

          {expiresIn && <div className="video-expiry-note"><CheckCircle2 size={14} /> Secure playback access is temporary ({Math.round(expiresIn / 60)} min).</div>}
          {resumeProgress?.completed ? (
            <div className="video-progress-note success"><CheckCircle2 size={14} /> Lesson completed. You can replay it anytime.</div>
          ) : resumeProgress?.position > 5 ? (
            <div className="video-progress-note"><RefreshCw size={14} /> Resume available from {formatTime(resumeProgress.position)}.</div>
          ) : null}
          {error && <div className="video-inline-error"><AlertCircle size={16} /> {error}</div>}

          <div className="video-library-list">
            <div className="video-library-title">LESSONS <span>{videos.length} VIDEOS</span></div>
            {videoCourse.modules.map((module) => (
              <div className="video-module-group" key={module.module}>
                <div className="video-module-name">{module.module}</div>
                {(module.videos || []).map((video, index) => {
                  const active = Number(video.messageId) === Number(selectedMessageId);
                  return (
                    <button
                      type="button"
                      className={`video-lesson-row ${active ? "active" : ""}`}
                      key={video.messageId}
                      onClick={() => {
                        setSelectedMessageId(video.messageId);
                        if (playing) startPlayback(video);
                      }}
                    >
                      <span className="video-lesson-number">{String(index + 1).padStart(2, "0")}</span>
                      <span className="video-lesson-copy"><strong>{video.title}</strong><small>{video.videoId || `Video ${index + 1}`}</small></span>
                      <Play size={16} />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
