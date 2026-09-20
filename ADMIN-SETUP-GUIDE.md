# Sayeed Courses Hub — Admin Setup

The admin panel uses a Firestore `admins` collection for authorization.
The frontend cannot create or edit admin roles.

## One-time setup

1. Sign in to Sayeed Courses Hub with the Google account you want to use as the administrator.
2. Open `/admin` on the site.
3. The page will show your Google UID when admin access is not enabled.
4. Open Firebase Console → Firestore Database.
5. Create a collection named `admins`.
6. Create a document whose **Document ID is exactly your Google UID**.
7. Add a field such as:
   - Field: `role`
   - Type: `string`
   - Value: `admin`
8. Publish the included `firestore.rules`.
9. Refresh `/admin`.
10. The first authorized admin visit automatically seeds the starter catalogue into `courses` if that collection is empty.

## What the admin can manage

- Course ID and number
- Category
- Course title and artwork title
- Badge and status
- Description and overview
- Featured state
- Telegram study URL
- Optional thumbnail URL
- Instructor, duration, lessons and resources
- Learning points and modules

## Security note

Do not add Firebase Admin SDK service-account JSON, private keys, or other server credentials to this frontend project or GitHub.
