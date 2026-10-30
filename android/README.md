# Chordloom for Android

The Android app packages Chordloom's shared browser music engine in a small native
WebView shell. It runs offline, with no account, Internet permission, or broad
storage permission. No VST3 build is involved.

## Install the APK

Download `Chordloom-Android-debug` from the Android workflow's artifacts and unzip
it. Open the APK on your phone and allow installation from that source when Android
asks. This is a debug-signed test build, not a Play Store release.

Android 8.0 (API 26) or later and an up-to-date Android System WebView are required.
The app includes the same scales, progression editing, harmony, rhythms, factory
sounds, local SF2/SF3 loading, tablature and MIDI export as the standalone app.
Open **Palette & groove** to change generation settings on a phone.

- **Export MIDI**, **Export tab**, and **Save session** open Android's save picker.
- **Load session** and **Load SoundFont** open Android's document picker. If a
  provider hides a SoundFont, choose its all-files view. Files are read locally.
- Save session JSON before closing. There is no automatic session saving, and local
  SoundFonts must be selected again after reopening. Sessions are compatible with
  the browser app.
- Playback stops when the app leaves the foreground, including when a document
  picker opens. Return to Chordloom and press Play to resume from the beginning.
- Android live MIDI, background audio, DAW transport synchronization, and VST hosting
  are not implemented. Exported `.mid` files can be opened or transferred to a DAW.
- **Using Chordloom on Android** contains help and third-party license notices.

Debug certificates can differ between local and CI builds. If Android rejects an
update because the signatures differ, save your session files before uninstalling
the older test build. Production distribution needs a stable private signing key;
no signing key or password belongs in this repository.

## Build from this repository

Install Node.js 18+, JDK 17, and Android SDK platform 35 and build tools 35.0.0.
Set `ANDROID_HOME` to your SDK directory, or create `android/local.properties` with
`sdk.dir=/your/sdk/path`. Then, from the repository root:

```sh
cd android
./gradlew --no-daemon assembleDebug lintDebug
```

On Windows use `gradlew.bat`. The Gradle wrapper pins Gradle 8.9; the project pins
Android Gradle Plugin 8.7.3. First build requires network access for build tools.
Runtime playback, generation, imports, and exports do not require network access.

The output is `android/app/build/outputs/apk/debug/app-debug.apk`.
`preBuild` regenerates browser assets from `app/` through
`android/tools/prepare-assets.cjs`; generated assets and build outputs are ignored.
Edit shared musical features in `app/`; Android-only behavior is in `app/android.js`
and `app/android.css`, and native file access/lifecycle code is in `MainActivity.java`.

## Checks

```sh
node app/test-android.cjs
node android/tools/prepare-assets.cjs
node android/tools/prepare-assets.cjs --check
```

Run all existing `app/test-*.cjs` engine tests as documented in the root README.
The optional `app/test-android-browser.cjs` additionally needs `playwright-core`
and Chromium; `CHORDLOOM_CHROMIUM` can point to an installed executable. It checks
phone layouts, actual export buttons, session round trips, factory/SF3 audio, and
the lifecycle adapter through a simulated native save bridge. This does not replace
Android runtime tests of WebView and the real document picker.

CI lives at `.github/workflows/android.yml`, runs the engine/adapter tests and
Android lint, and uploads a debug-signed APK. It does not publish a Play Store app
or alter the existing native VST3 sources.
