import { useMemo } from 'react';
import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { WEB_KIND, denToIdentifier, isTopLevelPost } from '@/lib/foxhole';
import { useBatchZaps } from './useBatchZaps';
import { useBatchPostVotes } from './usePostVotes';
import { useBatchReplyCounts } from './usePostReplies';

export interface DenPostMetrics {
  totalSats: number; zapCount: number; upvotes: number; downvotes: number;
  score: number; replyCount: number; createdAt: number;
}

export interface DenPost {
  event: NostrEvent;
  metrics: DenPostMetrics;
}

interface UseDenPostsInfiniteOptions {
  limit?: number;
}

export function useDenPostsInfinite(den: string, options: UseDenPostsInfiniteOptions = {}) {
  const { nostr } = useNostr();
  const { limit = 20 } = options;

  const postsQuery = useInfiniteQuery({
    queryKey: ['foxhole', 'den-posts-infinite', den, limit],
    queryFn: async ({ pageParam, signal }) => {
      const identifier = denToIdentifier(den);
      const filter: NostrFilter = {
        kinds: [1111],
        '#i': [identifier],
        '#k': [WEB_KIND],
        limit,
      };
      if (pageParam) filter.until = pageParam;

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
      });

      return events.filter(isTopLevelPost).sort((a, b) => b.created_at - a.created_at);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].created_at - 1;
    },
    initialPageParam: undefined as number | undefined,
    staleTime: 30 * 1000,
  });

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
  const repliesQuery = useBatchReplyCounts(postIds, den);

  const denPosts = useMemo<DenPost[]>(() => {
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
    data: denPosts,
    isLoading: postsQuery.isLoading,
    isMetricsLoading: postIds.length > 0 && (zapsQuery.isLoading || votesQuery.isLoading || repliesQuery.isLoading),
    isError: postsQuery.isError,
    error: postsQuery.error,
    fetchNextPage: postsQuery.fetchNextPage,
    hasNextPage: postsQuery.hasNextPage,
    isFetchingNextPage: postsQuery.isFetchingNextPage,
  };
}
