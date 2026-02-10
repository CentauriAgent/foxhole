import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { useBroadcastNostr } from './useBroadcastRelays';

const MUTE_LIST_KIND = 10000;

/**
 * Fetch the current user's mute list (kind 10000, NIP-51).
 * Queries across all broadcast relays (user's NIP-65 + app defaults)
 * to ensure we find the latest version.
 * Returns a Set of muted pubkeys for fast lookup.
 */
export function useMuteList() {
  const { user } = useCurrentUser();
  const pubkey = user?.pubkey;
  const { broadQuery } = useBroadcastNostr();

  return useQuery({
    queryKey: ['foxhole', 'mute-list', pubkey],
    queryFn: async () => {
      if (!pubkey) return new Set<string>();

      const events = await broadQuery(
        [{ kinds: [MUTE_LIST_KIND], authors: [pubkey], limit: 1 }],
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
 * Mute a user. Fetches the current kind-10000 list from all broadcast relays,
 * adds the pubkey, signs, and publishes to all broadcast relays.
 */
export function useMute() {
  const { user } = useCurrentUser();
  const { broadQuery, broadPublish } = useBroadcastNostr();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPubkey: string) => {
      if (!user) throw new Error('Not logged in');

      const events = await broadQuery(
        [{ kinds: [MUTE_LIST_KIND], authors: [user.pubkey], limit: 1 }],
      );

      const existing = events.sort((a, b) => b.created_at - a.created_at)[0];
      const currentTags: string[][] = existing?.tags ?? [];

      // Already muted?
      if (currentTags.some(([name, val]) => name === 'p' && val === targetPubkey)) return;

      const tags = [...currentTags, ['p', targetPubkey]];

      const signed = await user.signer.signEvent({
        kind: MUTE_LIST_KIND,
        content: existing?.content ?? '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      await broadPublish(signed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foxhole', 'mute-list'] });
    },
  });
}

/**
 * Unmute a user. Fetches the current kind-10000 list from all broadcast relays,
 * removes the pubkey, signs, and publishes to all broadcast relays.
 */
export function useUnmute() {
  const { user } = useCurrentUser();
  const { broadQuery, broadPublish } = useBroadcastNostr();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPubkey: string) => {
      if (!user) throw new Error('Not logged in');

      const events = await broadQuery(
        [{ kinds: [MUTE_LIST_KIND], authors: [user.pubkey], limit: 1 }],
      );

      const existing = events.sort((a, b) => b.created_at - a.created_at)[0];
      if (!existing) return;

      const tags = existing.tags.filter(
        ([name, val]) => !(name === 'p' && val === targetPubkey),
      );

      const signed = await user.signer.signEvent({
        kind: MUTE_LIST_KIND,
        content: existing.content ?? '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      await broadPublish(signed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foxhole', 'mute-list'] });
    },
  });
}
