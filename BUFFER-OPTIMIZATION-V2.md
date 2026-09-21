# Buffer Optimization V2

Replace ONLY `server.js` in the existing `sayeed-video-lab` GitHub repository.

This version keeps the existing secure Firebase/enrollment/signed playback flow and adds:
- controlled 2-request Telegram read-ahead
- ordered chunk delivery to the browser
- maximum ~2 MiB of read-ahead per request window
- existing 1 MiB Telegram request size
- streaming-friendly headers and socket tuning

Do NOT change package.json or environment variables for this step.

After deployment, test the same CTET video on mobile. If V2 is not clearly better, we should stop adding relay complexity and evaluate a segmented/HLS or managed video delivery architecture instead.
