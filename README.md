# Sayeed Courses Hub — Phase 5

Firebase setup-readiness phase.

## Phase 5 includes
- Everything from Phase 4
- More reliable Next.js dynamic course-page architecture
- Graceful behavior when Firebase environment variables are missing
- Firebase setup status in the account panel
- `/setup` visual Firebase onboarding checklist
- Cleaner deployment configuration guidance
- Shared Firestore security rules
- Google Authentication foundation retained
- Real enrollment foundation retained

## Firebase setup order
1. Create a Firebase project.
2. Register a Web App.
3. Enable Google Authentication.
4. Create Cloud Firestore.
5. Copy the Web App config into Vercel Environment Variables.
6. Add your Vercel domain to Firebase Authentication → Authorized domains.
7. Publish `firestore.rules`.
8. Redeploy.

## Environment variable names
See `.env.example`.

## Security
Never put Firebase Admin SDK private keys or service-account JSON into the frontend project or GitHub.

## Local development
```bash
npm install
npm run dev
```
