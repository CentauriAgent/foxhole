import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { extractSatsFromZap, getZapSender, getZapRecipient } from './useBatchZaps';
import { HASHTAG_KIND, isTopLevelPost } from '@/lib/foxhole';
import { getTimeRangeSince, type TimeRange } from '@/lib/hotScore';

export interface LargestZap {
  zapReceipt: NostrEvent;
  targetEventId: string | null;
  senderPubkey: string | null;
  recipientPubkey: string | null;
  amount: number;
  timestamp: number;
}

interface UseLargestZapsOptions {
  limit?: number;
  timeRange?: TimeRange;
}

export function useLargestZaps(options: UseLargestZapsOptions = {}) {
  const { nostr } = useNostr();
  const { limit = 10, timeRange = '7d' } = options;

  return useQuery({
    queryKey: ['foxhole', 'largest-zaps', limit, timeRange],
    queryFn: async ({ signal }) => {
      const since = getTimeRangeSince(timeRange);
      const combinedSignal = AbortSignal.any([signal, AbortSignal.timeout(8000)]);

      const postFilter: NostrFilter = {
        kinds: [1111],
        '#K': [HASHTAG_KIND],
        limit: 100,
      };
      if (since) postFilter.since = since;

      const posts = await nostr.query([postFilter], { signal: combinedSignal });

      const validPosts = posts.filter((event) => {
        if (!isTopLevelPost(event)) return false;
        const identifier = event.tags.find(([name]) => name === 'I')?.[1];
        return !!identifier;
      });

      if (validPosts.length === 0) return [];

      const postIds = validPosts.map((p) => p.id);
      const zapFilter: NostrFilter = { kinds: [9735], '#e': postIds, limit: 100 };
      if (since) zapFilter.since = since;

      const zapReceipts = await nostr.query([zapFilter], { signal: combinedSignal });

      const postIdSet = new Set(postIds);
      const allZaps: LargestZap[] = [];
      for (const zap of zapReceipts) {
        const targetEventId = zap.tags.find(([name]) => name === 'e')?.[1] ?? null;
        if (!targetEventId || !postIdSet.has(targetEventId)) continue;
        const amount = extractSatsFromZap(zap);
        if (amount === 0) continue;
        allZaps.push({
          zapReceipt: zap,
          targetEventId,
          senderPubkey: getZapSender(zap),
          recipientPubkey: getZapRecipient(zap),
          amount,
          timestamp: zap.created_at,
        });
      }

      allZaps.sort((a, b) => b.amount - a.amount);
      return allZaps.slice(0, limit);
    },
    staleTime: 60 * 1000,
  });
}
