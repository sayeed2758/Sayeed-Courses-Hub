"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
  Play,
  RefreshCw,
  ShieldCheck,
  WifiOff
} from "lucide-react";
import { useAuth } from "../app/providers";
import { getVideoCourseByKey, loadVideoCourses, requestPlaybackUrl } from "../lib/videoApi";
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
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackReady, setPlaybackReady] = useState(false);
  const [error, setError] = useState("");
  const [expiresIn, setExpiresIn] = useState(null);
  const [resumeProgress, setResumeProgress] = useState(null);
  const [networkOnline, setNetworkOnline] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [recovering, setRecovering] = useState(false);

  const videoRef = useRef(null);
  const lastProgressSaveRef = useRef(0);
  const requestIdRef = useRef(0);
  const retryCountRef = useRef(0);
  const bufferTimerRef = useRef(null);
  const resumeAfterReloadRef = useRef(null);

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
      // Progress saving stays non-blocking for playback.
    }
  }

  const loadVideos = useCallback(async (force = false) => {
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
            modules: Array.from(moduleMap.entries()).map(([module, moduleVideos]) => ({
              module,
              videos: moduleVideos
            }))
          }]
        });
        const firstVideo = curatedLessons[0];
        if (firstVideo) setSelectedMessageId((current) => current || firstVideo.messageId);
      } else {
        const payload = await loadVideoCourses({ force });
        setCatalogue(payload);
        const firstVideo = getVideoCourseByKey(payload, course.videoCourseKey)?.modules?.[0]?.videos?.[0];
        if (firstVideo) setSelectedMessageId((current) => current || firstVideo.messageId);
      }
    } catch (err) {
      setError(err?.message || "Video library could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [course?.id, course?.category, course?.videoCourseKey, course?.videoEnabled, user]);

  const startPlayback = useCallback(async (video = selectedVideo, options = {}) => {
    if (!video || !user) return;

    const { resumePosition = null, silent = false } = options;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const currentPosition = Number(videoRef.current?.currentTime || 0);
    const fallbackPosition = Number.isFinite(resumePosition)
      ? resumePosition
      : currentPosition > 0
        ? currentPosition
        : Number(resumeProgress?.position || 0);

    resumeAfterReloadRef.current = fallbackPosition > 0 ? fallbackPosition : null;
    setPlaybackReady(false);
    setPlaybackLoading(true);
    setRecovering(Boolean(silent));
    setError("");
    setBuffering(false);

    try {
      const payload = await requestPlaybackUrl({
        user,
        courseId: course.id,
        messageId: video.messageId
      });

      if (requestId !== requestIdRef.current) return;

      setPlaybackUrl(payload.playbackUrl);
      setExpiresIn(payload.expiresIn || null);
      setPlaybackLoading(false);
      setRecovering(false);
      retryCountRef.current = 0;
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setPlaybackLoading(false);
      setRecovering(false);
      setError(err?.message || "Secure playback could not start.");
    }
  }, [course.id, resumeProgress?.position, selectedVideo, user]);

  const recoverPlayback = useCallback(async () => {
    if (!selectedVideo || !user || !networkOnline || playbackLoading) return;
    const currentPosition = Number(videoRef.current?.currentTime || resumeProgress?.position || 0);
    setRecovering(true);
    await startPlayback(selectedVideo, { resumePosition: currentPosition, silent: true });
  }, [networkOnline, playbackLoading, resumeProgress?.position, selectedVideo, startPlayback, user]);

  useEffect(() => {
    const updateNetwork = () => setNetworkOnline(navigator.onLine !== false);
    updateNetwork();
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);
    return () => {
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
    };
  }, []);

  useEffect(() => {
    setCatalogue(null);
    setSelectedMessageId(null);
    setPlaybackUrl("");
    setPlaybackReady(false);
    setPlaybackLoading(false);
    setError("");
    setResumeProgress(null);
    retryCountRef.current = 0;
    requestIdRef.current += 1;
    loadVideos();
    // course identity is the intended reset boundary.
  }, [course?.id, user?.uid, loadVideos]);

  useEffect(() => {
    loadSelectedProgress(selectedVideo);
    setResumeProgress((current) => current || null);
    setPlaybackUrl("");
    setPlaybackReady(false);
    setPlaybackLoading(false);
    setError("");
    lastProgressSaveRef.current = 0;
    resumeAfterReloadRef.current = null;
  }, [selectedVideo?.messageId, user?.uid, course?.id]);

  useEffect(() => {
    return () => {
      if (bufferTimerRef.current) window.clearTimeout(bufferTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedVideo && !playbackUrl && networkOnline && !playbackLoading) {
      // Prepare a short-lived playback URL in the background. The browser still
      // requires the student to press PLAY, but metadata can be fetched earlier.
      const timer = window.setTimeout(() => {
        void startPlayback(selectedVideo, { silent: true });
      }, 250);
      return () => window.clearTimeout(timer);
    }
  }, [networkOnline, playbackLoading, playbackUrl, selectedVideo, startPlayback]);

  useEffect(() => {
    if (!networkOnline && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [networkOnline]);

  useEffect(() => {
    if (!networkOnline || !playbackUrl || !selectedVideo) return;
    const timer = window.setTimeout(() => {
      if (videoRef.current?.error) void recoverPlayback();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [networkOnline, playbackUrl, recoverPlayback, selectedVideo]);

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

  const retryPlayback = () => {
    const position = Number(videoRef.current?.currentTime || resumeProgress?.position || 0);
    void startPlayback(selectedVideo, { resumePosition: position });
  };

  return (
    <section className="video-learning-panel">
      <div className="video-panel-heading">
        <div>
          <span className="section-kicker">VIDEO LESSONS</span>
          <h2>Learn inside the hub.</h2>
        </div>
        <div className="video-security-badge"><ShieldCheck size={15} /> SECURE</div>
      </div>

      {!networkOnline && (
        <div className="video-network-banner offline">
          <WifiOff size={16} /> Internet connection lost. Playback will resume when you are back online.
        </div>
      )}
      {networkOnline && buffering && (
        <div className="video-network-banner buffering">
          <LoaderCircle size={15} className="video-spin" /> Video is buffering… please wait.
        </div>
      )}
      {networkOnline && recovering && (
        <div className="video-network-banner recovering">
          <RefreshCw size={15} className="video-spin" /> Reconnecting secure playback…
        </div>
      )}

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
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                src={playbackUrl}
                onLoadStart={() => setPlaybackReady(false)}
                onLoadedMetadata={(event) => {
                  const pending = resumeAfterReloadRef.current;
                  const saved = Number(pending || resumeProgress?.position || 0);
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
                onCanPlay={() => {
                  setPlaybackReady(true);
                  setPlaybackLoading(false);
                  setBuffering(false);
                  setRecovering(false);
                  resumeAfterReloadRef.current = null;
                }}
                onWaiting={() => {
                  setBuffering(true);
                  if (bufferTimerRef.current) window.clearTimeout(bufferTimerRef.current);
                  bufferTimerRef.current = window.setTimeout(() => {
                    if (!networkOnline) return;
                    const media = videoRef.current;
                    if (media && media.readyState <= 2 && !media.paused) {
                      void recoverPlayback();
                    }
                  }, 8000);
                }}
                onPlaying={() => {
                  setBuffering(false);
                  if (bufferTimerRef.current) window.clearTimeout(bufferTimerRef.current);
                }}
                onStalled={() => setBuffering(true)}
                onTimeUpdate={() => { void persistVideoProgress(false); }}
                onPause={() => { void persistVideoProgress(true); }}
                onEnded={() => { void persistVideoProgress(true, true); }}
                onContextMenu={(event) => event.preventDefault()}
                onError={() => {
                  setPlaybackReady(false);
                  setBuffering(false);
                  if (!networkOnline) {
                    setError("Internet connection is offline. Playback will retry automatically when you reconnect.");
                    return;
                  }
                  if (retryCountRef.current < 1) {
                    retryCountRef.current += 1;
                    setError("Playback is reconnecting. Please wait a moment.");
                    window.setTimeout(() => {
                      const position = Number(videoRef.current?.currentTime || resumeProgress?.position || 0);
                      void startPlayback(selectedVideo, { resumePosition: position, silent: true });
                    }, 1200);
                  } else {
                    setError("Playback could not recover automatically. Tap Refresh Playback to try again.");
                  }
                }}
              />
            ) : (
              <div className="video-placeholder">
                <div className="video-play-circle"><Play size={28} fill="currentColor" /></div>
                <strong>{selectedVideo?.title || "Select a lesson"}</strong>
                <span>{selectedVideo?.module || "Course video"}</span>
                <button type="button" onClick={() => void startPlayback(selectedVideo)} disabled={!selectedVideo || playbackLoading || !networkOnline}>
                  {playbackLoading ? "PREPARING VIDEO…" : "WATCH LESSON"} {!playbackLoading && <Play size={16} fill="currentColor" />}
                </button>
              </div>
            )}
            {playbackUrl && !playbackReady && (
              <div className="video-preparing-overlay">
                <LoaderCircle size={19} className="video-spin" />
                <strong>Preparing secure playback…</strong>
                <span>Large videos may take a little longer to become ready.</span>
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
              <button type="button" onClick={retryPlayback} disabled={playbackLoading || !networkOnline}>
                <RefreshCw size={15} /> {playbackLoading ? "Refreshing…" : "Refresh Playback"}
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
                        const saved = Number(videoRef.current?.currentTime || 0);
                        if (videoRef.current && saved > 0) {
                          resumeAfterReloadRef.current = null;
                        }
                        if (active) return;
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
