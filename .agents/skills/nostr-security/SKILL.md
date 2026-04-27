---
name: nostr-security
description: Threat model and defenses for a web Nostr client — why XSS is catastrophic when nsec keys live in localStorage, how CSP provides defense-in-depth, URL and CSS sanitization for untrusted event data, and author filtering for trust-sensitive queries (admin actions, moderators, addressable events, NIP-72 communities). Load when building trust-boundary features, rendering user-controlled URLs or markup, interpolating event data into CSS, or reviewing the app's security posture.
---

# Nostr Security

## The threat model you need to internalize

**Nostr private keys (`nsec`) are stored in plaintext in `localStorage`.** Any JavaScript running on the page origin can read them with a single line:

```js
localStorage.getItem('nostr-login');
```

A successful XSS on any page of the app = instant, silent, irreversible key theft. There is no rotation mechanism, no session revocation, no server-side audit trail. Once an attacker has the `nsec`, they can impersonate the user forever across every Nostr client and relay in existence.

**Every security practice in this skill exists to make XSS harder to achieve.** The stakes for a Nostr client are substantially higher than for a typical web app — treat every bit of untrusted data (event tags, `content`, metadata fields, URL parameters, relay responses) as a potential script injection vector.

NIP-07 browser extensions and NIP-46 remote signers keep the key material outside the web app's origin, but they don't change this threat model: a successful XSS can still ask an active signer to sign arbitrary events, drain funds via zap requests, publish malicious content under the user's identity, or scrape plaintext DMs as they're decrypted. The mitigation story is the same regardless of login method — make XSS hard, and filter trust-sensitive queries by author.

## Defense-in-depth layers

### Layer 1: Content Security Policy

mkstack ships a CSP meta tag in `index.html`:

```html
<meta http-equiv="content-security-policy" content="
  default-src 'none';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  frame-src 'self' https:;
  font-src 'self';
  base-uri 'self';
  manifest-src 'self';
  connect-src 'self' blob: https: wss:;
  img-src 'self' data: blob: https:;
  media-src 'self' https:
">
```

What this buys you:

- **`script-src 'self'`** — no inline `<script>` tags, no `eval`, no remote script URLs. An `<img onerror=...>` injection is blocked. This is the single most important directive.
- **`default-src 'none'`** — everything else falls back to "nothing allowed unless explicitly permitted".
- **`base-uri 'self'`** — blocks `<base href="//attacker">` rebase attacks.
- **`connect-src 'self' https: wss:`** — relay/HTTP fetches are allowed, but a compromised script can't exfiltrate to `http://` or a custom protocol.

Gaps to be aware of:

- **`style-src 'unsafe-inline'`** is present because Tailwind + shadcn rely on inline styles. This means CSS-based attacks (see §3 below) are *not* blocked by CSP. **Do not remove `'unsafe-inline'`** — it will break the app — but understand that inline-style sanitization is on you.
- **`img-src data:`** allows `data:` images (small inline assets). An attacker can't escalate this to script execution, but it does weaken `data:`-URI defenses.
- **`frame-src https:`** allows any HTTPS iframe. If you embed user-controlled URLs in `<iframe>`s, sanitize the URL first.

**If you change the CSP**, err on the side of more restrictive. Never add `'unsafe-eval'`, `'unsafe-inline'` to `script-src`, `http:` anywhere, or a broad `*` source.

### Layer 2: Never use `dangerouslySetInnerHTML` with event data

React's JSX auto-escapes interpolated strings. The moment you reach for `dangerouslySetInnerHTML` or DOM APIs like `innerHTML`, `insertAdjacentHTML`, or `document.write`, you've opted out of that protection and CSP alone will not save you (a `javascript:` URL in an `<a href>` written via `innerHTML` still fires on click).

If you *must* render HTML from event data, pipe it through a sanitizer (e.g. DOMPurify with a strict allowlist) at the parse layer — not at the render site.

### Layer 3: Sanitize untrusted URLs and CSS values (§2, §3 below)

CSP is defense-in-depth. Sanitization is the primary defense. Both must be present.

---

## The three attack surfaces

1. **URL injection** — event-sourced URLs reaching `href`, `src`, `srcSet`, `poster`, iframe `src`, or CSS `url()`. Covered in §1.
2. **CSS injection** — event data interpolated into `<style>` or `style=""`, allowing an attacker to break out of the CSS string context and inject rules. Covered in §2.
3. **Trust-boundary forgery** — unfiltered queries for admin/moderator/owner events, or routes that let any pubkey squat a `d` tag. Covered in §3.


## 1. URL sanitization

**Any URL from event data is untrusted user input.** This includes:

- Tag values (`r`, `url`, `image`, `picture`, `banner`, custom tags)
- Metadata fields (kind 0 `content` — `picture`, `banner`, `website`, `lud06`, `nip05`)
- URLs parsed out of freeform `content`
- Relay-hint URLs from `e`, `a`, `p` tags

Threats go beyond `javascript:` XSS:

- `javascript:` / `vbscript:` — XSS on click
- `data:` — resource exhaustion, phishing frames, policy bypass
- `http://` — leaks user IP and request metadata without TLS
- Relative / protocol-relative paths — trigger unintended requests to the app's own origin
- Malformed strings — throw at parse time in consumers that expect URL-shaped input

### Rule: sanitize every event-sourced URL unconditionally

Don't try to reason about which rendering context is "safe enough" — it's fragile and breaks when code moves. Sanitize at the boundary where event data enters your code.

mkstack doesn't ship a `sanitizeUrl` helper. Add one (e.g. in `src/lib/sanitizeUrl.ts`) the first time you need it:

```ts
// src/lib/sanitizeUrl.ts
/**
 * Normalise and validate a URL from untrusted event data.
 * Returns the canonical href only for valid https:// URLs; returns undefined
 * for everything else (javascript:, data:, http:, relative paths, garbage).
 */
export function sanitizeUrl(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}
```

Usage:

```ts
import { sanitizeUrl } from '@/lib/sanitizeUrl';

// Single URL
const picture = sanitizeUrl(metadata?.picture);
if (picture) {
  return <img src={picture} alt="" />;
}

// Array of URLs — drop the invalid ones
const links = event.tags
  .filter(([name]) => name === 'r')
  .map(([, v]) => sanitizeUrl(v))
  .filter((v): v is string => !!v);
```

### Sanitize at the parse layer

When you write a function that extracts structured data from an event (e.g. `parseProfile`, `parseArticle`, `parseThemeDefinition`), call `sanitizeUrl` before returning. Every downstream consumer is then protected automatically — no per-call-site discipline required.

```ts
function parseProfile(event: NostrEvent): Profile {
  const meta = JSON.parse(event.content);
  return {
    name: meta.name,
    picture: sanitizeUrl(meta.picture),   // validated once, safe everywhere
    banner: sanitizeUrl(meta.banner),
    website: sanitizeUrl(meta.website),
  };
}
```

### When sanitization is NOT required

- URLs matched by a regex that already constrains the protocol (e.g. a content tokeniser matching only `https?://...`). The regex *is* the sanitizer in that case.
- Hardcoded / app-generated URLs (relay URLs in `AppConfig`, internal route strings).
- Strings rendered as plain text without ever landing in an HTML attribute, CSS value, or network request.

If in doubt, sanitize.

## 2. CSS injection prevention

Any event value interpolated into CSS — inside a `<style>` element, a `style` attribute, or a dynamically injected stylesheet — is a CSS injection vector. A string containing `"`, `)`, `}`, or `;` can escape the current CSS context and inject arbitrary rules: overlay phishing content, hide UI, leak data via `background-image: url()` requests, etc.

### Common injection surfaces

```css
background-image: url("${url}");      /* url closes with: "); body { display:none }  */
font-family: "${family}";             /* closes with: "; } body { visibility:hidden } .x { */
@font-face { src: url("${url}"); }    /* same risk as background-image */
```

### Mitigation — sanitize at the parse layer

1. **URLs in CSS `url()` values** — pass through `sanitizeUrl()`. The `URL` constructor percent-encodes `"`, `)`, `\`, and other CSS-context-breaking characters, and non-`https:` URLs are rejected entirely.

2. **Non-URL strings in CSS declarations** (font-family names, animation names, custom-property values) — allowlist safe characters only. Strip everything else.

```ts
// src/lib/sanitizeCssString.ts
/**
 * Strip characters that can break out of a CSS string literal. Keeps Unicode
 * letters/numbers, spaces, hyphens, underscores, apostrophes, and periods.
 */
export function sanitizeCssString(value: string): string {
  return value.replace(/[^\p{L}\p{N} _\-'.]/gu, '');
}
```

### Safe pattern

```ts
// ❌ UNSAFE — raw event data interpolated into CSS
const bgUrl = getTagValue(event.tags, 'bg');
style.textContent = `body { background-image: url("${bgUrl}"); }`;

const family = getTagValue(event.tags, 'f');
style.textContent = `html { font-family: "${family}"; }`;

// ✅ SAFE — URLs validated, strings sanitised
import { sanitizeUrl } from '@/lib/sanitizeUrl';
import { sanitizeCssString } from '@/lib/sanitizeCssString';

const bgUrl = sanitizeUrl(getTagValue(event.tags, 'bg'));
if (bgUrl) {
  style.textContent = `body { background-image: url("${bgUrl}"); }`;
}

const family = sanitizeCssString(getTagValue(event.tags, 'f') ?? '');
if (family) {
  style.textContent = `html { font-family: "${family}"; }`;
}
```

### Rule of thumb

Never interpolate untrusted strings into CSS without sanitisation. URL → `sanitizeUrl()`. Any other string → allowlist-based `sanitizeCssString()`. If you can't justify the specific characters you're allowing, the policy is wrong.

## 3. Author filtering for trust-sensitive queries

Not every Nostr attack is script injection. Even with perfect XSS defenses, an attacker can publish forged events that your UI will display and act on unless queries constrain `authors`. Relays are dumb pipes — they return any event that matches the filter.

### Rules

- **Admin/moderator/owner queries** — MUST filter by `authors: TRUSTED_PUBKEYS`.
- **Addressable events (kinds 30000–39999)** — MUST include `authors`; the `d` tag alone is not a trust boundary.
- **Replaceable events tied to a specific user** (profile metadata, relay lists, mute lists) — MUST include `authors: [userPubkey]`.
- **Public UGC** (kind 1 notes, reactions, zaps, public feeds, discovery) — author filtering NOT required. Anyone can post.

### Secure vs. insecure

```ts
// ❌ INSECURE — anyone can publish kind 30078 with this d-tag and
// appoint themselves as an "organizer".
const events = await nostr.query([{
  kinds: [30078],
  '#d': ['pathos-organizers'],
  limit: 1,
}]);

// ✅ SECURE — only accept events from the trusted admin list.
import { ADMIN_PUBKEYS } from '@/lib/admins';

const events = await nostr.query([{
  kinds: [30078],
  authors: ADMIN_PUBKEYS,
  '#d': ['pathos-organizers'],
  limit: 1,
}]);
```

### Addressable events — always include the author

```ts
// For addressable events, the (kind, pubkey, d) triple is the identity.
// Querying by (kind, d) alone lets ANY pubkey squat on the d-tag.
const article = await nostr.query([{
  kinds: [30023],
  authors: [authorPubkey],      // prevents d-tag spoofing
  '#d': ['my-article-slug'],
  limit: 1,
}]);
```

### URL routes for addressable/replaceable events must include the author

Route parameters drive filters. If the URL doesn't carry the author, you can't build a secure filter from it.

```tsx
// ❌ INSECURE — missing author; anyone can squat the slug
<Route path="/article/:slug" element={<Article />} />
// URL: /article/hello-world

// ✅ SECURE — author in the URL; filter by author + d-tag
<Route path="/article/:npub/:slug" element={<Article />} />
// URL: /article/npub1abc.../hello-world
```

Remember: decode `npub` → hex before passing to a filter (see the `nip19-routing` skill).

### NIP-72 community moderation — full pattern

Moderation approvals (kind 4550) are only trustworthy if signed by a moderator listed in the community definition (kind 34550). So fetch the community first, extract moderator pubkeys, then filter approvals by those authors.

```ts
// Step 1: Fetch the community definition — author-filter by the community OWNER.
const communityEvents = await nostr.query([{
  kinds: [34550],
  authors: [communityOwnerPubkey], // only trust the real owner
  '#d': [communityId],
  limit: 1,
}]);

if (communityEvents.length === 0) return [];

// Step 2: Extract moderator pubkeys from `p` tags with role "moderator".
const moderatorPubkeys = communityEvents[0].tags
  .filter(([name, _pk, _relay, role]) => name === 'p' && role === 'moderator')
  .map(([, pubkey]) => pubkey);

// Step 3: Query approvals — only accept from moderators.
const approvals = await nostr.query([{
  kinds: [4550],
  authors: moderatorPubkeys, // only trusted moderators
  '#a': [`34550:${communityOwnerPubkey}:${communityId}`],
  limit: 100,
}]);
```

Skipping step 3's `authors` filter means anyone can publish a kind 4550 event and "approve" posts into the community.

## Quick checklist

Before merging a feature that touches untrusted data, verify:

- [ ] **No `dangerouslySetInnerHTML` / `innerHTML` / `document.write`** with event data, URL params, or any other user-controlled string. If unavoidable, sanitize through an HTML allowlist (e.g. DOMPurify) at the parse layer.
- [ ] **CSP unchanged or narrowed.** No new `'unsafe-eval'`, `'unsafe-inline'` on `script-src`, `http:`, or wildcard sources.
- [ ] **Every URL from event tags/content/metadata** passes through `sanitizeUrl()` before reaching `href`, `src`, `srcSet`, `poster`, iframe `src`, or any CSS value.
- [ ] **No event string interpolated into CSS** without `sanitizeUrl()` (for URLs) or `sanitizeCssString()` (for identifiers).
- [ ] **Every trust-sensitive query** (admin, moderator, owner, addressable, user-owned replaceable) includes an `authors` filter.
- [ ] **Routes for addressable/replaceable events** carry the author in the URL.
