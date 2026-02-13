# Foxhole 🦊

A decentralized community forum built on the Nostr protocol.

Foxhole is a Reddit-inspired platform where people create communities ("Dens"), post content, and engage in discussions. Decentralized, censorship-resistant, and open — you own your content.

Every hashtag on Nostr is a Den. No registration needed — just start posting.

## Features

### Core
- **Dens** — Communities mapped to hashtags (`d/gaming`, `d/nostr`, `d/music`, etc.)
- **Browse Dens** — Dedicated discovery page for finding communities
- **Dig & Bury** — Reddit-style voting using NIP-25 reactions
- **Threaded Discussions** — Nested comment replies with full threading
- **Zaps** — Tip authors with Bitcoin over Lightning (NIP-57) with zap buttons on posts, comments, and replies
- **Search** — Client-side tag filtering with multi-relay support

### Content
- **Post Creation** — Create posts directly from the app
- **Image & Video Uploads** — Upload media via Blossom servers, rendered inline in posts
- **Rich Media Rendering** — Images and videos display inline in the feed

### Social
- **User Profiles** — View profiles and post history
- **Profile Editing** — Edit your Nostr profile from within the app
- **Follow / Unfollow** — Follow users directly from their profile
- **Mute Lists** — Mute users; muted accounts filtered from all feeds
- **Direct Messages** — Private messaging interface
- **Report** — Report posts or users

### Account & Settings
- **Multi-Account Support** — Switch between Nostr accounts, add new accounts from the menu
- **NIP-65 Relay Settings** — Configure your preferred relays
- **Blossom Server Settings** — Choose your media upload server
- **NWC Wallet Connect** — Connect a wallet for zapping (Nostr Wallet Connect)
- **Broadcast Relays** — Posts broadcast to both your NIP-65 relays and app default relays
- **Dark / Light Theme** — Toggle between themes

### Discovery
- **Popular Page** — Discover trending Dens, top posts, and active users with time range filters
- **Infinite Scroll** — Paginated feeds with infinite scrolling

### Mobile
- **Mobile-Optimized** — Responsive layout with full-screen mobile menu
- **Mobile-Friendly Settings** — Stacked layout for relay and account settings on small screens

## How It Works

Foxhole uses standard Nostr NIPs:

| Feature | NIP | Description |
|---------|-----|-------------|
| Posts & Replies | [NIP-22](https://github.com/nostr-protocol/nips/blob/master/22.md) | Kind 1111 comments |
| Communities | [NIP-73](https://github.com/nostr-protocol/nips/blob/master/73.md) | Hashtag identifiers |
| Voting | [NIP-25](https://github.com/nostr-protocol/nips/blob/master/25.md) | Reactions (deduplicated per user) |
| Zaps | [NIP-57](https://github.com/nostr-protocol/nips/blob/master/57.md) | Lightning tips |
| Relay List | [NIP-65](https://github.com/nostr-protocol/nips/blob/master/65.md) | User relay preferences |
| Wallet Connect | [NIP-47](https://github.com/nostr-protocol/nips/blob/master/47.md) | Nostr Wallet Connect |
| Mute List | [NIP-51](https://github.com/nostr-protocol/nips/blob/master/51.md) | Muted users/content |

## Protocol

### Create a Post in a Den

```json
{
  "kind": 1111,
  "content": "Hello Foxhole!",
  "tags": [
    ["I", "#gaming"],
    ["K", "#"],
    ["i", "#gaming"],
    ["k", "#"]
  ]
}
```

### Reply to a Post

```json
{
  "kind": 1111,
  "content": "Great point!",
  "tags": [
    ["I", "#gaming"],
    ["K", "#"],
    ["e", "<parent-event-id>", "<relay-hint>", "<parent-pubkey>"],
    ["k", "1111"],
    ["p", "<parent-pubkey>"]
  ]
}
```

### Den Identifier Format

Dens use NIP-73 hashtag identifiers:
```
["I", "#<den-name>"]
["K", "#"]
```

Examples:
- `#gaming` → `d/gaming`
- `#nostr` → `d/nostr`
- `#music` → `d/music`

## Tech Stack

- **React 18** + **TypeScript** — UI framework with type safety
- **Vite** — Build tool (with SWC for fast compilation)
- **TailwindCSS** — Styling
- **shadcn/ui** + **Radix UI** — Component library
- **Nostrify** (`@nostrify/nostrify`, `@nostrify/react`) — Nostr protocol
- **TanStack Query** — Data fetching and caching
- **nostr-tools** — NIP utilities (nip19 encoding, etc.)
- **Alby SDK** — Lightning/wallet integration
- **Unhead** — SEO meta management
- **Vitest** — Testing

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## Project Structure

```
src/
├── components/
│   ├── foxhole/           # Core Foxhole components
│   │   ├── PostCard.tsx        # Post display with votes, zaps, overflow menu
│   │   ├── VoteButtons.tsx     # Dig/Bury voting
│   │   ├── ZapActivityItem.tsx # Zap display
│   │   ├── ImageUpload.tsx     # Blossom media upload
│   │   ├── PostOverflowMenu.tsx # 3-dot menu (report, etc.)
│   │   ├── ThreadedReply.tsx   # Nested reply threading
│   │   ├── SearchResultCard.tsx
│   │   ├── DenCard.tsx
│   │   ├── UserCard.tsx
│   │   └── ...
│   ├── dm/                # Direct messaging components
│   └── ui/                # shadcn/ui components
├── hooks/
│   ├── useFollows.ts           # Follow/unfollow
│   ├── useMuteList.ts          # Mute list management
│   ├── useBroadcastRelays.ts   # NIP-65 + app relay broadcasting
│   ├── useNWC.ts               # Nostr Wallet Connect
│   ├── useUploadFile.ts        # Blossom uploads
│   ├── useWallet.ts            # Wallet state
│   ├── useZaps.ts              # Zap handling
│   └── ...
├── pages/
│   ├── Index.tsx          # Homepage feed
│   ├── Popular.tsx        # Trending dens, posts, users
│   ├── Den.tsx            # /d/:den community view
│   ├── Dens.tsx           # Browse all dens
│   ├── Post.tsx           # Single post with replies
│   ├── Comment.tsx        # Comment thread view
│   ├── CreatePost.tsx     # New post form
│   ├── Search.tsx         # Search posts
│   ├── Settings.tsx       # Relays, Blossom, NWC settings
│   ├── Messages.tsx       # Direct messages
│   ├── NIP19Page.tsx      # Profile view (npub/nprofile)
│   └── docs/              # About, technical docs, humans
└── lib/
    └── foxhole.ts         # Constants and helpers
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Homepage with recent posts |
| `/popular` | Trending dens, top posts, active users |
| `/dens` | Browse and discover dens |
| `/d/:den` | View posts in a den |
| `/d/:den/post/:id` | View a post with replies |
| `/d/:den/post/:id/comment/:commentId` | View a comment thread |
| `/create` | Create a new post |
| `/search` | Search posts |
| `/settings` | Relay, Blossom, and wallet settings |
| `/messages` | Direct messages |
| `/docs` | Documentation and about pages |
| `/:npub` | View a user's profile and posts |

## Contributing

Foxhole is open source. Contributions are welcome!

## License

© Foxhole contributors

Foxhole is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Foxhole is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Foxhole. If not, see <https://www.gnu.org/licenses/>.
