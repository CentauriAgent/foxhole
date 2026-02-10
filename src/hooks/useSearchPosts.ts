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

/** Simple text search - checks content and tags */
function matchesQuery(event: NostrEvent, query: string): boolean {
  const q = query.toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  const content = event.content.toLowerCase();
  const tagText = event.tags.map(t => t.join(' ')).join(' ').toLowerCase();
  const searchable = content + ' ' + tagText;
  return terms.every(term => searchable.includes(term));
}

export function useSearchPosts(options: UseSearchPostsOptions) {
  const { nostr } = useNostr();
  const { query, den, limit = 50 } = options;

  return useQuery({
    queryKey: ['search', 'posts', query, den, limit],
    queryFn: async ({ signal }) => {
      // Build filter - fetch a large batch of kind 1111 posts and search client-side
      // NIP-50 search isn't reliably supported across relays for kind 1111
      const filter: NostrFilter = {
        kinds: [1111],
        '#K': [HASHTAG_KIND],
        limit: 500,
      };

      // If searching within a specific den, add the I tag filter
      if (den) {
        filter['#I'] = [`#${den.toLowerCase()}`];
      }

      const relays = [
        'wss://relay.ditto.pub',
        'wss://relay.primal.net',
        'wss://nos.lol',
      ];

      // Query multiple relays in parallel
      const results = await Promise.allSettled(
        relays.map(relay =>
          nostr.relay(relay).query([filter], {
            signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
          })
        )
      );

      // Merge and deduplicate
      const seen = new Set<string>();
      const events: NostrEvent[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          for (const event of result.value) {
            if (!seen.has(event.id)) {
              seen.add(event.id);
              events.push(event);
            }
          }
        }
      }

      // Client-side text search and filtering
      return events
        .filter(isFoxholePost)
        .filter((e) => matchesQuery(e, query))
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, limit);
    },
    enabled: query.trim().length > 0,
    staleTime: 30 * 1000,
  });
}
