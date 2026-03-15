import { useMemo } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useBatchZaps } from './useBatchZaps';
import { useBatchPostVotes } from './usePostVotes';
import { useBatchReplyCounts } from './usePostReplies';
import type { DenPost } from './useDenPostsInfinite';

/**
 * Fetch pinned posts by event IDs and compute metrics.
 * Returns them in the same order as the input IDs.
 */
export function usePinnedPosts(eventIds: string[], denName: string | undefined) {
  const { nostr } = useNostr();

  const { data: events, isLoading } = useQuery({
    queryKey: ['foxhole', 'pinned-posts', eventIds],
    queryFn: async ({ signal }) => {
      if (eventIds.length === 0) return [] as NostrEvent[];

      const results = await nostr.query(
        [{ kinds: [1111], ids: eventIds, limit: eventIds.length }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) },
      ).catch(() => [] as NostrEvent[]);

      return results;
    },
    enabled: eventIds.length > 0,
    staleTime: 30_000,
  });

  const foundIds = useMemo(() => (events ?? []).map((e) => e.id), [events]);
  const zapsQuery = useBatchZaps(foundIds);
  const votesQuery = useBatchPostVotes(foundIds);
  const repliesQuery = useBatchReplyCounts(foundIds, denName ?? '');

  const pinnedPosts = useMemo<DenPost[]>(() => {
    if (!events || events.length === 0) return [];
    const zapsMap = zapsQuery.data ?? new Map();
    const votesMap = votesQuery.data ?? new Map();
    const repliesMap = repliesQuery.data ?? new Map();

    const eventsMap = new Map(events.map((e) => [e.id, e]));

    // Return in the order of eventIds
    return eventIds
      .map((id) => eventsMap.get(id))
      .filter((e): e is NostrEvent => !!e)
      .map((event) => {
        const zapData = zapsMap.get(event.id) ?? { zapCount: 0, totalSats: 0, zaps: [] };
        const voteData = votesMap.get(event.id) ?? { upvotes: 0, downvotes: 0, score: 0, reactions: [] };
        const replyCount = repliesMap.get(event.id) ?? 0;
        return {
          event,
          metrics: {
            totalSats: zapData.totalSats,
            zapCount: zapData.zapCount,
            upvotes: voteData.upvotes,
            downvotes: voteData.downvotes,
            score: voteData.score,
            replyCount,
            createdAt: event.created_at,
          },
        };
      });
  }, [events, eventIds, zapsQuery.data, votesQuery.data, repliesQuery.data]);

  return { data: pinnedPosts, isLoading };
}
