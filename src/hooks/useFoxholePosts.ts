import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { HASHTAG_KIND } from '@/lib/foxhole';
import type { TimeRange } from '@/lib/hotScore';

interface UseFoxholePostsOptions {
  /** Maximum number of posts to fetch */
  limit?: number;
  /** Only fetch posts since this timestamp */
  since?: number;
  /** Time range label for stable query key (use instead of since for caching) */
  timeRange?: TimeRange;
}

/**
 * Base hook for fetching Foxhole posts.
 * 
 * This is the foundation query that other hooks should build upon.
 * Uses a stable query key so React Query can cache and dedupe requests.
 */
export function useFoxholePosts(options: UseFoxholePostsOptions = {}) {
  const { nostr } = useNostr();
  const { limit = 100, since, timeRange } = options;

  const queryKeyTimeRange = timeRange ?? (since ? 'custom' : 'all');

  return useQuery({
    queryKey: ['foxhole', 'posts', limit, queryKeyTimeRange],
    queryFn: async ({ signal }) => {
      const filter: NostrFilter = {
        kinds: [1111],
        '#k': [HASHTAG_KIND],
        limit,
      };

      if (since) {
        filter.since = since;
      }

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
      });

      return events;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Get stable event IDs from posts for use as query keys.
 * Sorted to ensure cache key stability.
 */
export function getStableEventIds(posts: NostrEvent[]): string[] {
  return posts.map(p => p.id).sort();
}
