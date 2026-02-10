import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';

type VoteDirection = 'up' | 'down' | null;

/**
 * Fetch the current user's existing vote (NIP-25 reaction) on a specific event.
 * Returns the direction of their latest reaction, or null if they haven't voted.
 */
export function useUserVote(eventId: string | undefined) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const pubkey = user?.pubkey;

  return useQuery<VoteDirection>({
    queryKey: ['foxhole', 'user-vote', eventId, pubkey],
    queryFn: async ({ signal }) => {
      if (!eventId || !pubkey) return null;

      const reactions = await nostr.query(
        [{ kinds: [7], authors: [pubkey], '#e': [eventId], limit: 10 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) }
      );

      if (reactions.length === 0) return null;

      // Find the latest reaction
      const latest = reactions.reduce((a, b) =>
        a.created_at > b.created_at ? a : b
      );

      const content = latest.content.trim();
      if (content === '+' || content === '') return 'up';
      if (content === '-') return 'down';
      return null;
    },
    enabled: !!eventId && !!pubkey,
    staleTime: 60 * 1000,
  });
}
