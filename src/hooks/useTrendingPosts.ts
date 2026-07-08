import { useMemo } from 'react';
import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { HASHTAG_KIND, denToIdentifier, isTopLevelPost, getPostDen } from '@/lib/foxhole';
import { calculateHotScore, type PostMetrics } from '@/lib/hotScore';
import { useBatchZaps } from './useBatchZaps';
import { useBatchPostVotes } from './usePostVotes';
import { useBatchReplyCountsGlobal } from './useBatchReplyCountsGlobal';
import { useSubscribedDens } from './useCommunitySubscriptions';

export interface TrendingPost {
  event: NostrEvent;
  metrics: PostMetrics;
  hotScore: number;
  den: string | null;
}

interface UseTrendingPostsOptions {
  /** If provided, trending within this den only. Otherwise trending across subscribed dens. */
  denName?: string;
  /** Number of trending posts to return (default 5) */
  limit?: number;
}

/**
 * Fetch trending posts from the last 24 hours, scored by reactions + reposts + zaps + replies.
 * If denName is provided: trending within that den.
 * If not: trending across all subscribed dens (or all dens if not subscribed to any).
 */
export function useTrendingPosts(options: UseTrendingPostsOptions = {}) {
  const { denName, limit = 5 } = options;
  const { nostr } = useNostr();
  const { data: subscribedDens } = useSubscribedDens();

  const postsQuery = useQuery({
    queryKey: ['foxhole', 'trending-posts-raw', denName ?? 'all'],
    queryFn: async ({ signal }) => {
      const since = Math.floor(Date.now() / 1000) - 86400;
      const filter: NostrFilter = {
        kinds: [1111],
        '#k': [HASHTAG_KIND],
        limit: 100,
        since,
      };

      if (denName) {
        filter['#i'] = [denToIdentifier(denName)];
      }

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
      });

      return events.filter(isTopLevelPost).sort((a, b) => b.created_at - a.created_at);
    },
    staleTime: 60 * 1000, // 1 minute - trending can update less frequently
  });

  const posts = postsQuery.data ?? [];
  const postIds = posts.map((p) => p.id);

  const zapsQuery = useBatchZaps(postIds);
  const votesQuery = useBatchPostVotes(postIds);
  const repliesQuery = useBatchReplyCountsGlobal(postIds);

  const trendingPosts = useMemo<TrendingPost[]>(() => {
    if (!postsQuery.data || postsQuery.data.length === 0) return [];

    const zapsMap = zapsQuery.data ?? new Map();
    const votesMap = votesQuery.data ?? new Map();
    const repliesMap = repliesQuery.data ?? new Map();

    let filtered = postsQuery.data;

    // If no denName specified and user has subscriptions, filter to subscribed dens
    if (!denName && subscribedDens && subscribedDens.length > 0) {
      const subSet = new Set(subscribedDens);
      filtered = filtered.filter((event) => {
        const den = getPostDen(event);
        return den ? subSet.has(den) : false;
      });
    }

    const scored: TrendingPost[] = filtered.map((event) => {
      const zapData = zapsMap.get(event.id) ?? { zapCount: 0, totalSats: 0, zaps: [] };
      const voteData = votesMap.get(event.id) ?? { upvotes: 0, downvotes: 0, score: 0, reactions: [] };
      const replyCount = repliesMap.get(event.id) ?? 0;

      const metrics: PostMetrics = {
        totalSats: zapData.totalSats,
        zapCount: zapData.zapCount,
        upvotes: voteData.upvotes,
        downvotes: voteData.downvotes,
        replyCount,
        createdAt: event.created_at,
      };

      return {
        event,
        metrics,
        hotScore: calculateHotScore(metrics),
        den: getPostDen(event),
      };
    });

    return scored.sort((a, b) => b.hotScore - a.hotScore).slice(0, limit);
  }, [postsQuery.data, zapsQuery.data, votesQuery.data, repliesQuery.data, denName, subscribedDens, limit]);

  return {
    data: trendingPosts,
    isLoading: postsQuery.isLoading,
    isMetricsLoading: postIds.length > 0 && (zapsQuery.isLoading || votesQuery.isLoading || repliesQuery.isLoading),
    isError: postsQuery.isError,
    error: postsQuery.error,
  };
}
