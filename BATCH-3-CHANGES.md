# Sayeed Courses Hub — Batch 3

Batch 3 combines the roadmap phases 10, 11 and 12:

## Phase 10 — Course Experience
- Course detail pages now load the current Firestore catalogue after the initial static fallback.
- New or edited courses can open by ID without hard-coding every new course into the route.
- Enrollment state is checked automatically on the course detail page.
- Signed-out users can open the Google account panel directly from the ENROLL action.
- LET'S STUDY uses the per-course Telegram URL when present and gives a clear message when the admin has not connected access yet.
- My Courses now uses the live catalogue and has a refresh action.
- Course thumbnails can be supplied from the catalogue with `thumbnailUrl`.

## Phase 11 — Firebase / Account UX
- Account panel now shows a Google profile photo when available.
- Clear signed-in state and direct My Courses action.
- Better configuration/setup messaging.
- Existing Google persistence and enrollment flow are preserved.

## Phase 12 — Admin Control Center
- New `/admin` page for authenticated catalogue administrators.
- Create, edit, feature, deactivate and delete courses.
- Manage Telegram study URL and optional thumbnail URL.
- Manage course overview, learning points and modules.
- Sync the static starter catalogue to Firestore.
- Firestore rules make public course reads possible while restricting course writes to approved admin UIDs.
- Admin roles are provisioned manually in Firestore; the frontend cannot grant itself admin access.

## Important
Publish the included `firestore.rules` before using the Admin Control Center.
See `ADMIN-SETUP-GUIDE.md` for the one-time admin provisioning steps.
