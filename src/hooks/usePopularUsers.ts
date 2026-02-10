import { useMemo } from 'react';
import type { NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { WEB_KIND, isFoxholeIdentifier } from '@/lib/foxhole';
import { getTimeRangeSince, type TimeRange } from '@/lib/hotScore';
import { useBatchZaps } from './useBatchZaps';
import { useBatchPostVotes } from './usePostVotes';

export interface PopularUser {
  pubkey: string;
  totalSats: number;
  totalPosts: number;
  totalComments: number;
  totalEngagement: number;
}

interface UsePopularUsersOptions {
  timeRange: TimeRange;
  limit?: number;
}

export function usePopularUsers(options: UsePopularUsersOptions) {
  const { nostr } = useNostr();
  const { timeRange, limit = 10 } = options;

  const contentQuery = useQuery({
    queryKey: ['foxhole', 'user-content-raw', timeRange],
    queryFn: async ({ signal }) => {
      const since = getTimeRangeSince(timeRange);
      const filter: NostrFilter = {
        kinds: [1111],
        '#K': [WEB_KIND],
        since,
        limit: 150,
      };

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
      });

      return events.filter((event) => {
        const identifier = event.tags.find(([name]) => name === 'I')?.[1];
        return identifier && isFoxholeIdentifier(identifier);
      });
    },
    staleTime: 30 * 1000,
  });

  const allContent = contentQuery.data ?? [];
  const contentIds = allContent.map((e) => e.id);

  const zapsQuery = useBatchZaps(contentIds);
  const votesQuery = useBatchPostVotes(contentIds);

  const users = useMemo<PopularUser[]>(() => {
    if (!contentQuery.data || contentQuery.data.length === 0) return [];

    const zapsMap = zapsQuery.data ?? new Map();
    const votesMap = votesQuery.data ?? new Map();

    const userMap = new Map<string, {
      totalSats: number; totalPosts: number; totalComments: number; totalEngagement: number;
    }>();

    for (const event of contentQuery.data) {
      const { pubkey } = event;
      const existing = userMap.get(pubkey) ?? { totalSats: 0, totalPosts: 0, totalComments: 0, totalEngagement: 0 };
      const kTag = event.tags.find(([name]) => name === 'k')?.[1];
      const isTopLevel = kTag === WEB_KIND;
      const zapData = zapsMap.get(event.id) ?? { zapCount: 0, totalSats: 0, zaps: [] };
      const voteData = votesMap.get(event.id) ?? { upvotes: 0, downvotes: 0, score: 0, reactions: [] };
      const engagement = zapData.totalSats * 0.1 + voteData.score;

      userMap.set(pubkey, {
        totalSats: existing.totalSats + zapData.totalSats,
        totalPosts: existing.totalPosts + (isTopLevel ? 1 : 0),
        totalComments: existing.totalComments + (isTopLevel ? 0 : 1),
        totalEngagement: existing.totalEngagement + engagement,
      });
    }

    return Array.from(userMap.entries())
      .map(([pubkey, data]) => ({ pubkey, ...data }))
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .slice(0, limit);
  }, [contentQuery.data, zapsQuery.data, votesQuery.data, limit]);

  const isLoading = contentQuery.isLoading || 
    (contentIds.length > 0 && (zapsQuery.isLoading || votesQuery.isLoading));

  return {
    data: users,
    isLoading,
    isError: contentQuery.isError || zapsQuery.isError || votesQuery.isError,
    error: contentQuery.error || zapsQuery.error || votesQuery.error,
  };
}
