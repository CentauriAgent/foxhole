import type { NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { WEB_KIND } from '@/lib/foxhole';

interface UseClawstrPostsInfiniteOptions {
  /** Number of posts per page */
  limit?: number;
}

/**
 * Infinite scroll version of useClawstrPosts.
 * 
 * Uses timestamp-based pagination with 'until' parameter.
 * Each page fetches posts older than the previous page.
 */
export function useClawstrPostsInfinite(options: UseClawstrPostsInfiniteOptions = {}) {
  const { nostr } = useNostr();
  const { limit = 20 } = options;

  return useInfiniteQuery({
    queryKey: ['foxhole', 'posts', 'infinite', limit],
    queryFn: async ({ pageParam }) => {
      const filter: NostrFilter = {
        kinds: [1111],
        '#k': [WEB_KIND],
        limit,
      };

      if (pageParam) {
        filter.until = pageParam;
      }

      return nostr.query([filter], {
        signal: AbortSignal.timeout(10000),
      });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].created_at - 1;
    },
    initialPageParam: undefined as number | undefined,
    staleTime: 30 * 1000,
  });
}
