import type { NostrFilter, NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { HASHTAG_KIND } from '@/lib/foxhole';

interface UseSearchPostsOptions {
  query: string;
  den?: string;
  limit?: number;
}

/** Check if event is a Foxhole NIP-73 hashtag post */
function isFoxholePost(event: NostrEvent): boolean {
  return event.tags.some(([name, value]) => name === 'K' && value === HASHTAG_KIND);
}

/** Check if event belongs to a specific den */
function isInDen(event: NostrEvent, den: string): boolean {
  const target = `#${den.toLowerCase()}`;
  return event.tags.some(([name, value]) => name === 'I' && value === target);
}

export function useSearchPosts(options: UseSearchPostsOptions) {
  const { nostr } = useNostr();
  const { query, den, limit = 50 } = options;

  return useQuery({
    queryKey: ['search', 'posts', query, den, limit],
    queryFn: async ({ signal }) => {
      // Query with just kind + search — relay may not support combining search with tag filters
      const filter: NostrFilter = {
        kinds: [1111],
        search: query,
        limit: limit * 2, // fetch extra since we filter client-side
      };

      const events = await nostr.relay('wss://relay.ditto.pub').query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
      });

      // Client-side filter: only Foxhole posts (K=#), optionally scoped to a den
      return events
        .filter(isFoxholePost)
        .filter((e) => !den || isInDen(e, den))
        .slice(0, limit);
    },
    enabled: query.trim().length > 0,
    staleTime: 30 * 1000,
  });
}
