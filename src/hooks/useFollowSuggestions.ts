import { useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { useFollows } from './useFollows';
import { useCommunitySubscriptions } from './useCommunitySubscriptions';
import { HASHTAG_KIND } from '@/lib/foxhole';

export interface FollowSuggestion {
  pubkey: string;
  /** Number of dens in common with the current user */
  sharedDens: number;
  /** Total posts by this user in those dens */
  postCount: number;
  /** Relevance score for sorting */
  score: number;
}

interface UseFollowSuggestionsOptions {
  limit?: number;
}

/**
 * Suggest users to follow based on activity in the dens the current user subscribes to.
 * Excludes users already followed and the user themselves.
 *
 * Strategy:
 * 1. Get user's subscribed dens
 * 2. Fetch recent posts (kind 1111) in those dens
 * 3. Count unique authors, rank by shared dens & post volume
 * 4. Filter out already-followed users
 */
export function useFollowSuggestions(options: UseFollowSuggestionsOptions = {}) {
  const { limit = 5 } = options;
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { data: follows } = useFollows();
  const { data: subscriptions } = useCommunitySubscriptions();

  const denIdentifiers = subscriptions ?? [];

  const postsQuery = useQuery({
    queryKey: ['foxhole', 'follow-suggestions-posts', denIdentifiers.sort().join(',')],
    queryFn: async ({ signal }) => {
      if (denIdentifiers.length === 0) return [];

      // Fetch recent top-level posts from user's dens
      const events = await nostr.query(
        [{
          kinds: [1111],
          '#I': denIdentifiers,
          '#K': [HASHTAG_KIND],
          limit: 200,
        }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]) },
      );

      return events;
    },
    enabled: !!user && denIdentifiers.length > 0,
    staleTime: 60_000,
  });

  const suggestions = useMemo<FollowSuggestion[]>(() => {
    if (!user || !follows || !postsQuery.data) return [];

    const userPubkey = user.pubkey;

    // Track per-author: which dens they posted in, and how many posts
    const authorMap = new Map<string, { dens: Set<string>; postCount: number }>();

    for (const event of postsQuery.data) {
      const { pubkey } = event;

      // Skip self and already-followed
      if (pubkey === userPubkey || follows.has(pubkey)) continue;

      const identifier = event.tags.find(([name]) => name === 'I')?.[1];
      if (!identifier) continue;

      const existing = authorMap.get(pubkey) ?? { dens: new Set(), postCount: 0 };
      existing.dens.add(identifier);
      existing.postCount += 1;
      authorMap.set(pubkey, existing);
    }

    return Array.from(authorMap.entries())
      .map(([pubkey, data]) => ({
        pubkey,
        sharedDens: data.dens.size,
        postCount: data.postCount,
        // Weight shared dens heavily, then post count
        score: data.dens.size * 10 + Math.min(data.postCount, 20),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }, [user, follows, postsQuery.data, limit]);

  return {
    data: suggestions,
    isLoading: postsQuery.isLoading,
    isError: postsQuery.isError,
    error: postsQuery.error,
  };
}
