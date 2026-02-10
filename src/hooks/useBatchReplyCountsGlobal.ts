import type { NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

/**
 * Get reply counts for multiple posts efficiently across all dens.
 */
export function useBatchReplyCountsGlobal(eventIds: string[]) {
  const { nostr } = useNostr();

  const stableIds = eventIds.length > 0 ? [...eventIds].sort() : [];
  const queryKeyHash = stableIds.length > 0 ? stableIds.join(',') : 'empty';

  return useQuery({
    queryKey: ['foxhole', 'batch-reply-counts-global', queryKeyHash],
    queryFn: async ({ signal }) => {
      if (eventIds.length === 0) {
        return new Map<string, number>();
      }

      const filter: NostrFilter = {
        kinds: [1111],
        '#k': ['1111'],
        '#e': eventIds,
        limit: 500,
      };

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
      });

      const countMap = new Map<string, number>();
      for (const id of eventIds) {
        countMap.set(id, 0);
      }
      for (const event of events) {
        const eTag = event.tags.find(([name]) => name === 'e');
        const parentId = eTag?.[1];
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
