# Foxhole 🦊

A community forum built on the Nostr protocol.

Foxhole is a Reddit-inspired platform where people create communities ("Dens"), post content, and engage in discussions. Decentralized, censorship-resistant, and open — you own your content.

Every hashtag on Nostr is a Den. No registration needed — just start posting.

## Features

- **Dens** — Communities mapped to hashtags (`d/gaming`, `d/nostr`, `d/music`, etc.)
- **Dig & Bury** — Reddit-style voting using NIP-25 reactions
- **Threaded Discussions** — Nested comment replies
- **Zaps** — Tip authors with Bitcoin over Lightning (NIP-57)
- **User Profiles** — View profiles and post history
- **Post Creation** — Create posts directly from the app
- **No Login Required** — Browse freely, sign in with a Nostr key to post

## How It Works

Foxhole uses standard Nostr NIPs:

| Feature | NIP | Description |
|---------|-----|-------------|
| Posts & Replies | [NIP-22](https://github.com/nostr-protocol/nips/blob/master/22.md) | Kind 1111 comments |
| Communities | [NIP-73](https://github.com/nostr-protocol/nips/blob/master/73.md) | Hashtag identifiers |
| Voting | [NIP-25](https://github.com/nostr-protocol/nips/blob/master/25.md) | Reactions |
| Zaps | [NIP-57](https://github.com/nostr-protocol/nips/blob/master/57.md) | Lightning tips |

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

- **React 18** — UI framework
- **TypeScript** — Type safety
- **Vite** — Build tool
- **TailwindCSS** — Styling
- **shadcn/ui** — UI components
- **Nostrify** — Nostr protocol
- **TanStack Query** — Data fetching

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── foxhole/           # Foxhole components
│   │   ├── PostCard.tsx
│   │   ├── VoteButtons.tsx
│   │   ├── AuthorBadge.tsx
│   │   ├── FoxIcon.tsx
│   │   └── ...
│   └── ui/                # shadcn/ui components
├── hooks/
│   ├── useDenPosts.ts
│   ├── usePostVotes.ts
│   ├── usePostReplies.ts
│   └── ...
├── pages/
│   ├── Index.tsx          # Homepage
│   ├── Den.tsx            # /d/:den
│   ├── Post.tsx           # /d/:den/post/:id
│   ├── CreatePost.tsx     # /create
│   └── ...
└── lib/
    └── foxhole.ts         # Constants and helpers
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Homepage with recent posts |
| `/popular` | Discover popular Dens and top users |
| `/d/:den` | View posts in a Den |
| `/d/:den/post/:id` | View a post with replies |
| `/create` | Create a new post |
| `/search` | Search posts |
| `/:npub` | View a user's profile |

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
