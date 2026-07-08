import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Compute the `until` timestamp for the next page of a reverse-chronological
 * Nostr feed.
 *
 * Uses the last event's timestamp as-is (NOT -1): subtracting 1 silently
 * drops any events sharing the boundary timestamp. The one-event overlap
 * this causes is removed by the seen-set dedupe when pages are flattened.
 *
 * Returns undefined (no more pages) when the page is empty, or when no
 * progress can be made because an entire page shared one timestamp.
 */
export function getNextUntil(
  lastPage: NostrEvent[],
  lastPageParam: number | undefined,
): number | undefined {
  if (lastPage.length === 0) return undefined;
  const nextUntil = lastPage[lastPage.length - 1].created_at;
  if (nextUntil === lastPageParam) return undefined;
  return nextUntil;
}
