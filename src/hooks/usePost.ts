import type { NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

/**
 * Fetch a single post by event ID.
 */
export function usePost(eventId: string | undefined) {
  const { nostr } = useNostr();

  return useQuery<NostrEvent | null>({
    queryKey: ['foxhole', 'post', eventId],
    queryFn: async ({ signal }) => {
      if (!eventId) return null;

      const events = await nostr.query(
        [{ kinds: [1111], ids: [eventId], limit: 1 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) }
      );

      return events[0] ?? null;
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes - posts don't change
  });
}
