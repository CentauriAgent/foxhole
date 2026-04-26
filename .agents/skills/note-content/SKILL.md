---
name: note-content
description: Render plaintext Nostr note content (kind 1, 11, 1111) with linkified URLs, hashtags, and Nostr mentions (npub/nprofile/note/nevent). Turns raw event.content into React nodes with clickable links and @-mentions resolved via useAuthor.
---

# Rich Text Rendering for Nostr Notes

This skill provides the `NoteContent` component, which turns a Nostr event's plaintext `content` field into React nodes with:

- URLs rendered as external `<a target="_blank">` links
- Hashtags rendered as internal links to `/t/<tag>`
- Nostr URIs (`nostr:npub1...`, `nostr:nprofile1...`, `nostr:note1...`, `nostr:nevent1...`) rendered as internal links; `npub`/`nprofile` become `@displayname` mentions resolved via `useAuthor`

Use it whenever you display kind 1 (short text notes), kind 11 (threads), kind 1111 (comments), or any other event with a freeform plaintext `content` field.

**This component is not included in the project by default.** When the user's app displays text notes or other plaintext event content, follow the setup instructions below to install it.

## Files Provided by This Skill

| Skill file | Copy to |
|---|---|
| `files/components/NoteContent.tsx` | `src/components/NoteContent.tsx` |
| `files/components/NoteContent.test.tsx` | `src/components/NoteContent.test.tsx` |

## Setup Instructions

### 1. Dependencies

No extra npm packages are required. The component uses packages already present in the template:

- `react`, `react-router-dom` (for internal `Link` navigation)
- `nostr-tools` (`nip19` for decoding `npub`/`nprofile` references)
- `@nostrify/nostrify` (`NostrEvent` type)

### 2. Copy the Skill Files Into `src/`

Copy both files from `.agents/skills/note-content/files/components/` into `src/components/`. The component imports:

- `@/hooks/useAuthor` — resolves mention display names from pubkeys
- `@/lib/genUserName` — fallback deterministic name when a mentioned user has no profile metadata
- `@/lib/utils` — `cn()` class-merge helper

All three are standard in the template; no extra work is needed beyond copying the files.

### 3. Routing Expectations

The component generates links that assume the host app has these routes wired up in `AppRouter.tsx`:

| Generated link | Route expected |
|---|---|
| `/<nip19-identifier>` (e.g. `/npub1...`, `/note1...`, `/nevent1...`) | Handled by the template's NIP-19 page at `/:nip19` |
| `/t/<hashtag>` | **Not in the default template.** If you want hashtag pages to work, add a route like `<Route path="/t/:hashtag" element={<HashtagPage />} />` in `AppRouter.tsx`. If you don't add one, hashtag links will fall through to the 404 page. |

## Usage

```tsx
import { NoteContent } from '@/components/NoteContent';
import type { NostrEvent } from '@nostrify/nostrify';

function Post({ event }: { event: NostrEvent }) {
  return (
    <article>
      {/* ...header, avatar, etc */}
      <NoteContent event={event} className="text-sm" />
    </article>
  );
}
```

For events that may span multiple lines (any short text note), wrap with whitespace-preserving styles. `NoteContent` already applies `whitespace-pre-wrap break-words` internally, but you can pass additional classes via `className`.

## Supported Content Patterns

| Pattern in `event.content` | Rendered as |
|---|---|
| `https://example.com/...` | `<a href target="_blank" rel="noopener noreferrer">` (blue link) |
| `nostr:npub1abc...` | `@DisplayName` link to `/npub1abc...` — blue if profile has a real name, gray if using generated fallback |
| `nostr:nprofile1...` | Same as `npub` — decoded to pubkey then resolved via `useAuthor` |
| `nostr:note1...` | Link to `/note1...` displaying the full `nostr:note1...` string |
| `nostr:nevent1...` | Link to `/nevent1...` displaying the full `nostr:nevent1...` string |
| `#hashtag` | Internal link to `/t/hashtag` |
| Plain text | Rendered as-is, preserving whitespace |

## Tests

`NoteContent.test.tsx` covers the core cases (URLs, hashtags, mentions with generated vs real names, plain text). It uses the project's `TestApp` wrapper. Run via the normal test script after copying the files.

## Related

- **`useAuthor`** — used internally for mention resolution; keep the default template implementation
- **`genUserName`** — used to generate deterministic fallback handles for users without `kind 0` metadata
- **`NIP19Page`** — the template's `/:nip19` route that handles links `NoteContent` generates for `npub1`/`note1`/`nevent1`/`nprofile1`

## Customization Notes

- **Image/video embeds:** `NoteContent` intentionally only *linkifies* URLs — it doesn't embed images or videos inline. If you want inline media, wrap or extend the component to detect media extensions / `imeta` tags and render `<img>`/`<video>` elements.
- **NIP-94 `imeta` tags:** This component doesn't read tags. For rendering attached files from `imeta` tags (e.g. DM kind 15 files), you'd pair this with a separate media renderer.
- **Colors:** The blue link color is hard-coded (`text-blue-500`). Swap to your theme's `text-primary` or similar if you want the links to follow your design system.
