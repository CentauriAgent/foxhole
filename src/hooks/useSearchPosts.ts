import type { NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

interface UseSearchPostsOptions {
  query: string;
  limit?: number;
}

export function useSearchPosts(options: UseSearchPostsOptions) {
  const { nostr } = useNostr();
  const { query, limit = 50 } = options;

  return useQuery({
    queryKey: ['search', 'posts', query, limit],
    queryFn: async ({ signal }) => {
      const filter: NostrFilter = {
        kinds: [1111],
        search: query,
        limit,
      };

      const events = await nostr.relay('wss://relay.ditto.pub').query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
      });

      return events;
    },
    enabled: query.trim().length > 0,
    staleTime: 30 * 1000,
  });
}
