import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { useNostrPublish } from './useNostrPublish';

/**
 * Fetch the current user's follow list (kind 3, NIP-02).
 * Returns a Set of followed pubkeys for fast lookup.
 */
export function useFollows() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const pubkey = user?.pubkey;

  return useQuery({
    queryKey: ['foxhole', 'follows', pubkey],
    queryFn: async ({ signal }) => {
      if (!pubkey) return new Set<string>();

      const events = await nostr.query(
        [{ kinds: [3], authors: [pubkey], limit: 1 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) },
      );

      if (events.length === 0) return new Set<string>();

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
 * Follow a user. Fetches the current kind-3 list, adds the pubkey, and republishes.
 */
export function useFollow() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPubkey: string) => {
      if (!user) throw new Error('Not logged in');

      // Fetch current follow list
      const events = await nostr.query(
        [{ kinds: [3], authors: [user.pubkey], limit: 1 }],
        { signal: AbortSignal.timeout(5000) },
      );

      const existing = events.sort((a, b) => b.created_at - a.created_at)[0];
      const currentTags: string[][] = existing?.tags ?? [];

      // Already following?
      if (currentTags.some(([name, val]) => name === 'p' && val === targetPubkey)) return;

      const tags = [...currentTags, ['p', targetPubkey]];

      await publishEvent({ kind: 3, content: existing?.content ?? '', tags });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foxhole', 'follows'] });
    },
  });
}

/**
 * Unfollow a user. Fetches the current kind-3 list, removes the pubkey, and republishes.
 */
export function useUnfollow() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPubkey: string) => {
      if (!user) throw new Error('Not logged in');

      const events = await nostr.query(
        [{ kinds: [3], authors: [user.pubkey], limit: 1 }],
        { signal: AbortSignal.timeout(5000) },
      );

      const existing = events.sort((a, b) => b.created_at - a.created_at)[0];
      if (!existing) return;

      const tags = existing.tags.filter(
        ([name, val]) => !(name === 'p' && val === targetPubkey),
      );

      await publishEvent({ kind: 3, content: existing.content ?? '', tags });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foxhole', 'follows'] });
    },
  });
}
