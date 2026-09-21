# Buffer Optimization V1

Replace ONLY `server.js` in the existing `sayeed-video-lab` GitHub repository.

Changes:
- Keeps the tested 1 MiB Telegram relay chunks.
- Adds streaming-friendly proxy buffering header.
- Adds TCP no-delay + keep-alive tuning.
- Adds a short private browser cache for signed playback URLs (120 seconds).
- Adds inline video disposition and MIME safety header.
- Tunes Node server timeouts for long video streams.

Do NOT replace package.json or any other file for this step.
