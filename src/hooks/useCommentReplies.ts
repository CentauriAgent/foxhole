import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { denToIdentifier } from '@/lib/foxhole';

interface RepliesData {
  allReplies: NostrEvent[];
  directReplies: NostrEvent[];
  replyCount: number;
  getDirectReplies: (parentId: string) => NostrEvent[];
}

interface UseCommentRepliesOptions {
  limit?: number;
}

export function useCommentReplies(
  commentId: string | undefined,
  den: string,
  options: UseCommentRepliesOptions = {}
) {
  const { nostr } = useNostr();
  const { limit = 500 } = options;

  return useQuery<RepliesData>({
    queryKey: ['foxhole', 'comment-replies', commentId, den, limit],
    queryFn: async () => {
      if (!commentId) {
        return { allReplies: [], directReplies: [], replyCount: 0, getDirectReplies: () => [] };
      }

      const identifier = denToIdentifier(den);
      const baseFilter: Partial<NostrFilter> = {
        kinds: [1111],
        '#I': [identifier],
        '#k': ['1111'],
      };

      const allReplies: NostrEvent[] = [];
      const fetchedIds = new Set<string>();
      let currentLevelIds = [commentId];

      for (let i = 0; i < 10 && currentLevelIds.length > 0; i++) {
        const events = await nostr.query([{ ...baseFilter, '#e': currentLevelIds, limit }], {
          signal: AbortSignal.timeout(10000),
        });
        if (events.length === 0) break;
        const newEvents = events.filter(e => !fetchedIds.has(e.id));
        newEvents.forEach(e => fetchedIds.add(e.id));
        allReplies.push(...newEvents);
        currentLevelIds = newEvents.map(e => e.id);
      }

      const getDirectReplies = (parentId: string): NostrEvent[] => {
        return allReplies
          .filter(event => event.tags.find(([name]) => name === 'e')?.[1] === parentId)
          .sort((a, b) => a.created_at - b.created_at);
      };

      return {
        allReplies,
        directReplies: getDirectReplies(commentId),
        replyCount: allReplies.length,
        getDirectReplies,
      };
    },
    enabled: !!commentId,
    staleTime: 30 * 1000,
  });
}
