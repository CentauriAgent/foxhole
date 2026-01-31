import { useMemo } from 'react';
import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { AI_LABEL, WEB_KIND, subclawToIdentifier, isTopLevelPost } from '@/lib/clawstr';
import { useBatchZaps } from './useBatchZaps';
import { useBatchPostVotes } from './usePostVotes';
import { useBatchReplyCounts } from './usePostReplies';

export interface SubclawPostMetrics {
  totalSats: number;
  zapCount: number;
  upvotes: number;
  downvotes: number;
  score: number;
  replyCount: number;
  createdAt: number;
}

export interface SubclawPost {
  event: NostrEvent;
  metrics: SubclawPostMetrics;
}

interface UseSubclawPostsOptions {
  /** Show all content (AI + human) instead of AI-only */
  showAll?: boolean;
  /** Maximum number of posts to fetch */
  limit?: number;
}

/**
 * Fetch top-level posts for a specific subclaw with engagement metrics.
 * 
 * By default, only fetches AI-labeled content (NIP-32).
 * Set showAll=true to include human posts.
 */
export function useSubclawPosts(
  subclaw: string,
  options: UseSubclawPostsOptions = {}
) {
  const { nostr } = useNostr();
  const { showAll = false, limit = 50 } = options;

  // Step 1: Fetch posts
  const postsQuery = useQuery({
    queryKey: ['clawstr', 'subclaw-posts-raw', subclaw, showAll, limit],
    queryFn: async ({ signal }) => {
      const identifier = subclawToIdentifier(subclaw);
      
      const filter: NostrFilter = {
        kinds: [1111],
        '#i': [identifier],
        '#k': [WEB_KIND],
        limit,
      };

      // Add AI-only filters unless showing all content
      if (!showAll) {
        filter['#l'] = [AI_LABEL.value];
        filter['#L'] = [AI_LABEL.namespace];
      }

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
      });

      // Filter to only top-level posts (not replies)
      const topLevelPosts = events.filter(isTopLevelPost);

      // Sort by created_at descending (newest first)
      return topLevelPosts.sort((a, b) => b.created_at - a.created_at);
    },
    staleTime: 30 * 1000,
  });

  const posts = postsQuery.data ?? [];
  const postIds = posts.map((p) => p.id);

  // Step 2: Batch fetch engagement metrics
  const zapsQuery = useBatchZaps(postIds);
  const votesQuery = useBatchPostVotes(postIds);
  const repliesQuery = useBatchReplyCounts(postIds, subclaw, showAll);

  // Step 3: Combine data
  const subclawPosts = useMemo<SubclawPost[]>(() => {
    if (!postsQuery.data) return [];

    const zapsMap = zapsQuery.data ?? new Map();
    const votesMap = votesQuery.data ?? new Map();
    const repliesMap = repliesQuery.data ?? new Map();

    return postsQuery.data.map((event) => {
      const zapData = zapsMap.get(event.id) ?? { zapCount: 0, totalSats: 0, zaps: [] };
      const voteData = votesMap.get(event.id) ?? { upvotes: 0, downvotes: 0, score: 0, reactions: [] };
      const replyCount = repliesMap.get(event.id) ?? 0;

      const metrics: SubclawPostMetrics = {
        totalSats: zapData.totalSats,
        zapCount: zapData.zapCount,
        upvotes: voteData.upvotes,
        downvotes: voteData.downvotes,
        score: voteData.score,
        replyCount,
        createdAt: event.created_at,
      };

      return { event, metrics };
    });
  }, [postsQuery.data, zapsQuery.data, votesQuery.data, repliesQuery.data]);

  // Combine loading states
  const isLoading = postsQuery.isLoading || 
    (postIds.length > 0 && (zapsQuery.isLoading || votesQuery.isLoading || repliesQuery.isLoading));

  return {
    data: subclawPosts,
    isLoading,
    isError: postsQuery.isError,
    error: postsQuery.error,
  };
}
