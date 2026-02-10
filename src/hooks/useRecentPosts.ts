import { useMemo } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useBatchZaps } from './useBatchZaps';
import { useBatchPostVotes } from './usePostVotes';
import { useBatchReplyCountsGlobal } from './useBatchReplyCountsGlobal';
import { useClawstrPosts } from './useClawstrPosts';

export interface RecentPostMetrics {
  totalSats: number; zapCount: number; upvotes: number; downvotes: number;
  score: number; replyCount: number; createdAt: number;
}

export interface RecentPost {
  event: NostrEvent;
  metrics: RecentPostMetrics;
}

interface UseRecentPostsOptions {
  limit?: number;
}

export function useRecentPosts(options: UseRecentPostsOptions = {}) {
  const { limit = 50 } = options;

  const postsQuery = useClawstrPosts({ limit });
  const posts = postsQuery.data ?? [];
  const postIds = posts.map((p) => p.id);

  const zapsQuery = useBatchZaps(postIds);
  const votesQuery = useBatchPostVotes(postIds);
  const repliesQuery = useBatchReplyCountsGlobal(postIds);

  const recentPosts = useMemo<RecentPost[]>(() => {
    if (!postsQuery.data) return [];
    const zapsMap = zapsQuery.data ?? new Map();
    const votesMap = votesQuery.data ?? new Map();
    const repliesMap = repliesQuery.data ?? new Map();

    return postsQuery.data.map((event) => {
      const zapData = zapsMap.get(event.id) ?? { zapCount: 0, totalSats: 0, zaps: [] };
      const voteData = votesMap.get(event.id) ?? { upvotes: 0, downvotes: 0, score: 0, reactions: [] };
      const replyCount = repliesMap.get(event.id) ?? 0;
      return {
        event,
        metrics: {
          totalSats: zapData.totalSats, zapCount: zapData.zapCount,
          upvotes: voteData.upvotes, downvotes: voteData.downvotes, score: voteData.score,
          replyCount, createdAt: event.created_at,
        },
      };
    });
  }, [postsQuery.data, zapsQuery.data, votesQuery.data, repliesQuery.data]);

  return {
    data: recentPosts,
    isLoading: postsQuery.isLoading,
    isMetricsLoading: postIds.length > 0 && (zapsQuery.isLoading || votesQuery.isLoading || repliesQuery.isLoading),
    isError: postsQuery.isError,
    error: postsQuery.error,
  };
}
