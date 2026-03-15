import { useCallback, useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { useNostrPublish } from './useNostrPublish';
import { useDenMetadata } from './useDenMetadata';

/**
 * Kind 30078 — Application-specific data (NIP-78).
 * We store pinned posts with d-tag = `foxhole:pins:<denName>`.
 * The tags array contains ["e", eventId] for each pinned post.
 */
const DEN_PINS_KIND = 30078;
const MAX_PINS = 3;

function denPinsTag(denName: string): string {
  return `foxhole:pins:${denName.toLowerCase()}`;
}

/**
 * Hook to manage pinned posts for a den.
 * Only the den creator can pin/unpin posts.
 * Pins are stored as a NIP-78 kind 30078 replaceable event.
 */
export function useDenPins(denName: string | undefined) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const pubkey = user?.pubkey;
  const queryClient = useQueryClient();
  const publish = useNostrPublish();
  const { data: denMetadata } = useDenMetadata(denName);

  const canPin = !!pubkey && !!denMetadata && pubkey === denMetadata.creatorPubkey;

  const { data: pinsEvent, isLoading } = useQuery({
    queryKey: ['foxhole', 'den-pins', denName],
    queryFn: async ({ signal }) => {
      if (!denName || !denMetadata) return null;

      const dTag = denPinsTag(denName);
      const events = await nostr.query(
        [{ kinds: [DEN_PINS_KIND], '#d': [dTag], authors: [denMetadata.creatorPubkey], limit: 1 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) },
      ).catch(() => []);

      if (events.length === 0) return null;
      return events.sort((a, b) => b.created_at - a.created_at)[0];
    },
    enabled: !!denName && !!denMetadata,
    staleTime: 30_000,
  });

  const pins = useMemo(() => {
    if (!pinsEvent) return [] as string[];
    return pinsEvent.tags
      .filter(([t]) => t === 'e')
      .map(([, id]) => id);
  }, [pinsEvent]);

  const isPinned = useCallback(
    (eventId: string) => pins.includes(eventId),
    [pins],
  );

  const addPin = useCallback(
    async (eventId: string) => {
      if (!canPin || !denName) return;
      if (pins.length >= MAX_PINS) return;
      if (isPinned(eventId)) return;

      const newPins = [...pins, eventId];
      const dTag = denPinsTag(denName);

      await publish.mutateAsync({
        kind: DEN_PINS_KIND,
        content: '',
        tags: [
          ['d', dTag],
          ...newPins.map((id) => ['e', id]),
        ],
        created_at: Math.floor(Date.now() / 1000),
      } as any);

      queryClient.invalidateQueries({ queryKey: ['foxhole', 'den-pins', denName] });
    },
    [canPin, denName, pins, isPinned, publish, queryClient],
  );

  const removePin = useCallback(
    async (eventId: string) => {
      if (!canPin || !denName) return;
      if (!isPinned(eventId)) return;

      const newPins = pins.filter((id) => id !== eventId);
      const dTag = denPinsTag(denName);

      await publish.mutateAsync({
        kind: DEN_PINS_KIND,
        content: '',
        tags: [
          ['d', dTag],
          ...newPins.map((id) => ['e', id]),
        ],
        created_at: Math.floor(Date.now() / 1000),
      } as any);

      queryClient.invalidateQueries({ queryKey: ['foxhole', 'den-pins', denName] });
    },
    [canPin, denName, pins, isPinned, publish, queryClient],
  );

  return {
    pins,
    isPinned,
    addPin,
    removePin,
    canPin,
    isLoading,
    isAtLimit: pins.length >= MAX_PINS,
  };
}
