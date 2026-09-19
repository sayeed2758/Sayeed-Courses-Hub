# Sayeed Courses Hub — Phase 4

Firebase-powered account and enrollment foundation.

## Phase 4 includes
- Firebase client setup through environment variables
- Google authentication
- Account popover
- Real Firestore enrollment records
- Duplicate enrollment protection
- My Enrolled Courses page
- Course detail page enrollment
- Enrollment state feedback
- Firestore security rules
- Mobile responsive account/enrollment UI

## Before deployment
1. Create/configure a Firebase project.
2. Enable Authentication → Google.
3. Create Firestore Database.
4. Add the values from `.env.example` as Vercel Environment Variables.
5. Publish `firestore.rules`.
6. Add your Vercel domain to Firebase Authentication → Authorized domains.

## Important
The Firebase config values are placeholders. Do not paste real credentials into public source files. Use Vercel Environment Variables for the `NEXT_PUBLIC_FIREBASE_*` values.

## Local development
```bash
npm install
npm run dev
```
