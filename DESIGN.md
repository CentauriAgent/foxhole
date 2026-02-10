# Foxhole — Design Document

> Fork of [Clawstr](https://github.com/clawstr/clawstr) adapted for **human** users instead of AI agents.
> 🦊 **Foxhole** — a warm, community-driven social network on Nostr.

---

## 1. Executive Summary

Clawstr is a Reddit-style social network for **AI agents** on Nostr, using NIP-22 comments on NIP-73 web URL identifiers (kind 1111). **Foxhole** keeps the same Nostr protocol foundation but removes all AI-agent-specific features, branding, and filtering to create a general-purpose human social platform.

### Branding Decisions
| Concept | Clawstr | Foxhole |
|---------|---------|---------|
| App name | Clawstr | **Foxhole** |
| Mascot/icon | 🦀 Crab | **🦊 Fox** |
| Sub-communities | Subclaws (`/c/name`) | **Dens** (`/d/name`) |
| Upvote | Upvote | **Dig** (foxes dig) |
| Downvote | Downvote | **Bury** |
| Color scheme | Crab orange-red | **Warm oranges/ambers** (fox fur) |
| Domain | clawstr.com | **foxhole.lol** (placeholder) |
| Tagline | "Where AI Agents Come to Life" | TBD (e.g. "Dig Into the Conversation") |

### Key Changes
1. **Remove AI label tags** — No more NIP-32 `["L","agent"]` / `["l","ai","agent"]` tags on posts
2. **Update domain identifier** — Dens use `https://foxhole.lol/d/<name>` instead of `https://clawstr.com/c/<name>`
3. **Remove AI/Human toggle** — All content is human content; no filtering needed
4. **Remove agent-specific UI** — Agent cards, AI badges, "AI Social Network" branding, crab theme
5. **Foxhole branding** — Fox icon, warm amber palette, den terminology, dig/bury voting

---

## 2. Protocol / Tag Changes (Kind 1111)

### Current Clawstr Tags (Top-level Post)
```json
{
  "kind": 1111,
  "tags": [
    ["I", "https://clawstr.com/c/<subclaw>"],
    ["K", "web"],
    ["i", "https://clawstr.com/c/<subclaw>"],
    ["k", "web"],
    ["L", "agent"],        // ← REMOVE
    ["l", "ai", "agent"]   // ← REMOVE
  ]
}
```

### New Foxhole Tags (Top-level Post)
```json
{
  "kind": 1111,
  "tags": [
    ["I", "https://foxhole.lol/d/<den>"],
    ["K", "web"],
    ["i", "https://foxhole.lol/d/<den>"],
    ["k", "web"]
  ]
}
```

### Reply Tags — Remove AI labels, update domain
```json
{
  "kind": 1111,
  "tags": [
    ["I", "https://foxhole.lol/d/<den>"],
    ["K", "web"],
    ["e", "<parent-event-id>", "", "<parent-pubkey>"],
    ["k", "1111"],
    ["p", "<parent-pubkey>"]
  ]
}
```

> **Note:** The `["K", "web"]` and `["k", "web"]` tags stay — they're NIP-73 web identifier markers, not AI-specific. The `I` tag URL changes to Foxhole's domain so content is scoped to this app, not Clawstr. The route changes from `/c/` (subclaws) to `/d/` (dens).

---

## 3. Terminology Mapping (Global Find/Replace Guide)

These replacements apply across **all files** — components, hooks, pages, tests, comments, strings:

| Clawstr Term | Foxhole Term | Context |
|-------------|-------------|---------|
| `Clawstr` | `Foxhole` | App name (title case) |
| `clawstr` | `foxhole` | Lowercase references, file names, CSS classes |
| `CLAWSTR` | `FOXHOLE` | Constants |
| `subclaw` / `Subclaw` | `den` / `Den` | Community names |
| `subclaws` | `dens` | Plural |
| `/c/` | `/d/` | URL route prefix |
| `c/:subclaw` | `d/:den` | Router params |
| `CrabIcon` | `FoxIcon` | Icon component |
| `crab` | `fox` | CSS vars, references |
| `AI agent` / `AI agents` | (remove or → `user` / `users`) | Copy text |
| `agent` / `agents` (in UI) | `user` / `users` | Labels, cards |
| `AgentCard` | `UserCard` | Component name |
| `usePopularAgents` | `usePopularUsers` | Hook name |
| `PopularAgent` | `PopularUser` | Type name |
| `ai-accent` | `fox-accent` | CSS variable |
| `ai-glow` | `fox-glow` | CSS variable |
| `crab-shell` | (delete) | CSS variable |
| `crab-claw` | (delete) | CSS variable |
| `clawstr.com` | `foxhole.lol` | Domain in identifiers |
| `upvote` / `downvote` | `dig` / `bury` | Vote UI labels (CSS vars `--upvote`/`--downvote` can stay as internal names) |
| `showAll` | (remove entirely) | AI/human toggle param |
| `AI Only` / `Everyone` | (remove entirely) | Toggle labels |
| `isAIContent` | (delete) | Function |
| `AI_LABEL` | (delete) | Constant |
| `createAILabelTags` | (delete) | Function |
| `CLAWSTR_BASE_URL` | `FOXHOLE_BASE_URL` | Constant |

---

## 4. File-by-File Change Inventory

### 4.1 Core Library — `src/lib/clawstr.ts` → `src/lib/foxhole.ts`
**Impact: HIGH — This is the protocol heart of the app.**

| Change | Details |
|--------|---------|
| **Rename file** | `clawstr.ts` → `foxhole.ts` |
| `CLAWSTR_BASE_URL` | → `FOXHOLE_BASE_URL` = `'https://foxhole.lol'` |
| `AI_LABEL` constant | **DELETE** entirely |
| `isAIContent()` | **DELETE** — no AI content concept |
| `createAILabelTags()` | **DELETE** |
| `createPostTags()` | Remove `...createAILabelTags()` spread |
| `createReplyTags()` | Remove `...createAILabelTags()` spread |
| `subclawToIdentifier()` | → `denToIdentifier()` — change `/c/` to `/d/` in URL |
| `identifierToSubclaw()` | → `identifierToDen()` — update regex for `/d/` and new domain |
| `isClawstrIdentifier()` | → `isFoxholeIdentifier()` |
| `getPostSubclaw()` | → `getPostDen()` |
| `isTopLevelPost()` | Keep logic, update comments |
| Utility functions | `formatRelativeTime`, `formatCount` — keep as-is |

### 4.2 Components — `src/components/clawstr/` → `src/components/foxhole/`

**Rename the entire directory.**

| File | Action | Details |
|------|--------|---------|
| **AIToggle.tsx** | **DELETE** | AI/Human filter toggle — no longer needed |
| **AgentCard.tsx** → **UserCard.tsx** | **RENAME + MODIFY** | "Popular agents" → "Popular diggers". Remove agent language. Change `PopularAgent` → `PopularUser`. |
| **AuthorBadge.tsx** | **MODIFY** | Remove `isAIContent` check, AI badge (`"AI"` span), crab fallback for bots. Simplify to single user style. Replace `ai-accent` → `fox-accent`. All users get fox-themed styling. |
| **CrabIcon.tsx** → **FoxIcon.tsx** | **REPLACE** | New fox SVG icon. Export `FoxIcon` and `FoxIconFilled`. |
| **SiteHeader.tsx** | **MODIFY** | "clawstr" → "foxhole". CrabIcon → FoxIcon. "AI Social Network" → remove or "Your Community on Nostr". All `ai-accent` → `fox-accent`. |
| **Sidebar.tsx** | **MODIFY** | `AboutCard`: Rewrite — "Foxhole is a community-driven social network built on Nostr." `SubclawInfoCard` → `DenInfoCard`: "A community to discuss **{den}**." Remove NIP-32/AI references. "Popular Communities" → "Active Dens". Replace all `ai-accent` → `fox-accent`. CrabIcon → FoxIcon. |
| **SubclawBadge.tsx** → **DenBadge.tsx** | **RENAME + MODIFY** | `c/{name}` → `d/{name}`. Link to `/d/` routes. |
| **PostCard.tsx** | **MODIFY** | `getPostSubclaw` → `getPostDen`. `/c/` → `/d/` in URLs. `ai-accent` → `fox-accent`. `SubclawBadge` → `DenBadge`. |
| **PopularPostCard.tsx** | **MODIFY** | Same accent/naming changes. |
| **NostrCommentForm.tsx** | **MODIFY** | `subclawToIdentifier` → `denToIdentifier`. Always visible when logged in (no `showAll` gating). |
| **PostList.tsx** | **MODIFY** | Remove `showAll` prop. Rename subclaw refs → den. |
| **ReplyCard.tsx** | **MODIFY** | Check for `isAIContent` — remove. Update accents. |
| **ReplyList.tsx** | **MODIFY** | Remove `showAll` filtering. |
| **ThreadedReply.tsx** | **MODIFY** | Check for AI refs, update accents. |
| **SearchResultCard.tsx** | **MODIFY** | Update subclaw → den, accent colors. |
| **VoteButtons.tsx** | **MODIFY** | Add "Dig"/"Bury" tooltip labels. Consider fox-paw icon for dig. |
| **TimeRangeTabs.tsx** | **CLEAN** | No changes needed. |
| **ZapActivityItem.tsx** | **CLEAN** | No changes needed. |
| **index.ts** | **MODIFY** | Remove AIToggle, AgentCard exports. Add FoxIcon, UserCard, DenBadge. Rename all exports. |

### 4.3 Hooks — `src/hooks/`

| File | Action | Details |
|------|--------|---------|
| **usePopularAgents.ts** → **usePopularUsers.ts** | **RENAME + MODIFY** | `PopularAgent` → `PopularUser`. Remove `AI_LABEL` filter. Remove `showAll`. `isClawstrIdentifier` → `isFoxholeIdentifier`. |
| **useClawstrPosts.ts** → **useFoxholePosts.ts** | **RENAME + MODIFY** | Remove `AI_LABEL` filter (`#l`, `#L`). Remove `showAll`. Update query keys `clawstr` → `foxhole`. |
| **useClawstrPostsInfinite.ts** → **useFoxholePostsInfinite.ts** | **RENAME + MODIFY** | Same — remove AI filter, `showAll`. Update query keys. |
| **useRecentPosts.ts** | **MODIFY** | Remove `showAll` prop. Update import from foxhole posts hook. |
| **useRecentPostsInfinite.ts** | **MODIFY** | Remove `showAll` prop. |
| **usePopularPosts.ts** | **MODIFY** | Remove `showAll` / AI filtering. |
| **usePopularSubclaws.ts** → **usePopularDens.ts** | **RENAME + MODIFY** | Remove `showAll`. Rename subclaw → den throughout. |
| **useSubclawPosts.ts** → **useDenPosts.ts** | **RENAME + MODIFY** | Remove AI filtering. |
| **useSubclawPostsInfinite.ts** → **useDenPostsInfinite.ts** | **RENAME + MODIFY** | Remove AI filtering. |
| **useSearchPosts.ts** | **MODIFY** | Remove AI filtering. |
| **useRecentZaps.ts** | **MODIFY** | Remove `showAll` if present. |
| **useLargestZaps.ts** | **MODIFY** | Remove `showAll` if present. |
| **useUserPosts.ts** | **CHECK** | May have AI filtering — remove. |
| **useUserReplies.ts** | **CHECK** | May have AI filtering — remove. |
| **usePostReplies.ts** | **CHECK** | May have AI filtering — remove. |
| **useBatchReplyCountsGlobal.ts** | **MODIFY** | Remove `showAll` parameter. |
| **useShakespeare.ts** | **CHECK** | Verify purpose — may be agent-specific demo. |

### 4.4 Pages — `src/pages/`

| File | Action | Details |
|------|--------|---------|
| **Index.tsx** | **MAJOR REWRITE** | New hero: Fox-themed, "Dig Into the Conversation" or similar. Remove AI agent join instructions, SKILL.md copy prompt. Replace "Latest posts by AI" → "Latest Posts". Empty state: "No posts yet — be the first to dig in! 🦊". Remove `showAll: false`. |
| **Popular.tsx** | **MODIFY** | Remove AIToggle + `showAll`. "Top Agents" → "Top Diggers". AgentCard → UserCard. SEO: "Popular - Foxhole". |
| **Subclaw.tsx** → update route to `/d/:den` | **MODIFY** | Remove AIToggle, `showAll`. Comment form always visible. All subclaw refs → den. |
| **Post.tsx** | **MODIFY** | Remove AIToggle, `showAll`. Comment form always visible. |
| **Search.tsx** | **MODIFY** | Remove AIToggle, `showAll`. Branding updates. |
| **Comment.tsx** | **MODIFY** | Check for AI references. |
| **docs/DocsIndex.tsx** | **REWRITE** | "Welcome to Foxhole" — getting started guide for humans. |
| **docs/DocsAbout.tsx** | **REWRITE** | About Foxhole — community-driven, Nostr-based, open source. Remove "AI Agent Pioneers". |
| **docs/DocsHumans.tsx** | **DELETE or → DocsGettingStarted.tsx** | Current content is about managing AI agents. Repurpose as "Getting Started" — creating account, joining dens, posting, zapping. |
| **docs/DocsTechnical.tsx** | **MODIFY** | Remove AI label documentation. Update identifiers to `foxhole.lol/d/`. |
| **NIP19Page.tsx** | **MINOR** | Branding if present. |
| **NotFound.tsx** | **MINOR** | Update branding — "Lost in the foxhole?" |

### 4.5 Router — `src/AppRouter.tsx`

| Change | Details |
|--------|---------|
| `/c/:subclaw` | → `/d/:den` |
| `/c/:subclaw/post/:eventId` | → `/d/:den/post/:eventId` |
| `/c/:subclaw/comment/:eventId` | → `/d/:den/comment/:eventId` |
| Keep `/docs/*` routes | Update component names if renamed |
| Optional: add redirect | `/c/*` → `/d/*` for transition |

### 4.6 Styles — `src/index.css`

**CSS Variable Changes:**

| Current | New | Value |
|---------|-----|-------|
| `--ai-accent` | `--fox-accent` | `30 90% 50%` (warm amber-orange) |
| `--ai-accent-foreground` | `--fox-accent-foreground` | Keep light foreground |
| `--ai-glow` | `--fox-glow` | `30 90% 50%` |
| `--crab-shell` | **DELETE** | — |
| `--crab-claw` | **DELETE** | — |
| `--human-badge` | **DELETE** | — |
| `--upvote` | Keep name, update value | `35 95% 55%` (amber dig color) |
| `--downvote` | Keep name, update value | `200 40% 50%` (muted blue bury color) |
| `--primary` | Update | `30 75% 48%` (warm fox orange) |

**Suggested Foxhole Palette (light mode):**
```css
--fox-accent: 30 90% 50%;        /* Warm amber-orange */
--fox-accent-foreground: 30 30% 98%;
--fox-glow: 30 90% 50%;
--primary: 30 75% 48%;            /* Fox orange */
--primary-foreground: 30 30% 98%;
--upvote: 35 95% 55%;             /* Amber (dig) */
--downvote: 200 40% 50%;          /* Slate blue (bury) */
```

**Suggested Foxhole Palette (dark mode):**
```css
--fox-accent: 30 85% 55%;
--fox-accent-foreground: 15 15% 7%;
--fox-glow: 30 85% 55%;
--primary: 30 75% 55%;
--upvote: 35 95% 60%;
--downvote: 200 45% 60%;
```

**Global CSS replacement:** All instances of `hsl(var(--ai-accent))` → `hsl(var(--fox-accent))` across all component files.

### 4.7 Static / Config Files

| File | Action | Details |
|------|--------|---------|
| **index.html** | Update `<title>` → "Foxhole — Dig Into the Conversation". Update all meta tags. `og:url` → `https://foxhole.lol`. |
| **public/manifest.webmanifest** | `name` → "Foxhole", `short_name` → "Foxhole", new description, `theme_color` → fox amber |
| **public/favicon.png** | **REPLACE** — Fox icon favicon |
| **public/og-image.jpg** | **REPLACE** — Foxhole branded OG image |
| **public/SKILL.md** | **DELETE** — AI agent onboarding guide |
| **public/HEARTBEAT.md** | **DELETE** — AI agent heartbeat config |
| **public/robots.txt** | Update sitemap URL |
| **AGENTS.md** | **DELETE** — Clawstr agent workspace config |
| **package.json** | `"name"` → `"foxhole"` |
| **.github/workflows/deploy.yml** | Update deployment target/domain |
| **installation/Caddyfile** | Update domain → `foxhole.lol` |

### 4.8 Components (Non-clawstr directory)

| File | Action |
|------|--------|
| **docs/DocsLayout.tsx** | Update nav branding — FoxIcon, "Foxhole Docs" |
| **NostrProvider.tsx** | Check relay list — keep same relays |
| **AppProvider.tsx** | Check context defaults |
| **EditProfileForm.tsx** | Clean — no changes |
| **auth/*** | Clean — no changes |
| **dm/*** | Clean — no changes |

---

## 5. Architecture Changes

### 5.1 Remove the AI/Human Content Dichotomy
The biggest architectural change: Clawstr has a two-tier content model (AI-labeled content vs. human content, with toggle). Foxhole has **one tier** — all content is equal.

**Cascade:**
- Delete `AIToggle` component
- Remove `showAll` prop from ~15 hooks and ~5 pages
- Remove `AI_LABEL` constant and `isAIContent()` / `createAILabelTags()`
- Simplify all Nostr query filters (no `#l` / `#L` filter params)

### 5.2 Human Posting is Default
In Clawstr, human commenting is a secondary feature (only in "Everyone" mode). In Foxhole:
- `NostrCommentForm` is always visible when logged in
- Add a **"Dig a New Post"** button/form for creating top-level den posts
- Post creation page/dialog with den selector, title/content fields

### 5.3 New Post Creation Flow
Clawstr has no in-app post creation for humans (agents use CLI). Foxhole needs:
- **"New Post" button** in header and den pages
- **Post creation form** — den selector, title, content, optional image
- Uses `createPostTags()` (without AI labels) to publish kind 1111
- Consider a `/submit` or `/d/:den/submit` route

### 5.4 Route Changes
| Clawstr Route | Foxhole Route |
|---------------|---------------|
| `/c/:subclaw` | `/d/:den` |
| `/c/:subclaw/post/:eventId` | `/d/:den/post/:eventId` |
| `/c/:subclaw/comment/:eventId` | `/d/:den/comment/:eventId` |
| `/popular` | `/popular` (keep) |
| `/search` | `/search` (keep) |
| `/docs/*` | `/docs/*` (keep) |

### 5.5 Docs Restructure
| Current | Foxhole |
|---------|---------|
| DocsIndex (AI agent overview) | Welcome / Getting Started |
| DocsHumans (managing your AI agent) | **DELETE** or → Getting Started guide |
| DocsTechnical (NIP specs for agents) | Technical (for developers) |
| DocsAbout (about Clawstr) | About Foxhole |

### 5.6 Profile Pages
- Remove AI badge from profiles
- Remove "agent" terminology
- Keep zap functionality
- Keep NWC wallet integration

### 5.7 Vote UX — Dig/Bury
The `VoteButtons` component currently shows generic up/down arrows. For Foxhole:
- **Upvote tooltip:** "Dig" (or "Dig it up")
- **Downvote tooltip:** "Bury"
- Consider paw-print or shovel icons to reinforce the metaphor
- Aria labels: "Dig this post" / "Bury this post"

---

## 6. What Stays the Same

These features are protocol-level or user-agnostic and require **no changes**:
- NIP-22 comment structure (kind 1111)
- NIP-73 web URL identifiers (`I`/`K`/`i`/`k` tags — just different domain)
- Nostr authentication (NIP-07, nsec, etc.)
- Zapping (NIP-57)
- Voting/reactions (internal mechanism)
- DM system
- Wallet/NWC integration
- Reply threading
- Search functionality (structure)
- Infinite scroll
- Profile pages (structure)
- Hot score algorithm (`src/lib/hotScore.ts`)

---

## 7. Implementation Order (Suggested)

### Phase 1 — Core Protocol (`src/lib/`)
- Rename `clawstr.ts` → `foxhole.ts`
- Update `FOXHOLE_BASE_URL`, `/c/` → `/d/`
- Delete AI constants/functions
- Fix all imports across the app

### Phase 2 — Hooks (`src/hooks/`)
- Remove AI filtering from all query hooks
- Remove `showAll` parameter everywhere
- Rename files: `useClawstr*` → `useFoxhole*`, `usePopularAgents` → `usePopularUsers`, `useSubclaw*` → `useDen*`, `usePopularSubclaws` → `usePopularDens`
- Update all query keys `'clawstr'` → `'foxhole'`

### Phase 3 — Components (`src/components/clawstr/` → `src/components/foxhole/`)
- Delete AIToggle
- Replace CrabIcon → FoxIcon (new SVG)
- Rename AgentCard → UserCard, SubclawBadge → DenBadge
- Simplify AuthorBadge (remove AI detection)
- Update SiteHeader, Sidebar copy and branding
- Update VoteButtons with dig/bury labels
- Update all `ai-accent` → `fox-accent` refs

### Phase 4 — Pages (`src/pages/`)
- Rewrite Index hero (fox-themed, human-focused)
- Update routes: `/c/` → `/d/` in AppRouter
- Simplify Popular, Subclaw→Den, Post, Search (remove showAll/AIToggle)
- Rewrite/delete docs pages

### Phase 5 — Styling (`src/index.css`)
- Rename CSS variables (`ai-accent` → `fox-accent`, delete crab vars)
- New warm amber/orange palette
- Global find/replace `ai-accent` in all component files

### Phase 6 — Static Assets & Config
- New fox favicon, OG image
- Update index.html meta tags
- Update manifest.webmanifest
- Delete SKILL.md, HEARTBEAT.md, AGENTS.md
- Update package.json, deploy configs

### Phase 7 — New Features
- Post creation form/page
- Updated docs (Getting Started, About Foxhole)
- Optional: `/c/*` → `/d/*` redirect middleware

---

## 8. Remaining Open Questions

1. **Domain** — `foxhole.lol` is the working assumption. Confirm before going live (affects NIP-73 identifier URLs).
2. **Content interop** — Should Foxhole show Clawstr AI content too? Or completely separate content pools? (Current design: separate pools via different `I` tag domain.)
3. **Fox icon source** — Use a Lucide icon (`Fox` is not in lucide-react)? Custom SVG? Emoji-based?
4. **Post creation priority** — Clawstr has no human post creation UI. Is this a blocker for MVP or can it ship with comment-only?
5. **Tagline** — "Dig Into the Conversation"? "Your Den on Nostr"? "Where Communities Dig In"?
