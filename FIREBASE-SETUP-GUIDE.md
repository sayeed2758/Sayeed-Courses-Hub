# Firebase Setup Guide — Sayeed Courses Hub

This is a phone-friendly checklist.

## 1. Create the project
Open:
https://console.firebase.google.com/

Tap **Create a project** / **Add project**.

Project name suggestion:
Sayeed Courses Hub

Google Analytics can be left off for this first setup if you do not need it.

## 2. Register the web app
Open the project → Project Overview → tap the Web icon `</>`.

App nickname:
Sayeed Courses Hub Web

Register the app.

Firebase will show a configuration object containing:
- apiKey
- authDomain
- projectId
- storageBucket
- messagingSenderId
- appId

Do not share passwords or service-account private keys.

## 3. Enable Google Login
Firebase Console → Build → Authentication.

Open **Sign-in method** → Google → Enable → Save.

Official reference:
https://firebase.google.com/docs/auth/web/google-signin

## 4. Create Firestore
Firebase Console → Build → Firestore Database → Create database.

Choose a location close to your main users when possible and finish the setup.

The project contains `firestore.rules`; use those rules rather than leaving a temporary open/test rule in production.

Official reference:
https://firebase.google.com/docs/firestore/quickstart-server

## 5. Put config into Vercel
In Vercel → Project → Settings → Environment Variables add:

NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

Paste the matching values from the Firebase Web App configuration.

## 6. Authorize your website domain
Firebase Console → Authentication → Settings → Authorized domains.

Add your Vercel domain, for example:
your-project.vercel.app

If you use localhost during development, add localhost only when needed.

## 7. Redeploy
After changing Vercel Environment Variables, redeploy the latest deployment so the new build receives the values.

## 8. Test
Open the website:
- Account → Google sign-in
- Open a course
- Enroll
- Open `/enrolled`
- Confirm the course appears

## Cost note
Firebase has free usage tiers, but limits and billing depend on the Firebase/Google Cloud services and usage. Check the current Firebase pricing before production launch.
