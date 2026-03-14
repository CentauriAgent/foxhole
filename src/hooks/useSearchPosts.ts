import type { NostrFilter, NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { HASHTAG_KIND } from '@/lib/foxhole';

/** Relay that supports NIP-50 full-text search. */
const NIP50_RELAY = 'wss://relay.ditto.pub';

/** All relays used for client-side fallback search. */
const FALLBACK_RELAYS = [
  'wss://relay.ditto.pub',
  'wss://relay.primal.net',
  'wss://nos.lol',
];

export type SearchMode = 'relay' | 'local';

interface UseSearchPostsOptions {
  query: string;
  den?: string;
  limit?: number;
}

interface SearchResult {
  events: NostrEvent[];
  mode: SearchMode;
}

/** Check if event is a Foxhole NIP-73 hashtag post */
function isFoxholePost(event: NostrEvent): boolean {
  return event.tags.some(([name, value]) => name === 'K' && value === HASHTAG_KIND);
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

/** Try NIP-50 relay search first, fall back to client-side filtering. */
async function searchPosts(
  nostr: ReturnType<typeof useNostr>['nostr'],
  options: UseSearchPostsOptions,
  signal: AbortSignal,
): Promise<SearchResult> {
  const { query, den, limit = 50 } = options;

  // --- Attempt 1: NIP-50 relay search ---
  try {
    const filter: NostrFilter = {
      kinds: [1111],
      search: query,
      '#K': [HASHTAG_KIND],
      limit,
    };

    if (den) {
      filter['#I'] = [`#${den.toLowerCase()}`];
    }

    const events = await nostr.relay(NIP50_RELAY).query([filter], {
      signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
    });

    const filtered = events
      .filter(isFoxholePost)
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, limit);

    return { events: filtered, mode: 'relay' };
  } catch {
    // NIP-50 failed — fall through to client-side search
  }

  // --- Attempt 2: Client-side fallback ---
  const filter: NostrFilter = {
    kinds: [1111],
    '#K': [HASHTAG_KIND],
    limit: 500,
  };

  if (den) {
    filter['#I'] = [`#${den.toLowerCase()}`];
  }

  const results = await Promise.allSettled(
    FALLBACK_RELAYS.map(relay =>
      nostr.relay(relay).query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
      })
    )
  );

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

  const filtered = events
    .filter(isFoxholePost)
    .filter((e) => matchesQuery(e, query))
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, limit);

  return { events: filtered, mode: 'local' };
}

export function useSearchPosts(options: UseSearchPostsOptions) {
  const { nostr } = useNostr();
  const { query, den, limit = 50 } = options;

  return useQuery<SearchResult>({
    queryKey: ['search', 'posts', query, den, limit],
    queryFn: async ({ signal }) => {
      return searchPosts(nostr, { query, den, limit }, signal);
    },
    enabled: query.trim().length > 0,
    staleTime: 30 * 1000,
  });
}
