# Foxhole Protocol Specification

Foxhole is a Reddit-style community forum built on the Nostr protocol. It uses NIP-22 comments on NIP-73 hashtag identifiers to create threaded discussions organized by topic.

## Overview

| Component | NIP | Kind | Description |
|-----------|-----|------|-------------|
| Posts & Replies | NIP-22 | 1111 | Comments on external content |
| Den Identifiers | NIP-73 | — | Hashtag external content IDs |
| Voting | NIP-25 | 7 | Reactions (`+` for dig, `-` for bury) |
| Zaps | NIP-57 | 9735 | Lightning tips |

## Dens (Communities)

Dens are communities identified by NIP-73 hashtag identifiers. Every hashtag on Nostr is automatically a Den.

The identifier format is:
```
["I", "#<den-name>"]
["K", "#"]
```

Examples:
- `#gaming` → Gaming community
- `#nostr` → Nostr discussion
- `#music` → Music community

Den names are lowercase alphanumeric with hyphens allowed.

### Why Hashtags?

Using NIP-73 hashtag identifiers means:
1. **Universal** — Every hashtag on Nostr is a community, no registration needed
2. **Interoperable** — Any Nostr client can display den content
3. **Open** — No walled gardens or platform-specific scoping

## Event Types

### Top-Level Post

A top-level post in a den is a NIP-22 comment on a NIP-73 hashtag identifier.

```json
{
  "kind": 1111,
  "content": "Has anyone tried the new game engine?",
  "tags": [
    ["I", "#videogames"],
    ["K", "#"],
    ["i", "#videogames"],
    ["k", "#"]
  ]
}
```

**Key points:**
- Both `I`/`i` tags contain the same hashtag identifier
- Both `K`/`k` tags are `#` (NIP-73 hashtag kind)
- This identifies the post as a top-level post in the `videogames` den

### Reply to a Post

A reply uses the hashtag identifier as root and the parent post as the reply target.

```json
{
  "kind": 1111,
  "content": "Yes! It's incredible for procedural generation.",
  "tags": [
    ["I", "#videogames"],
    ["K", "#"],
    ["e", "<parent-post-id>", "<relay-hint>", "<parent-pubkey>"],
    ["k", "1111"],
    ["p", "<parent-pubkey>"]
  ]
}
```

**Key points:**
- `I`/`K` (uppercase) still reference the root hashtag
- `e` tag references the parent post
- `k` (lowercase) is `1111` — the parent's kind (NOT `#`)
- `p` tag references the parent author

### Nested Reply

Replies to replies follow the same pattern, always maintaining the root hashtag identifier.

```json
{
  "kind": 1111,
  "content": "What kind of procedural generation?",
  "tags": [
    ["I", "#videogames"],
    ["K", "#"],
    ["e", "<parent-comment-id>", "<relay-hint>", "<parent-pubkey>"],
    ["k", "1111"],
    ["p", "<parent-pubkey>"]
  ]
}
```

## Voting

Foxhole uses NIP-25 reactions for voting:

### Dig (Upvote)

```json
{
  "kind": 7,
  "content": "+",
  "tags": [
    ["e", "<target-event-id>", "<relay>", "<target-pubkey>"],
    ["p", "<target-pubkey>"],
    ["k", "1111"]
  ]
}
```

### Bury (Downvote)

```json
{
  "kind": 7,
  "content": "-",
  "tags": [
    ["e", "<target-event-id>", "<relay>", "<target-pubkey>"],
    ["p", "<target-pubkey>"],
    ["k", "1111"]
  ]
}
```

### Counting Votes

- `content === "+"` or `content === ""` → dig (upvote)
- `content === "-"` → bury (downvote)
- Emoji reactions are ignored for vote counting
- Score = digs - buries

## Querying

### Fetch Posts in a Den

```json
{
  "kinds": [1111],
  "#i": ["#videogames"],
  "#k": ["#"],
  "limit": 50
}
```

### Fetch All Posts Across Dens

```json
{
  "kinds": [1111],
  "#K": ["#"],
  "limit": 50
}
```

### Identifying Top-Level vs Replies

**Top-level posts:**
- `k` tag value is `#`
- `i` tag matches the `I` tag (both are the hashtag identifier)
- No `e` tag

**Replies:**
- `k` tag value is `1111`
- Has `e` tag pointing to parent event
- Has `p` tag with parent author's pubkey

### Fetch Replies to a Post

```json
{
  "kinds": [1111],
  "#e": ["<post-event-id>"],
  "#k": ["1111"]
}
```

### Fetch Votes for a Post

```json
{
  "kinds": [7],
  "#e": ["<post-event-id>"],
  "#k": ["1111"]
}
```

### Discover Active Dens

Query recent posts and extract unique den names from the `I` tags:

```json
{
  "kinds": [1111],
  "#K": ["#"],
  "limit": 200
}
```

Then strip the `#` prefix from each `I` tag value to get the den name.

## Hot Score Algorithm

Posts are ranked by a "hot score" that balances recency and engagement:

```
hotScore = log10(max(|score|, 1)) + (createdAt / 45000)
```

Where:
- `score` = digs - buries + (zapCount × 2) + replyCount
- `createdAt` = Unix timestamp of the post
- Posts with higher engagement AND newer timestamps rank higher
- The time component ensures fresh content surfaces even with few votes

## Recommended Relays

| Relay | URL |
|-------|-----|
| Ditto | `wss://relay.ditto.pub` |
| Primal | `wss://relay.primal.net` |
| Damus | `wss://relay.damus.io` |
| nos.lol | `wss://nos.lol` |

Always publish to multiple relays for redundancy.

## Compatibility

Foxhole events are standard Nostr events. Any client that supports:
1. Querying kind 1111 events
2. NIP-73 hashtag identifiers
3. NIP-25 reactions

...can display and interact with Foxhole content. The protocol is open and universal — no platform lock-in.
