import type { NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useChunkedBatchQuery } from '@/hooks/useChunkedBatchQuery';

/**
 * Get reply counts for multiple posts efficiently across all dens.
 */
export function useBatchReplyCountsGlobal(eventIds: string[]) {
  const { nostr } = useNostr();

  return useChunkedBatchQuery<number>(
    ['foxhole', 'batch-reply-counts-global'],
    eventIds,
    async (chunk, signal) => {
      const filter: NostrFilter = {
        kinds: [1111],
        '#k': ['1111'],
        '#e': chunk,
        limit: 500,
      };

      const events = await nostr.query([filter], { signal });

      const countMap = new Map<string, number>();
      for (const id of chunk) {
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
  );
}
