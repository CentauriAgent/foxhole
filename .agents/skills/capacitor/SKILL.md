---
name: capacitor
description: Wrap the mkstack web app as a native iOS and Android application using Capacitor. Provides haptics, native file downloads / share sheet, OS-level secure storage (Keychain / KeyStore), deep-link routing, status-bar theme sync, and safe-area CSS utilities.
---

# Capacitor Native Wrapper

This skill turns the web app into a native iOS and Android binary using
[Capacitor](https://capacitorjs.com/) — no Swift or Kotlin required for the
basics. The React UI runs unchanged inside a native WebView; this skill
provides the cross-platform primitives that let the app feel native:
haptics, OS-level secure storage, a working file download, the share sheet,
deep-link routing, safe-area handling, and automatic status-bar theming.

**This functionality is not included in the project by default.** When the
user wants to ship the app to the App Store or Google Play (or build an
`.apk` / `.ipa`), follow the setup instructions below.

## What This Skill Provides

| Capability | Web behavior | Native behavior |
|---|---|---|
| **Haptics** (`impactLight`, `notificationSuccess`, `selectionChanged`, …) | `navigator.vibrate()` (Android browsers) | Taptic engine / Android haptics |
| **`downloadTextFile(filename, content)`** | `<a download>` click | Writes to app Documents directory |
| **`openUrl(url)`** | `window.open(url, '_blank')` | Presents the native share sheet |
| **`secureStorage` / `useSecureLocalStorage`** | `localStorage` | iOS Keychain / Android KeyStore, auto-migrates existing plaintext values |
| **`<DeepLinkHandler />`** | no-op | Forwards OS `appUrlOpen` events into React Router |
| **`bootstrapNative()`** | no-op | Hides iOS keyboard accessory bar; syncs system-bar icon style with theme |
| **Safe-area CSS utilities** | `env(safe-area-inset-*)` fallback | `var(--safe-area-inset-*)` injected by `SystemBars` plugin (Android) + iOS notch support |

Everything is SSR-safe and web-safe — each helper does the right thing on
every platform, so you can import and call them unconditionally from shared
components.

## Files Provided by This Skill

Copy each file from `.agents/skills/capacitor/files/` into its matching
location:

### Source files (copy into `src/`)

| Skill file | Copy to |
|---|---|
| `files/lib/haptics.ts` | `src/lib/haptics.ts` |
| `files/lib/downloadFile.ts` | `src/lib/downloadFile.ts` |
| `files/lib/secureStorage.ts` | `src/lib/secureStorage.ts` |
| `files/lib/nativeBootstrap.ts` | `src/lib/nativeBootstrap.ts` |
| `files/hooks/useSecureLocalStorage.ts` | `src/hooks/useSecureLocalStorage.ts` |
| `files/components/DeepLinkHandler.tsx` | `src/components/DeepLinkHandler.tsx` |

### Project-root files

| Skill file | Copy to |
|---|---|
| `files/capacitor.config.ts` | `capacitor.config.ts` (project root) — edit `appId`, `appName`, `scheme`, background colors |
| `files/scripts/patch-cap-config.mjs` | `scripts/patch-cap-config.mjs` — only needed if you add **local** (non-SPM) native plugin classes; otherwise skip |

### Snippets to merge

| Skill file | What to do |
|---|---|
| `files/safe-area.css` | Paste inside the `@layer utilities { … }` block of `src/index.css` |

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @capacitor/core @capacitor/app @capacitor/filesystem \
  @capacitor/haptics @capacitor/keyboard @capacitor/share \
  capacitor-secure-storage-plugin
npm install -D @capacitor/cli @capacitor/android @capacitor/ios
```

Each package:

- **`@capacitor/core`** (runtime) — `Capacitor.isNativePlatform()`,
  `Capacitor.getPlatform()`, `registerPlugin`, `SystemBars`
- **`@capacitor/cli`** (dev) — the `npx cap` command (`init`, `add`,
  `sync`, `run`)
- **`@capacitor/android`** (dev) — the Android Studio project scaffolding
- **`@capacitor/ios`** (dev) — the Xcode project scaffolding
- **`@capacitor/app`** (runtime) — `appUrlOpen` event for deep links
- **`@capacitor/filesystem`** (runtime) — native file writes (used by
  `downloadTextFile`)
- **`@capacitor/haptics`** (runtime) — taptic engine integration
- **`@capacitor/keyboard`** (runtime) — iOS keyboard accessory-bar control
- **`@capacitor/share`** (runtime) — native share sheet (used by `openUrl`)
- **`capacitor-secure-storage-plugin`** (runtime) — iOS Keychain / Android
  KeyStore wrapper (used by `secureStorage`)

### 2. Copy the Skill Files

Copy every file listed in the tables above from
`.agents/skills/capacitor/files/` into its corresponding location.
Paste the contents of `files/safe-area.css` into the
`@layer utilities { … }` block of `src/index.css`.

### 3. Edit `capacitor.config.ts`

Open the copied `capacitor.config.ts` and fill in your app identity:

```ts
const config: CapacitorConfig = {
  appId: 'com.example.myapp',   // reverse-DNS identifier
  appName: 'MyApp',             // user-visible name
  webDir: 'dist',
  ios: {
    scheme: 'MyApp',             // custom URL scheme (myapp://)
    backgroundColor: '#14161f',
    contentInset: 'never',
  },
  android: {
    backgroundColor: '#14161f',
    allowMixedContent: false,
  },
  // ...
};
```

**Important:** `appId` cannot be changed after the app is published to
either store.

### 4. Update `index.html`

Ensure your viewport meta tag opts into safe-area insets — without
`viewport-fit=cover`, iOS will not expose `env(safe-area-inset-*)`:

```html
<meta name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
```

### 5. Wire `bootstrapNative()` into `src/main.tsx`

Call it **before** `createRoot(...).render(...)` so the system bars are
themed by the time the first React paint lands:

```tsx
// src/main.tsx
import { createRoot } from 'react-dom/client';
import { bootstrapNative } from '@/lib/nativeBootstrap';
import App from './App.tsx';
import './index.css';

bootstrapNative();

createRoot(document.getElementById('root')!).render(<App />);
```

### 6. Wire `<DeepLinkHandler />` into `AppRouter.tsx`

It must live **inside** `<BrowserRouter>` so `useNavigate()` works:

```tsx
// src/AppRouter.tsx
import { BrowserRouter } from 'react-router-dom';
import { DeepLinkHandler } from '@/components/DeepLinkHandler';
import { ScrollToTop } from '@/components/ScrollToTop';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <DeepLinkHandler />
      <ScrollToTop />
      {/* <Routes>…</Routes> */}
    </BrowserRouter>
  );
}
```

### 7. Add the Native Platforms

```bash
npx cap add android
npx cap add ios      # macOS only
```

This creates `android/` and `ios/` directories at the project root. Commit
them — they contain project-specific config (signing keys excluded).

### 8. Build & Sync

```bash
npm run build        # produces dist/
npx cap sync         # copies dist/ into android/ and ios/
```

Add a convenience npm script so you can re-sync with one command:

```jsonc
// package.json
{
  "scripts": {
    "cap:sync": "npx cap sync"
  }
}
```

If you later add **local** (non-SPM) native plugin classes to `android/` or
`ios/`, wire up the patch script:

```jsonc
{
  "scripts": {
    "cap:sync": "npx cap sync && node scripts/patch-cap-config.mjs"
  }
}
```

### 9. Run on a Device or Emulator

```bash
npx cap open android    # opens Android Studio
npx cap open ios        # opens Xcode (macOS only)
```

Then hit **Run** in the IDE. For headless quick-iteration:

```bash
npx cap run android
npx cap run ios
```

## Using the APIs

### Haptics

```tsx
import { impactLight, notificationSuccess } from '@/lib/haptics';

<Button onClick={() => { impactLight(); onLike(); }}>Like</Button>

await submitForm();
notificationSuccess();
```

All haptics are fire-and-forget; calling them on unsupported platforms (or
when permission is denied) is a silent no-op.

### Native File Download / Share

```tsx
import { downloadTextFile, openUrl } from '@/lib/downloadFile';

// Save a text file — Documents on native, `<a download>` on web
await downloadTextFile('export.json', JSON.stringify(data, null, 2));

// Open a URL — new tab on web, share sheet on native
await openUrl('https://example.com/article');
```

### Secure Storage

```tsx
import { secureStorage } from '@/lib/secureStorage';

await secureStorage.setItem('nwc:active', connectionString);
const value = await secureStorage.getItem('nwc:active');
await secureStorage.removeItem('nwc:active');
```

Or the React hook:

```tsx
import { useSecureLocalStorage } from '@/hooks/useSecureLocalStorage';

function WalletSettings() {
  const [conn, setConn, ready] = useSecureLocalStorage<string | null>(
    'nwc:active',
    null,
  );
  if (!ready) return <Spinner />;
  return (
    <Input
      value={conn ?? ''}
      onChange={(e) => setConn(e.target.value || null)}
    />
  );
}
```

The hook has the same signature as `useLocalStorage` but returns a third
`ready` flag because native secure reads are async. While `!ready` you
should render a spinner or skip decisions that depend on the stored value.

### Safe-area CSS

```tsx
{/* sticky top bar that clears the notch */}
<header className="sticky top-0 safe-area-top bg-background">…</header>

{/* bottom nav that clears the home indicator */}
<nav className="fixed bottom-0 safe-area-bottom">…</nav>

{/* toast stack that sits below the status bar */}
<Toaster className="safe-area-inset-top" />
```

## Common Follow-ups

- **Custom native plugins** — If you build a local Swift/Kotlin Capacitor
  plugin that is *not* shipped via Swift Package Manager, add its class
  name to `LOCAL_PLUGINS` in `scripts/patch-cap-config.mjs` so
  `packageClassList` in `capacitor.config.json` is restored after each
  `npx cap sync`.
- **App icons** — Use any standard icon generator; Capacitor looks for
  `android/app/src/main/res/mipmap-*/ic_launcher*.png` and
  `ios/App/App/Assets.xcassets/AppIcon.appiconset/`.
- **Splash screen** — Add `@capacitor/splash-screen` and configure it
  under `plugins.SplashScreen` in `capacitor.config.ts`.
- **Push notifications** — Add `@capacitor/push-notifications` (FCM on
  Android, APNs on iOS). The web side can keep using Web Push.
- **Deep-link verification** — host an
  `apple-app-site-association` file and an `assetlinks.json` file on your
  domain so the OS will open verified `https://` links directly in your
  app without the disambiguation prompt. See the
  [`DeepLinkHandler.tsx`](./files/components/DeepLinkHandler.tsx) header
  comment for the full checklist.
- **Store password manager integration** — for saving / autofilling a
  Nostr `nsec` via iCloud Keychain or AndroidX Credential Manager, add
  `@capgo/capacitor-autofill-save-password` and wrap it in a helper
  analogous to `secureStorage` (see Ditto's `credentialManager.ts` for a
  reference implementation).

## Troubleshooting

- **`env(safe-area-inset-top)` returns `0` on Android** — confirm the
  `SystemBars` plugin is configured with `insetsHandling: 'css'` in
  `capacitor.config.ts` (the skill's template already does this). That
  injects `--safe-area-inset-*` CSS variables and the utilities in
  `safe-area.css` prefer them over `env(…)`.
- **Deep links don't navigate** — make sure `<DeepLinkHandler />` is
  **inside** `<BrowserRouter>`. It uses `useNavigate()` and will throw
  silently if it's mounted outside.
- **`secureStorage` write succeeds but read returns `null`** — the
  `capacitor-secure-storage-plugin` stores values per-bundle-id. Reinstalling
  a debug build can rotate the keychain entitlement and orphan previous
  entries. Clear storage or reinstall clean if this happens in dev.
- **iOS keyboard keeps showing the accessory bar** — `bootstrapNative()`
  hides it, but only if called *before* any `<input>` is focused. Make
  sure it's invoked at the top of `main.tsx`.
- **Status bar icons don't match theme on custom themes** — the
  bootstrap watches `<html class="…">` and `<style id="theme-vars">` by
  default. If your theme mechanism writes CSS variables to a different
  element, edit `isBackgroundDark()` in `nativeBootstrap.ts` accordingly.
