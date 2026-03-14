import { useCallback, useMemo } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { useNostrPublish } from './useNostrPublish';

/**
 * Hook to manage NIP-51 bookmark lists (kind 10003).
 * Fetches the user's bookmark list and provides toggle/check functions.
 */
export function useBookmarks() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const pubkey = user?.pubkey;
  const queryClient = useQueryClient();
  const publish = useNostrPublish();

  const { data: bookmarkEvent, isLoading } = useQuery({
    queryKey: ['bookmarks', pubkey],
    queryFn: async ({ signal }) => {
      if (!pubkey) return null;

      const timeout = AbortSignal.timeout(8000);
      const combinedSignal = AbortSignal.any([signal, timeout]);

      const events = await nostr.query(
        [{ kinds: [10003], authors: [pubkey], limit: 1 }],
        { signal: combinedSignal },
      ).catch(() => [] as NostrEvent[]);

      // Kind 10003 is replaceable, so we want the latest
      if (events.length === 0) return null;
      return events.sort((a, b) => b.created_at - a.created_at)[0];
    },
    enabled: !!pubkey,
    staleTime: 30_000,
  });

  const bookmarkedIds = useMemo(() => {
    if (!bookmarkEvent) return new Set<string>();
    return new Set(
      bookmarkEvent.tags
        .filter(([t]) => t === 'e')
        .map(([, id]) => id),
    );
  }, [bookmarkEvent]);

  const isBookmarked = useCallback(
    (eventId: string) => bookmarkedIds.has(eventId),
    [bookmarkedIds],
  );

  const toggleBookmark = useCallback(
    async (eventId: string) => {
      if (!pubkey) return;

      const currentTags = bookmarkEvent?.tags.filter(([t]) => t === 'e') ?? [];
      let newTags: string[][];

      if (isBookmarked(eventId)) {
        // Remove the bookmark
        newTags = currentTags.filter(([, id]) => id !== eventId);
      } else {
        // Add the bookmark
        newTags = [...currentTags, ['e', eventId]];
      }

      await publish.mutateAsync({
        kind: 10003,
        content: bookmarkEvent?.content ?? '',
        tags: newTags,
        created_at: Math.floor(Date.now() / 1000),
      } as any);

      // Invalidate to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ['bookmarks', pubkey] });
    },
    [pubkey, bookmarkEvent, isBookmarked, publish, queryClient],
  );

  return {
    bookmarkedIds,
    isBookmarked,
    toggleBookmark,
    isLoading,
  };
}
