# Sayeed Courses Hub — Video Merge Phase 2 / Step 1

This step adds only the connection foundation for the already-tested Telegram → Render video backend.

## What changed

- Added `lib/videoApi.js` for the main website to call the Render `/courses` endpoint and build `/video?messageId=...` playback URLs.
- Extended course normalization with `videoCourseKey` and `videoEnabled`.
- The CTET static course is mapped to `videoCourseKey: "CTET"` and enabled for the first integration pilot.
- Added `.env.example` with the public Video Lab endpoint variable.
- No Firebase rules, authentication, enrollment, course cards, or player UI were changed in this step.

## Vercel variable

Add this Environment Variable to the Sayeed Courses Hub project:

`NEXT_PUBLIC_VIDEO_API_URL=https://sayeed-video-lab.onrender.com`

Use Production (and Preview only if you want to test Preview deployments).

## Important

The current Render `/video` endpoint is intentionally unchanged from the tested POC. It is not yet protected by Firebase enrollment authentication. Do not treat the new playback URL as production-secure until the next backend security step is completed.
