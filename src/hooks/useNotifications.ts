import { useMemo } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { extractSatsFromZap, getZapSender } from './useBatchZaps';

export type NotificationType = 'reply' | 'zap' | 'reaction';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  event: NostrEvent;
  timestamp: number;
  /** For replies: the content of the reply */
  replyContent?: string;
  /** For zaps: amount in sats */
  zapAmount?: number;
  /** For zaps: optional comment */
  zapComment?: string;
  /** For zaps: sender pubkey (from zap request) */
  senderPubkey?: string;
  /** For reactions: the reaction content (+, ❤️, etc.) */
  reactionContent?: string;
  /** The referenced event id (what was replied to / zapped / reacted to) */
  targetEventId?: string;
}

interface UseNotificationsOptions {
  limit?: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { limit = 50 } = options;
  const pubkey = user?.pubkey;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', pubkey, limit],
    queryFn: async ({ signal }) => {
      if (!pubkey) return { replies: [], zaps: [], reactions: [] };

      const timeout = AbortSignal.timeout(8000);
      const combinedSignal = AbortSignal.any([signal, timeout]);

      // Fetch all three types in parallel
      const [replies, zapReceipts, reactions] = await Promise.all([
        // Replies: kind 1 or 1111 events that tag our pubkey
        nostr.query(
          [{ kinds: [1, 1111], '#p': [pubkey], limit: limit * 2 }],
          { signal: combinedSignal }
        ).catch(() => [] as NostrEvent[]),

        // Zap receipts where we are the recipient
        nostr.query(
          [{ kinds: [9735], '#p': [pubkey], limit: limit * 2 }],
          { signal: combinedSignal }
        ).catch(() => [] as NostrEvent[]),

        // Reactions to our events
        nostr.query(
          [{ kinds: [7], '#p': [pubkey], limit: limit * 2 }],
          { signal: combinedSignal }
        ).catch(() => [] as NostrEvent[]),
      ]);

      // Filter out our own events
      return {
        replies: replies.filter(e => e.pubkey !== pubkey),
        zaps: zapReceipts,
        reactions: reactions.filter(e => e.pubkey !== pubkey),
      };
    },
    enabled: !!pubkey,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const notifications = useMemo(() => {
    if (!data) return [];

    const items: NotificationItem[] = [];

    // Process replies
    for (const event of data.replies) {
      const targetEventId = event.tags.find(([t]) => t === 'e')?.[1];
      items.push({
        id: event.id,
        type: 'reply',
        event,
        timestamp: event.created_at,
        replyContent: event.content,
        targetEventId,
      });
    }

    // Process zaps
    for (const event of data.zaps) {
      const amount = extractSatsFromZap(event);
      if (amount === 0) continue;

      const senderPubkey = getZapSender(event);
      const targetEventId = event.tags.find(([t]) => t === 'e')?.[1];

      // Extract comment from zap request description
      let zapComment: string | undefined;
      const descriptionTag = event.tags.find(([t]) => t === 'description')?.[1];
      if (descriptionTag) {
        try {
          const zapRequest = JSON.parse(descriptionTag);
          if (zapRequest.content) {
            zapComment = zapRequest.content;
          }
        } catch {
          // ignore
        }
      }

      items.push({
        id: event.id,
        type: 'zap',
        event,
        timestamp: event.created_at,
        zapAmount: amount,
        zapComment,
        senderPubkey: senderPubkey ?? undefined,
        targetEventId,
      });
    }

    // Process reactions
    for (const event of data.reactions) {
      const targetEventId = event.tags.find(([t]) => t === 'e')?.[1];
      items.push({
        id: event.id,
        type: 'reaction',
        event,
        timestamp: event.created_at,
        reactionContent: event.content || '+',
        targetEventId,
      });
    }

    // Sort by timestamp descending, take limit
    items.sort((a, b) => b.timestamp - a.timestamp);
    return items.slice(0, limit);
  }, [data, limit]);

  const replies = useMemo(() => notifications.filter(n => n.type === 'reply'), [notifications]);
  const zaps = useMemo(() => notifications.filter(n => n.type === 'zap'), [notifications]);
  const reactions = useMemo(() => notifications.filter(n => n.type === 'reaction'), [notifications]);

  return {
    notifications,
    replies,
    zaps,
    reactions,
    isLoading,
    error,
    refetch,
  };
}
