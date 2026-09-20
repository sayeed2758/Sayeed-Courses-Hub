# Sayeed Courses Hub — Reference UI rebuild

This rebuild keeps the existing Firebase + Firestore enrollment architecture but changes the catalogue UI to follow the visual method from the reference screenshots: handwritten-style typography, rounded panels, large search, sort control, category sheet, FAQ sheet, course shelf/cart interaction, and mobile-first course cards.

## Important Firebase fix
The previous `lib/firebase.js` checked environment variables with `process.env[key]`. Next.js does not inline dynamic `process.env` lookups in the client bundle, so the app could incorrectly report **Firebase Setup** even when all six Vercel variables were present.

This version uses explicit `process.env.NEXT_PUBLIC_FIREBASE_*` references and then checks those values.

After uploading to GitHub, create a fresh Vercel deployment after the six Production environment variables are present.

## Course links
Each course has a `telegramUrl` field in `lib/courses.js`. Add each private Telegram learning link there before launch. Empty links intentionally show a safe message instead of opening a broken URL.

## Local commands
```bash
npm install
npm run build
npm run start
```
