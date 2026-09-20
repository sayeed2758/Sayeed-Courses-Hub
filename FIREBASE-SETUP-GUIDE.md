# Firebase Setup — Sayeed Courses Hub

1. Create the Firebase project.
2. Register a Firebase Web App.
3. Enable Google sign-in.
4. Create Cloud Firestore.
5. Add the exact six environment variables below to Vercel Production:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

6. Add your production Vercel domain in Firebase Authentication → Settings → Authorized domains.
7. Publish `firestore.rules`.
8. **Redeploy from the latest GitHub commit after changing environment variables.**

### Why the earlier app said Firebase was not configured
The previous client bundle used a dynamic environment lookup (`process.env[key]`). Next.js only statically inlines public environment variables when they are referenced by their explicit names. The new `lib/firebase.js` uses explicit references, so the browser can see the same values that Vercel injects at build time.

Never put a Firebase Admin SDK private key or service-account JSON into this frontend project or GitHub.
