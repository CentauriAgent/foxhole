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
| **Safe-area utilities** via `tailwindcss-safe-area` Tailwind plugin | `env(safe-area-inset-*)` | `env(safe-area-inset-*)` + `SystemBars` plugin back-fill on Android |

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

### Optional snippet

| Skill file | What to do |
|---|---|
| `files/safe-area-shim.css` | Copy to `src/safe-area-shim.css` **only if** you need to support older Android WebView (<140). See the file's header comment for details. Most modern deployments can skip it. |

## Setup Instructions

### 1. Install Dependencies

```bash
# Capacitor runtime + plugins
npm install @capacitor/core @capacitor/app @capacitor/filesystem \
  @capacitor/haptics @capacitor/keyboard @capacitor/share \
  capacitor-secure-storage-plugin

# Capacitor toolchain (dev)
npm install -D @capacitor/cli @capacitor/android @capacitor/ios

# Safe-area Tailwind plugin — VERSION DEPENDS ON YOUR TAILWIND MAJOR:
#   Tailwind v3 (this project):  tailwindcss-safe-area@0.8.0   (last v3-compat release)
#   Tailwind v4 (newer stacks):  tailwindcss-safe-area@latest  (>=1.0.0)
npm install -D tailwindcss-safe-area@0.8.0
```

**Why the pinned version for `tailwindcss-safe-area`?** The plugin's API
changed between v0.x and v1.x to match Tailwind's own v3→v4 transition:

| Plugin version | Tailwind version | How to register |
|---|---|---|
| `^0.8.0` | 3.x | Import in `tailwind.config.ts` as a plugin (this project) |
| `>=1.0.0` | 4.x | `@import "tailwindcss-safe-area";` in your main CSS |

mkstack ships Tailwind **3.4.x**, so pin to `0.8.0`. Using `@latest`
on a Tailwind v3 project silently produces no utilities. If you later
upgrade the project to Tailwind v4, bump this dependency at the same
time and switch from the `plugins:` array to a CSS `@import`.

Each runtime package:

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
- **`tailwindcss-safe-area`** (dev) — safe-area utilities
  (`pt-safe`, `pb-safe`, `px-safe`, `top-safe`, `h-dvh-safe`, …)

### 2. Copy the Skill Files

Copy every file listed in the tables above from
`.agents/skills/capacitor/files/` into its corresponding location.

### 3. Register the Tailwind Safe-Area Plugin

Edit `tailwind.config.ts` to import the plugin and append it to the
`plugins` array:

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import safeArea from "tailwindcss-safe-area";   // add this

export default {
  // ...existing config...
  plugins: [tailwindcssAnimate, safeArea],      // append safeArea
} satisfies Config;
```

This unlocks utilities like `pt-safe`, `pb-safe`, `px-safe`, `top-safe`,
`bottom-safe`, `h-dvh-safe`, `min-h-dvh-safe`, plus the `-offset-{n}` /
`-or-{n}` variants (e.g. `pb-safe-offset-4` = safe area + 1rem;
`pb-safe-or-8` = max of safe area and 2rem). See the plugin's
[README](https://github.com/mvllow/tailwindcss-safe-area) for the full
utility list.

### 4. Edit `capacitor.config.ts`

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

### 5. Update `index.html`

Ensure your viewport meta tag opts into safe-area insets — without
`viewport-fit=cover`, iOS will not expose `env(safe-area-inset-*)`:

```html
<meta name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
```

### 6. Wire `bootstrapNative()` into `src/main.tsx`

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

### 7. Wire `<DeepLinkHandler />` into `AppRouter.tsx`

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

### 8. Add the Native Platforms

```bash
npx cap add android
npx cap add ios      # macOS only
```

This creates `android/` and `ios/` directories at the project root. Commit
them — they contain project-specific config (signing keys excluded).

### 9. Build & Sync

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

### 10. Run on a Device or Emulator

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

### Safe-area utilities

Once the Tailwind plugin is registered (setup step 3), a rich set of
`*-safe` utilities becomes available across padding, margin, position,
height, border, and scroll properties:

```tsx
{/* sticky top bar that clears the notch */}
<header className="sticky top-0 pt-safe bg-background">…</header>

{/* bottom nav that clears the home indicator */}
<nav className="fixed inset-x-0 bottom-0 pb-safe">…</nav>

{/* full-height modal that respects both top notch and bottom gesture bar */}
<Dialog className="h-dvh-safe">…</Dialog>

{/* toast stack that sits below the status bar */}
<Toaster className="top-safe" />

{/* "at least 2rem of bottom padding, more if the safe area is bigger" */}
<footer className="pb-safe-or-8">…</footer>

{/* safe area plus an extra 1rem */}
<div className="pt-safe-offset-4">…</div>
```

Common utilities:

| Utility | Meaning |
|---|---|
| `pt-safe`, `pr-safe`, `pb-safe`, `pl-safe` | Padding on one side |
| `px-safe`, `py-safe`, `p-safe` | Padding on multiple sides |
| `mt-safe`, …, `m-safe` | Margin equivalents |
| `top-safe`, `bottom-safe`, `left-safe`, `right-safe` | Absolute / fixed positioning |
| `inset-safe`, `inset-x-safe`, `inset-y-safe` | All-side inset |
| `h-dvh-safe`, `min-h-dvh-safe`, `max-h-dvh-safe` | Dynamic viewport height minus insets |
| `h-screen-safe` | Classic viewport height minus insets |
| `{prop}-safe-offset-{n}` | Safe area + `{n}` (e.g. `pb-safe-offset-4`) |
| `{prop}-safe-or-{n}` | `max(safe-area, {n})` (e.g. `pb-safe-or-8`) |
| `scroll-p-safe`, `scroll-m-safe`, … | Scroll padding / margin |

See the [plugin README](https://github.com/mvllow/tailwindcss-safe-area)
for the full list.

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

- **Safe-area utilities render as `0` on Android devices (`pt-safe` has
  no effect on the top notch)** — Chromium WebView versions before 140
  ([bug 40699457](https://issues.chromium.org/issues/40699457)) report
  `env(safe-area-inset-*)` as `0`. The `SystemBars` plugin with
  `insetsHandling: 'css'` (already set in the skill's
  `capacitor.config.ts`) injects `--safe-area-inset-*` CSS variables
  with the correct values, but the `tailwindcss-safe-area@0.8.0`
  plugin uses `env(…)` directly and can't see them. Two fixes:
  1. **Preferred:** ensure your target Android devices are on WebView
     140+ (released Aug 2025). Any actively-updated Android >=7 should
     be, since WebView auto-updates via Play Services.
  2. **Fallback:** copy `files/safe-area-shim.css` into `src/` and
     `@import` it after `@tailwind utilities;` in `src/index.css` —
     it re-declares the common utilities with
     `var(--safe-area-inset-*, env(…, 0px))` so the SystemBars-injected
     variables take over when `env()` reports 0. See the file's header
     comment for details.
- **`pt-safe` doesn't exist at all** — the Tailwind plugin isn't
  registered. Verify `import safeArea from "tailwindcss-safe-area"` and
  that `safeArea` is listed in the `plugins` array of
  `tailwind.config.ts`. Also verify you installed the **0.8.0** version
  specifically (`npm ls tailwindcss-safe-area`). Version `1.x` is for
  Tailwind v4 and emits no utilities on v3.
- **Safe-area utilities have 0px on iOS Safari/Xcode simulator** —
  missing `viewport-fit=cover` in your `<meta name="viewport">` tag.
  Without it iOS doesn't expose the insets.
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
