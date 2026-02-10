import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { subclawToIdentifier } from '@/lib/foxhole';

interface RepliesData {
  allReplies: NostrEvent[];
  directReplies: NostrEvent[];
  replyCount: number;
  getDirectReplies: (parentId: string) => NostrEvent[];
  hasMoreReplies: (parentId: string) => boolean;
}

interface UsePostRepliesOptions {
  limit?: number;
}

export function usePostReplies(
  postId: string | undefined,
  subclaw: string,
  options: UsePostRepliesOptions = {}
) {
  const { nostr } = useNostr();
  const { limit = 500 } = options;

  return useQuery<RepliesData>({
    queryKey: ['foxhole', 'post-replies', postId, subclaw, limit],
    queryFn: async () => {
      if (!postId) {
        return { allReplies: [], directReplies: [], replyCount: 0, getDirectReplies: () => [], hasMoreReplies: () => false };
      }

      const identifier = subclawToIdentifier(subclaw);
      const baseFilter: Partial<NostrFilter> = {
        kinds: [1111],
        '#I': [identifier],
        '#k': ['1111'],
      };

      const level1Events = await nostr.query([{ ...baseFilter, '#e': [postId], limit }], {
        signal: AbortSignal.timeout(10000),
      });

      const level1Ids = level1Events.map(e => e.id);
      let level2Events: NostrEvent[] = [];
      if (level1Ids.length > 0) {
        level2Events = await nostr.query([{ ...baseFilter, '#e': level1Ids, limit }], {
          signal: AbortSignal.timeout(10000),
        });
      }

      const allReplies = [...level1Events, ...level2Events];

      const getDirectReplies = (parentId: string): NostrEvent[] => {
        return allReplies
          .filter(event => event.tags.find(([name]) => name === 'e')?.[1] === parentId)
          .sort((a, b) => a.created_at - b.created_at);
      };

      const hasMoreReplies = (parentId: string): boolean => {
        return level2Events.some(e => e.id === parentId);
      };

      return {
        allReplies,
        directReplies: level1Events.sort((a, b) => a.created_at - b.created_at),
        replyCount: allReplies.length,
        getDirectReplies,
        hasMoreReplies,
      };
    },
    enabled: !!postId,
    staleTime: 30 * 1000,
  });
}

export function useBatchReplyCounts(eventIds: string[], subclaw: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['foxhole', 'batch-reply-counts', [...eventIds].sort().join(','), subclaw],
    queryFn: async ({ signal }) => {
      if (eventIds.length === 0) return new Map<string, number>();

      const identifier = subclawToIdentifier(subclaw);
      const filter: NostrFilter = {
        kinds: [1111],
        '#I': [identifier],
        '#k': ['1111'],
        '#e': eventIds,
        limit: 1000,
      };

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
      });

      const countMap = new Map<string, number>();
      for (const id of eventIds) countMap.set(id, 0);
      for (const event of events) {
        const parentId = event.tags.find(([name]) => name === 'e')?.[1];
        if (parentId && countMap.has(parentId)) {
          countMap.set(parentId, countMap.get(parentId)! + 1);
        }
      }
      return countMap;
    },
    enabled: eventIds.length > 0,
    staleTime: 60 * 1000,
  });
}
