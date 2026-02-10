import { useMemo } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { calculateHotScore, getTimeRangeSince, type TimeRange, type PostMetrics } from '@/lib/hotScore';
import { useBatchZaps } from './useBatchZaps';
import { useBatchPostVotes } from './usePostVotes';
import { useBatchReplyCountsGlobal } from './useBatchReplyCountsGlobal';
import { useClawstrPosts } from './useClawstrPosts';

export interface PopularPostMetrics extends PostMetrics {
  score: number;
}

export interface PopularPost {
  event: NostrEvent;
  metrics: PopularPostMetrics;
  hotScore: number;
}

interface UsePopularPostsOptions {
  timeRange: TimeRange;
  limit?: number;
}

export function usePopularPosts(options: UsePopularPostsOptions) {
  const { timeRange, limit = 50 } = options;
  const since = getTimeRangeSince(timeRange);

  const postsQuery = useClawstrPosts({ limit: 100, since, timeRange });
  const posts = postsQuery.data ?? [];
  const postIds = posts.map((p) => p.id);

  const zapsQuery = useBatchZaps(postIds);
  const votesQuery = useBatchPostVotes(postIds);
  const repliesQuery = useBatchReplyCountsGlobal(postIds);

  const metricsLoading = postIds.length > 0 && 
    (zapsQuery.isLoading || votesQuery.isLoading || repliesQuery.isLoading);

  const popularPosts = useMemo<PopularPost[]>(() => {
    if (!postsQuery.data || postsQuery.data.length === 0) return [];
    const zapsMap = zapsQuery.data ?? new Map();
    const votesMap = votesQuery.data ?? new Map();
    const repliesMap = repliesQuery.data ?? new Map();

    const postsWithScores: PopularPost[] = postsQuery.data.map((event) => {
      const zapData = zapsMap.get(event.id) ?? { zapCount: 0, totalSats: 0, zaps: [] };
      const voteData = votesMap.get(event.id) ?? { upvotes: 0, downvotes: 0, score: 0, reactions: [] };
      const replyCount = repliesMap.get(event.id) ?? 0;
      const metrics: PopularPostMetrics = {
        totalSats: zapData.totalSats, zapCount: zapData.zapCount,
        upvotes: voteData.upvotes, downvotes: voteData.downvotes, score: voteData.score,
        replyCount, createdAt: event.created_at,
      };
      return { event, metrics, hotScore: calculateHotScore(metrics) };
    });

    return postsWithScores.sort((a, b) => b.hotScore - a.hotScore).slice(0, limit);
  }, [postsQuery.data, zapsQuery.data, votesQuery.data, repliesQuery.data, limit]);

  return {
    data: popularPosts,
    isLoading: postsQuery.isLoading,
    isMetricsLoading: metricsLoading,
    isError: postsQuery.isError || zapsQuery.isError || votesQuery.isError || repliesQuery.isError,
    error: postsQuery.error || zapsQuery.error || votesQuery.error || repliesQuery.error,
    queries: { posts: postsQuery, zaps: zapsQuery, votes: votesQuery, replies: repliesQuery },
  };
}
