import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { useNostrPublish } from './useNostrPublish';

const MUTE_LIST_KIND = 10000;

/**
 * Fetch the current user's mute list (kind 10000, NIP-51).
 * Returns a Set of muted pubkeys for fast lookup.
 */
export function useMuteList() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const pubkey = user?.pubkey;

  return useQuery({
    queryKey: ['foxhole', 'mute-list', pubkey],
    queryFn: async ({ signal }) => {
      if (!pubkey) return new Set<string>();

      const events = await nostr.query(
        [{ kinds: [MUTE_LIST_KIND], authors: [pubkey], limit: 1 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) },
      );

      if (events.length === 0) return new Set<string>();

      const event = events.sort((a, b) => b.created_at - a.created_at)[0];

      const mutedPubkeys = event.tags
        .filter(([name]) => name === 'p')
        .map(([, value]) => value)
        .filter(Boolean);

      return new Set(mutedPubkeys);
    },
    enabled: !!pubkey,
    staleTime: 30_000,
  });
}

/**
 * Check if a pubkey is muted by the current user.
 */
export function useIsMuted(pubkey: string | undefined) {
  const { data: muteList } = useMuteList();
  if (!pubkey || !muteList) return false;
  return muteList.has(pubkey);
}

/**
 * Mute a user. Fetches the current kind-10000 list, adds the pubkey, and republishes.
 */
export function useMute() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPubkey: string) => {
      if (!user) throw new Error('Not logged in');

      const events = await nostr.query(
        [{ kinds: [MUTE_LIST_KIND], authors: [user.pubkey], limit: 1 }],
        { signal: AbortSignal.timeout(5000) },
      );

      const existing = events.sort((a, b) => b.created_at - a.created_at)[0];
      const currentTags: string[][] = existing?.tags ?? [];

      // Already muted?
      if (currentTags.some(([name, val]) => name === 'p' && val === targetPubkey)) return;

      const tags = [...currentTags, ['p', targetPubkey]];

      await publishEvent({ kind: MUTE_LIST_KIND, content: existing?.content ?? '', tags });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foxhole', 'mute-list'] });
    },
  });
}

/**
 * Unmute a user. Fetches the current kind-10000 list, removes the pubkey, and republishes.
 */
export function useUnmute() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPubkey: string) => {
      if (!user) throw new Error('Not logged in');

      const events = await nostr.query(
        [{ kinds: [MUTE_LIST_KIND], authors: [user.pubkey], limit: 1 }],
        { signal: AbortSignal.timeout(5000) },
      );

      const existing = events.sort((a, b) => b.created_at - a.created_at)[0];
      if (!existing) return;

      const tags = existing.tags.filter(
        ([name, val]) => !(name === 'p' && val === targetPubkey),
      );

      await publishEvent({ kind: MUTE_LIST_KIND, content: existing.content ?? '', tags });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foxhole', 'mute-list'] });
    },
  });
}
