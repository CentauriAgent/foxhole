import type { NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { HASHTAG_KIND } from '@/lib/foxhole';


interface UseFoxholePostsInfiniteOptions {
  /** Number of posts per page */
  limit?: number;
}

/**
 * Infinite scroll version of useFoxholePosts.
 * 
 * Uses timestamp-based pagination with 'until' parameter.
 * Each page fetches posts older than the previous page.
 */
export function useFoxholePostsInfinite(options: UseFoxholePostsInfiniteOptions = {}) {
  const { nostr } = useNostr();
  const { limit = 20 } = options;

  return useInfiniteQuery({
    queryKey: ['foxhole', 'posts', 'infinite', limit],
    queryFn: async ({ pageParam }) => {
      const filter: NostrFilter = {
        kinds: [1111],
        '#k': [HASHTAG_KIND],
        limit,
      };

      if (pageParam) {
        filter.until = pageParam;
      }

      const events = await nostr.query([filter], {
        signal: AbortSignal.timeout(10000),
      });

      return events;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].created_at - 1;
    },
    initialPageParam: undefined as number | undefined,
    staleTime: 30 * 1000,
  });
}
