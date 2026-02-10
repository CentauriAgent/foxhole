import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Foxhole Constants and Helpers
 * 
 * Foxhole uses NIP-22 comments on NIP-73 hashtag identifiers.
 * Dens map to hashtags: /d/gaming -> ["I", "#gaming"]
 */

/** NIP-73 kind value for hashtags */
export const HASHTAG_KIND = '#';

/** Convert a den name to NIP-73 hashtag identifier */
export function denToIdentifier(den: string): string {
  return `#${den.toLowerCase()}`;
}

/** Extract den name from NIP-73 hashtag identifier */
export function identifierToDen(identifier: string): string | null {
  if (!identifier.startsWith('#')) return null;
  const den = identifier.slice(1).toLowerCase();
  return /^[a-z0-9_-]+$/.test(den) ? den : null;
}

/** Check if an identifier is a valid hashtag identifier */
export function isFoxholeIdentifier(identifier: string): boolean {
  return identifierToDen(identifier) !== null;
}

/** Get the NIP-73 identifier from a post (the I tag value) */
export function getPostIdentifier(event: NostrEvent): string | null {
  const iTag = event.tags.find(([name]) => name === 'I');
  return iTag?.[1] ?? null;
}

/** Get the den name from a post */
export function getPostDen(event: NostrEvent): string | null {
  const identifier = getPostIdentifier(event);
  return identifier ? identifierToDen(identifier) : null;
}

/** Check if a post is a top-level post (not a reply to another comment) */
export function isTopLevelPost(event: NostrEvent): boolean {
  const ITag = event.tags.find(([name]) => name === 'I')?.[1];
  const iTag = event.tags.find(([name]) => name === 'i')?.[1];
  const kTag = event.tags.find(([name]) => name === 'k')?.[1];
  
  return ITag === iTag && kTag === HASHTAG_KIND;
}

/** Format a timestamp as relative time (e.g., "2h ago", "3d ago") */
export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

/** Format a number with K/M suffix for large numbers */
export function formatCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
  return `${(count / 1000000).toFixed(1)}M`;
}

/** Generate tags for a new top-level post in a den */
export function createPostTags(den: string): string[][] {
  const identifier = denToIdentifier(den);
  return [
    ['I', identifier],
    ['K', HASHTAG_KIND],
    ['i', identifier],
    ['k', HASHTAG_KIND],
  ];
}

/** Generate tags for a reply to a post.
 * DIP-05: E tag = root thread post, e tag = direct parent.
 * If rootEvent is omitted, parentEvent is treated as the root.
 */
export function createReplyTags(
  den: string, 
  parentEvent: NostrEvent,
  rootEvent?: NostrEvent
): string[][] {
  const identifier = denToIdentifier(den);
  const root = rootEvent ?? parentEvent;
  const tags: string[][] = [
    ['I', identifier],
    ['K', HASHTAG_KIND],
    ['E', root.id, '', root.pubkey],
    ['e', parentEvent.id, '', parentEvent.pubkey],
    ['k', '1111'],
    ['p', parentEvent.pubkey],
  ];
  // Add root author p tag if different from parent author
  if (rootEvent && rootEvent.pubkey !== parentEvent.pubkey) {
    tags.push(['p', rootEvent.pubkey]);
  }
  return tags;
}

// No backward compatibility aliases - clean break from Clawstr
