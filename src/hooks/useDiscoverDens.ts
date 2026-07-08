import { useMemo } from 'react';
import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { HASHTAG_KIND, identifierToDen, isTopLevelPost } from '@/lib/foxhole';
import { useSubscribedDens } from './useCommunitySubscriptions';

export interface DiscoverDen {
  name: string;
  postCount: number;
  recentPosts: NostrEvent[];
}

/**
 * Discover dens the user hasn't joined yet.
 * Scans kind 1111 posts from the last 7 days to find the most active dens,
 * then filters out dens the user is already subscribed to.
 */
export function useDiscoverDens() {
  const { nostr } = useNostr();
  const { data: subscribedDens } = useSubscribedDens();

  const postsQuery = useQuery({
    queryKey: ['foxhole', 'discover-dens-raw'],
    queryFn: async ({ signal }) => {
      const since = Math.floor(Date.now() / 1000) - 7 * 86400;
      const filter: NostrFilter = {
        kinds: [1111],
        '#k': [HASHTAG_KIND],
        limit: 500,
        since,
      };

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
      });

      return events.filter(isTopLevelPost);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - discovery can be slower to update
  });

  const discoveredDens = useMemo<DiscoverDen[]>(() => {
    const posts = postsQuery.data ?? [];
    if (posts.length === 0) return [];

    const subscribedSet = new Set(subscribedDens ?? []);

    // Group posts by den
    const denMap = new Map<string, NostrEvent[]>();
    for (const event of posts) {
      const identifier = event.tags.find(([name]) => name === 'I')?.[1];
      if (!identifier) continue;
      const den = identifierToDen(identifier);
      if (!den) continue;

      // Skip dens the user is already subscribed to
      if (subscribedSet.has(den)) continue;

      const existing = denMap.get(den);
      if (existing) {
        existing.push(event);
      } else {
        denMap.set(den, [event]);
      }
    }

    // Convert to DiscoverDen array, sorted by post count
    return Array.from(denMap.entries())
      .map(([name, denPosts]) => {
        // Sort posts by most recent first
        const sorted = denPosts.sort((a, b) => b.created_at - a.created_at);
        return {
          name,
          postCount: denPosts.length,
          recentPosts: sorted.slice(0, 3), // Top 3 recent previews
        };
      })
      .sort((a, b) => b.postCount - a.postCount);
  }, [postsQuery.data, subscribedDens]);

  return {
    data: discoveredDens,
    isLoading: postsQuery.isLoading,
    isError: postsQuery.isError,
    error: postsQuery.error,
  };
}
