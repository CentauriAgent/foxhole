import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { useNostrPublish } from './useNostrPublish';
import { identifierToDen } from '@/lib/foxhole';

const COMMUNITY_LIST_KIND = 10073;

/** Fetch the user's subscribed community identifiers from kind:10073 (DIP-05). */
export function useCommunitySubscriptions() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const pubkey = user?.pubkey;

  return useQuery({
    queryKey: ['foxhole', 'community-subscriptions', pubkey],
    queryFn: async ({ signal }) => {
      if (!pubkey) return [];

      const events = await nostr.query(
        [{ kinds: [COMMUNITY_LIST_KIND], authors: [pubkey], limit: 1 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) },
      );

      if (events.length === 0) return [];

      // Get the most recent event (replaceable)
      const event = events.sort((a, b) => b.created_at - a.created_at)[0];

      return event.tags
        .filter(([name]) => name === 'I')
        .map(([, value]) => value)
        .filter(Boolean);
    },
    enabled: !!pubkey,
    staleTime: 30_000,
  });
}

/** Get subscribed den names (parsed from identifiers). */
export function useSubscribedDens() {
  const { data: identifiers, ...rest } = useCommunitySubscriptions();

  const dens = (identifiers ?? [])
    .map(id => identifierToDen(id))
    .filter((d): d is string => d !== null);

  return { data: dens, ...rest };
}

/** Subscribe to a community den. */
export function useSubscribeToCommunity() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (identifier: string) => {
      if (!user) throw new Error('Not logged in');

      // Fetch current list
      const events = await nostr.query(
        [{ kinds: [COMMUNITY_LIST_KIND], authors: [user.pubkey], limit: 1 }],
        { signal: AbortSignal.timeout(5000) },
      );

      const existing = events.sort((a, b) => b.created_at - a.created_at)[0];
      const currentTags: string[][] = existing
        ? existing.tags.filter(([name]) => name === 'I')
        : [];

      // Already subscribed?
      if (currentTags.some(([, val]) => val === identifier)) return;

      const tags = [...currentTags, ['I', identifier]];

      await publishEvent({ kind: COMMUNITY_LIST_KIND, content: '', tags });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foxhole', 'community-subscriptions'] });
    },
  });
}

/** Unsubscribe from a community den. */
export function useUnsubscribeFromCommunity() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (identifier: string) => {
      if (!user) throw new Error('Not logged in');

      const events = await nostr.query(
        [{ kinds: [COMMUNITY_LIST_KIND], authors: [user.pubkey], limit: 1 }],
        { signal: AbortSignal.timeout(5000) },
      );

      const existing = events.sort((a, b) => b.created_at - a.created_at)[0];
      if (!existing) return;

      const tags = existing.tags.filter(
        ([name, val]) => !(name === 'I' && val === identifier),
      );

      await publishEvent({ kind: COMMUNITY_LIST_KIND, content: '', tags });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foxhole', 'community-subscriptions'] });
    },
  });
}
