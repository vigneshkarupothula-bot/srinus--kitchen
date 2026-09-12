# Spice Route Kitchen — Android build

This is a ready-to-build Capacitor project for the Spice Route ordering app
(customer + owner/kitchen modes in one app, role picked on the landing screen).

## Important limitation

`src/storage.js` currently saves data to the device's local storage only.
That means orders placed on the customer's phone will **not** appear on a
different phone running the owner view. For real cross-device sync, replace
`src/storage.js` with calls to a real backend (Firebase Firestore is the
fastest path). Every other file only calls `storageGet`/`storageSet`, so
that's the only file you need to change later.

## Prerequisites

- Node.js 18+ and npm
- Android Studio (includes the Android SDK) — https://developer.android.com/studio
- A JDK (Android Studio bundles one)

## Steps

```bash
# 1. Install JS dependencies
npm install

# 2. Add the Android platform (creates an /android folder)
npm run cap:add

# 3. Build the web app and copy it into the Android project
npm run cap:sync

# 4. Open the Android project in Android Studio
npm run cap:open
```

In Android Studio:
- Let Gradle sync finish.
- To test: click Run ▶ with an emulator or a USB-connected phone (with USB
  debugging on) selected.
- To get an installable `.apk`: **Build → Build Bundle(s) / APK(s) → Build
  APK(s)**. The file lands in
  `android/app/build/outputs/apk/debug/app-debug.apk` — copy that to a phone
  to install it (enable "Install unknown apps" for the file source first).
- For a Play Store-ready **signed release APK/AAB**: **Build → Generate
  Signed Bundle / APK**, create a keystore when prompted (keep it and its
  password safe — you need the same one for every future update), then build.

Whenever you change `src/App.jsx`, re-run `npm run cap:sync` before building
again in Android Studio.
