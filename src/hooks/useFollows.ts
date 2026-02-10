import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { useBroadcastNostr } from './useBroadcastRelays';

/**
 * Fetch the current user's follow list (kind 3, NIP-02).
 * Queries across all broadcast relays (user's NIP-65 + app defaults)
 * to ensure we find the latest version of the contact list.
 * Returns a Set of followed pubkeys for fast lookup.
 */
export function useFollows() {
  const { user } = useCurrentUser();
  const pubkey = user?.pubkey;
  const { broadQuery } = useBroadcastNostr();

  return useQuery({
    queryKey: ['foxhole', 'follows', pubkey],
    queryFn: async () => {
      if (!pubkey) return new Set<string>();

      const events = await broadQuery(
        [{ kinds: [3], authors: [pubkey], limit: 1 }],
      );

      if (events.length === 0) return new Set<string>();

      // Use the newest event across all relays
      const event = events.sort((a, b) => b.created_at - a.created_at)[0];

      const followedPubkeys = event.tags
        .filter(([name]) => name === 'p')
        .map(([, value]) => value)
        .filter(Boolean);

      return new Set(followedPubkeys);
    },
    enabled: !!pubkey,
    staleTime: 30_000,
  });
}

/**
 * Check if the current user follows a specific pubkey.
 */
export function useIsFollowing(pubkey: string | undefined) {
  const { data: follows } = useFollows();
  if (!pubkey || !follows) return false;
  return follows.has(pubkey);
}

/**
 * Follow a user. Fetches the current kind-3 list from all broadcast relays,
 * adds the pubkey, signs, and publishes to all broadcast relays.
 *
 * This ensures we never lose follows by always working with the newest
 * contact list found across the user's NIP-65 relays and app defaults.
 */
export function useFollow() {
  const { user } = useCurrentUser();
  const { broadQuery, broadPublish } = useBroadcastNostr();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPubkey: string) => {
      if (!user) throw new Error('Not logged in');

      // Fetch current follow list from ALL broadcast relays
      const events = await broadQuery(
        [{ kinds: [3], authors: [user.pubkey], limit: 1 }],
      );

      const existing = events.sort((a, b) => b.created_at - a.created_at)[0];
      const currentTags: string[][] = existing?.tags ?? [];

      // Already following?
      if (currentTags.some(([name, val]) => name === 'p' && val === targetPubkey)) return;

      const tags = [...currentTags, ['p', targetPubkey]];

      // Sign and broadcast to all relays
      const signed = await user.signer.signEvent({
        kind: 3,
        content: existing?.content ?? '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      await broadPublish(signed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foxhole', 'follows'] });
    },
  });
}

/**
 * Unfollow a user. Fetches the current kind-3 list from all broadcast relays,
 * removes the pubkey, signs, and publishes to all broadcast relays.
 */
export function useUnfollow() {
  const { user } = useCurrentUser();
  const { broadQuery, broadPublish } = useBroadcastNostr();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPubkey: string) => {
      if (!user) throw new Error('Not logged in');

      const events = await broadQuery(
        [{ kinds: [3], authors: [user.pubkey], limit: 1 }],
      );

      const existing = events.sort((a, b) => b.created_at - a.created_at)[0];
      if (!existing) return;

      const tags = existing.tags.filter(
        ([name, val]) => !(name === 'p' && val === targetPubkey),
      );

      // Sign and broadcast to all relays
      const signed = await user.signer.signEvent({
        kind: 3,
        content: existing.content ?? '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      await broadPublish(signed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foxhole', 'follows'] });
    },
  });
}
