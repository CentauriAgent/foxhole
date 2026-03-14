import { useMemo } from 'react';
import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { HASHTAG_KIND, isTopLevelPost } from '@/lib/foxhole';
import { useFollows } from './useFollows';
import { useCurrentUser } from './useCurrentUser';
import { useBatchZaps } from './useBatchZaps';
import { useBatchPostVotes } from './usePostVotes';
import { useBatchReplyCountsGlobal } from './useBatchReplyCountsGlobal';

export interface FollowingPost {
  event: NostrEvent;
  metrics: {
    totalSats: number; zapCount: number; upvotes: number; downvotes: number;
    score: number; replyCount: number; createdAt: number;
  };
}

interface UseFollowingFeedOptions {
  limit?: number;
}

export function useFollowingFeed(options: UseFollowingFeedOptions = {}) {
  const { limit = 50 } = options;
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { data: follows, isLoading: followsLoading } = useFollows();

  const followList = useMemo(() => {
    if (!follows?.size) return [];
    return Array.from(follows);
  }, [follows]);

  const postsQuery = useInfiniteQuery({
    queryKey: ['foxhole', 'following-feed', user?.pubkey, followList.length, limit],
    queryFn: async ({ pageParam, signal }) => {
      if (followList.length === 0) return [];

      const filter: NostrFilter = {
        kinds: [1111],
        '#k': [HASHTAG_KIND],
        authors: followList,
        limit,
      };

      if (pageParam) {
        filter.until = pageParam;
      }

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
    enabled: !!user && followList.length > 0,
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
  const repliesQuery = useBatchReplyCountsGlobal(postIds);

  const followingPosts = useMemo<FollowingPost[]>(() => {
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
    data: followingPosts,
    isLoading: followsLoading || postsQuery.isLoading,
    isLoggedIn: !!user,
    hasFollows: followList.length > 0,
    isError: postsQuery.isError,
    error: postsQuery.error,
    fetchNextPage: postsQuery.fetchNextPage,
    hasNextPage: postsQuery.hasNextPage,
    isFetchingNextPage: postsQuery.isFetchingNextPage,
  };
}
