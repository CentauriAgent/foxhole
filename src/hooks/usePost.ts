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

      // Throw (instead of returning null) so react-query retries: an event
      // may not be queryable for a few seconds after publishing while
      // relays index it.
      if (!events[0]) {
        throw new Error('Post not found');
      }

      return events[0];
    },
    enabled: !!eventId,
    retry: 2,
    retryDelay: (attempt) => 1000 * (attempt + 1),
    staleTime: 5 * 60 * 1000, // 5 minutes - posts don't change
  });
}
