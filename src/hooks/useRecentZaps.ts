import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { extractSatsFromZap, getZapSender, getZapRecipient } from './useBatchZaps';
import { HASHTAG_KIND, isTopLevelPost } from '@/lib/foxhole';

export interface RecentZap {
  zapReceipt: NostrEvent;
  targetEventId: string | null;
  senderPubkey: string | null;
  recipientPubkey: string | null;
  amount: number;
  timestamp: number;
}

interface UseRecentZapsOptions {
  limit?: number;
}

export function useRecentZaps(options: UseRecentZapsOptions = {}) {
  const { nostr } = useNostr();
  const { limit = 10 } = options;

  return useQuery({
    queryKey: ['foxhole', 'recent-zaps', limit],
    queryFn: async ({ signal }) => {
      const postFilter: NostrFilter = {
        kinds: [1111],
        '#K': [HASHTAG_KIND],
        limit: 50,
      };

      const posts = await nostr.query([postFilter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
      });

      const validPosts = posts.filter((event) => {
        if (!isTopLevelPost(event)) return false;
        const identifier = event.tags.find(([name]) => name === 'I')?.[1];
        return !!identifier;
      });

      if (validPosts.length === 0) return [];

      const postIds = validPosts.map((p) => p.id);

      const zapReceipts = await nostr.query(
        [{ kinds: [9735], '#e': postIds, limit: limit * 3 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) }
      );

      const sortedZaps = zapReceipts.sort((a, b) => b.created_at - a.created_at);
      const recentZaps: RecentZap[] = [];

      for (const zap of sortedZaps) {
        if (recentZaps.length >= limit) break;
        const targetEventId = zap.tags.find(([name]) => name === 'e')?.[1] ?? null;
        if (!targetEventId || !postIds.includes(targetEventId)) continue;
        const amount = extractSatsFromZap(zap);
        if (amount === 0) continue;
        recentZaps.push({
          zapReceipt: zap,
          targetEventId,
          senderPubkey: getZapSender(zap),
          recipientPubkey: getZapRecipient(zap),
          amount,
          timestamp: zap.created_at,
        });
      }

      return recentZaps;
    },
    staleTime: 30 * 1000,
  });
}
