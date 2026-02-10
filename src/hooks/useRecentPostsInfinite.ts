import { useMemo } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useBatchZaps } from './useBatchZaps';
import { useBatchPostVotes } from './usePostVotes';
import { useBatchReplyCountsGlobal } from './useBatchReplyCountsGlobal';
import { useFoxholePostsInfinite } from './useFoxholePostsInfinite';

export interface RecentPostMetrics {
  totalSats: number; zapCount: number; upvotes: number; downvotes: number;
  score: number; replyCount: number; createdAt: number;
}

export interface RecentPost {
  event: NostrEvent;
  metrics: RecentPostMetrics;
}

interface UseRecentPostsInfiniteOptions {
  limit?: number;
}

export function useRecentPostsInfinite(options: UseRecentPostsInfiniteOptions = {}) {
  const { limit = 20 } = options;

  const postsQuery = useFoxholePostsInfinite({ limit });

  const posts = useMemo(() => {
    if (!postsQuery.data?.pages) return [];
    const seen = new Set<string>();
    return postsQuery.data.pages.flat().filter(event => {
      if (!event.id || seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    });
  }, [postsQuery.data?.pages]);

  const postIds = posts.map((p) => p.id);
  const zapsQuery = useBatchZaps(postIds);
  const votesQuery = useBatchPostVotes(postIds);
  const repliesQuery = useBatchReplyCountsGlobal(postIds);

  const recentPosts = useMemo<RecentPost[]>(() => {
    if (posts.length === 0) return [];
    const zapsMap = zapsQuery.data ?? new Map();
    const votesMap = votesQuery.data ?? new Map();
    const repliesMap = repliesQuery.data ?? new Map();

    return posts.map((event) => {
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
  }, [posts, zapsQuery.data, votesQuery.data, repliesQuery.data]);

  return {
    data: recentPosts,
    isLoading: postsQuery.isLoading,
    isMetricsLoading: postIds.length > 0 && (zapsQuery.isLoading || votesQuery.isLoading || repliesQuery.isLoading),
    isError: postsQuery.isError,
    error: postsQuery.error,
    fetchNextPage: postsQuery.fetchNextPage,
    hasNextPage: postsQuery.hasNextPage,
    isFetchingNextPage: postsQuery.isFetchingNextPage,
  };
}
